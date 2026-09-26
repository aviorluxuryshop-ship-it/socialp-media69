import { prisma } from '@/lib/prisma';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels';
import type { PaymentMethod } from '@prisma/client';

export function defaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getIncomeReport(from: string, to: string) {
  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: new Date(from), lte: endOfDay(to) } },
    include: { account: { select: { name: true } } },
  });

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const byMethod = new Map<PaymentMethod, number>();
  const byAccount = new Map<string, number>();
  for (const p of payments) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
    byAccount.set(p.account.name, (byAccount.get(p.account.name) ?? 0) + Number(p.amount));
  }

  const pendingInstallments = await prisma.installment.findMany({ where: { status: { in: ['PENDING', 'PARTIAL'] } } });
  const totalPending = pendingInstallments.reduce((sum, i) => sum + (Number(i.amount) - Number(i.paidAmount)), 0);

  return {
    total,
    totalPending,
    byMethod: [...byMethod.entries()].map(([method, amount]) => ({ label: PAYMENT_METHOD_LABELS[method], amount })),
    byAccount: [...byAccount.entries()].map(([name, amount]) => ({ label: name, amount })),
    count: payments.length,
  };
}

export async function getExpenseReport(from: string, to: string) {
  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: new Date(from), lte: endOfDay(to) }, status: { not: 'REJECTED' } },
    include: { category: true },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category.name, (byCategory.get(e.category.name) ?? 0) + Number(e.amount));
  }

  return {
    total,
    count: expenses.length,
    byCategory: [...byCategory.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
  };
}

export async function getCourseReport(from: string, to: string) {
  const courses = await prisma.course.findMany({
    include: {
      groups: {
        include: {
          enrollments: {
            where: { enrolledAt: { gte: new Date(from), lte: endOfDay(to) } },
            include: { pricing: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return courses
    .map((c) => {
      const enrollments = c.groups.flatMap((g) => g.enrollments);
      const revenue = enrollments.reduce((sum, e) => sum + Number(e.pricing?.finalAmount ?? 0), 0);
      const statusCounts = { PENDING: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
      for (const e of enrollments) statusCounts[e.status]++;
      return { id: c.id, name: c.name, enrollmentCount: enrollments.length, revenue, statusCounts };
    })
    .filter((c) => c.enrollmentCount > 0)
    .sort((a, b) => b.revenue - a.revenue);
}
