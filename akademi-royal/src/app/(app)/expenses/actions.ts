'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate, parseDecimal } from '@/lib/form-utils';

export type FormState = { error?: string };

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER'];

export async function saveExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('expenses.create');

  const categoryId = emptyToNull(formData.get('categoryId'));
  const amount = parseDecimal(formData.get('amount'));
  const expenseDate = parseDate(formData.get('expenseDate'));
  if (!categoryId || amount === null || amount <= 0 || !expenseDate) {
    return { error: 'Kategori, tarih ve geçerli bir tutar zorunludur.' };
  }

  const methodRaw = String(formData.get('paymentMethod') ?? 'CASH');
  const paymentMethod = PAYMENT_METHODS.includes(methodRaw as PaymentMethod) ? (methodRaw as PaymentMethod) : 'CASH';

  await prisma.expense.create({
    data: {
      categoryId,
      amount,
      expenseDate,
      paymentMethod,
      description: emptyToNull(formData.get('description')),
      createdByUserId: user.id,
    },
  });

  revalidatePath('/expenses');
  redirect('/expenses');
}

export async function approveExpenseAction(id: string) {
  const user = await requirePermission('expenses.approve');
  await prisma.expense.update({ where: { id }, data: { status: 'APPROVED', approvedByUserId: user.id, approvedAt: new Date() } });
  revalidatePath('/expenses');
}

export async function rejectExpenseAction(id: string) {
  const user = await requirePermission('expenses.approve');
  await prisma.expense.update({ where: { id }, data: { status: 'REJECTED', approvedByUserId: user.id, approvedAt: new Date() } });
  revalidatePath('/expenses');
}

export async function markExpensePaidAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('expenses.approve');

  const id = emptyToNull(formData.get('id'));
  const accountId = emptyToNull(formData.get('accountId'));
  if (!id || !accountId) return { error: 'Hesap seçimi zorunludur.' };

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return { error: 'Masraf bulunamadı.' };
  if (expense.status !== 'APPROVED') return { error: 'Yalnızca onaylanmış masraflar ödenebilir.' };

  await prisma.$transaction([
    prisma.expense.update({ where: { id }, data: { status: 'PAID', accountId } }),
    prisma.financialAccountEntry.create({
      data: {
        accountId,
        direction: 'OUT',
        amount: expense.amount,
        description: `Masraf ödemesi${expense.description ? `: ${expense.description}` : ''}`,
        relatedExpenseId: id,
        createdByUserId: user.id,
      },
    }),
  ]);

  revalidatePath('/expenses');
  revalidatePath(`/payments/accounts/${accountId}`);
  redirect('/expenses');
}

export async function deleteExpenseAction(id: string) {
  await requirePermission('expenses.delete');
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.status === 'PAID') return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath('/expenses');
}

export async function saveExpenseCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission('expenses.create');
  const name = emptyToNull(formData.get('name'));
  if (!name) return { error: 'Kategori adı zorunludur.' };

  try {
    await prisma.expenseCategory.create({ data: { name } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Bu kategori zaten mevcut.' };
    }
    throw err;
  }

  revalidatePath('/expenses/categories');
  redirect('/expenses/categories');
}

export async function deleteExpenseCategoryAction(id: string) {
  await requirePermission('expenses.delete');
  try {
    await prisma.expenseCategory.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect(`/expenses/categories?error=${encodeURIComponent('Bu kategoriye ait masraf kayıtları var, önce onları kaldırın.')}`);
    }
    throw err;
  }
  revalidatePath('/expenses/categories');
}
