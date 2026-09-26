'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FinancialAccountType, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDecimal } from '@/lib/form-utils';

export type FormState = { error?: string };

const ACCOUNT_TYPES: FinancialAccountType[] = ['CASH', 'BANK', 'POS', 'OTHER'];
const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER'];

export async function saveAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission('payments.create');

  const name = emptyToNull(formData.get('name'));
  const typeRaw = String(formData.get('type') ?? 'CASH');
  if (!name) return { error: 'Hesap adı zorunludur.' };
  const type = ACCOUNT_TYPES.includes(typeRaw as FinancialAccountType) ? (typeRaw as FinancialAccountType) : 'CASH';
  const openingBalance = parseDecimal(formData.get('openingBalance')) ?? 0;

  const account = await prisma.financialAccount.create({ data: { name, type, openingBalance } });

  revalidatePath('/payments');
  redirect(`/payments/accounts/${account.id}`);
}

export async function collectPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('payments.create');

  const installmentId = emptyToNull(formData.get('installmentId'));
  const accountId = emptyToNull(formData.get('accountId'));
  const amount = parseDecimal(formData.get('amount'));
  const methodRaw = String(formData.get('method') ?? 'CASH');
  const method = PAYMENT_METHODS.includes(methodRaw as PaymentMethod) ? (methodRaw as PaymentMethod) : 'CASH';

  if (!installmentId || !accountId || amount === null || amount <= 0) {
    return { error: 'Hesap ve geçerli bir tutar zorunludur.' };
  }

  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { pricing: { include: { enrollment: { select: { studentId: true } } } } },
  });
  if (!installment) return { error: 'Taksit bulunamadı.' };

  const remaining = Number(installment.amount) - Number(installment.paidAmount);
  if (amount > remaining + 0.01) {
    return { error: `Tutar kalan bakiyeden (${remaining.toFixed(2)} ₺) fazla olamaz.` };
  }

  const studentId = installment.pricing.enrollment.studentId;
  const receiptNo = emptyToNull(formData.get('receiptNo'));
  const note = emptyToNull(formData.get('note'));

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: { studentId, installmentId, accountId, amount, method, receiptNo, note, collectedByUserId: user.id },
    });

    const newPaid = Number(installment.paidAmount) + amount;
    const status = newPaid >= Number(installment.amount) - 0.01 ? 'PAID' : 'PARTIAL';
    await tx.installment.update({ where: { id: installmentId }, data: { paidAmount: newPaid, status } });

    await tx.financialAccountEntry.create({
      data: {
        accountId,
        direction: 'IN',
        amount,
        description: `Öğrenci tahsilatı${receiptNo ? ` (Makbuz: ${receiptNo})` : ''}`,
        createdByUserId: user.id,
      },
    });
  });

  revalidatePath('/payments');
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/payments/accounts/${accountId}`);
  redirect(`/students/${studentId}`);
}
