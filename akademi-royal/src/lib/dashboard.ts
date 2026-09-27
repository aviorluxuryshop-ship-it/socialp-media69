import { prisma } from '@/lib/prisma';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { STUDENT_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/labels';

export type DashboardDrilldownRow = { id: string; label: string; sub: string; href: string };

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthEndInclusive(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getMonthlySummary() {
  const from = monthStart();
  const to = monthEndInclusive();

  const [newStudents, enrollments, expenses, payments, outstandingInstallments, pendingTasks] = await Promise.all([
    prisma.student.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.enrollmentPricing.findMany({ where: { enrollment: { enrolledAt: { gte: from, lte: to } } } }),
    prisma.expense.aggregate({ where: { expenseDate: { gte: from, lte: to }, status: { not: 'REJECTED' } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: from, lte: to } }, _sum: { amount: true } }),
    prisma.installment.findMany({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
  ]);

  const revenueThisMonth = enrollments.reduce((sum, e) => sum + Number(e.finalAmount), 0);
  const pendingTotal = outstandingInstallments.reduce((sum, i) => sum + (Number(i.amount) - Number(i.paidAmount)), 0);

  return {
    newStudents,
    revenueThisMonth,
    expensesThisMonth: Number(expenses._sum.amount ?? 0),
    collectedThisMonth: Number(payments._sum.amount ?? 0),
    pendingTotal,
    pendingTasks,
  };
}

export async function getRecentStudents(limit = 5) {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        take: 1,
        include: { courseGroup: { include: { course: true } }, pricing: { include: { installments: true } } },
      },
    },
  });

  return students.map((s) => {
    const enrollment = s.enrollments[0];
    const paid = enrollment?.pricing?.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0) ?? 0;
    const total = enrollment?.pricing ? Number(enrollment.pricing.finalAmount) : 0;
    return {
      id: s.id,
      fullName: s.fullName,
      createdAt: s.createdAt,
      courseName: enrollment?.courseGroup.course.name ?? null,
      enrollmentStatus: enrollment?.status ?? null,
      paid,
      remaining: total - paid,
      hasPricing: Boolean(enrollment?.pricing),
    };
  });
}

export async function getWeeklyIncomeExpense() {
  const days: { date: Date; iso: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ date: d, iso: d.toISOString().slice(0, 10) });
  }

  const rangeStart = days[0].date;
  const rangeEnd = new Date();
  rangeEnd.setHours(23, 59, 59, 999);

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.expense.findMany({ where: { expenseDate: { gte: rangeStart, lte: rangeEnd }, status: { not: 'REJECTED' } } }),
  ]);

  return days.map(({ date, iso }) => {
    const income = payments
      .filter((p) => p.paidAt.toISOString().slice(0, 10) === iso)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const expense = expenses
      .filter((e) => e.expenseDate.toISOString().slice(0, 10) === iso)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { iso, label: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date), income, expense };
  });
}

export async function getDashboardDrilldowns(): Promise<Record<string, DashboardDrilldownRow[]>> {
  const from = monthStart();
  const to = monthEndInclusive();

  const [newStudents, enrollments, expenses, payments, pendingInstallments, pendingTasks] = await Promise.all([
    prisma.student.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { id: true, fullName: true, phone: true, status: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollmentPricing.findMany({
      where: { enrollment: { enrolledAt: { gte: from, lte: to } } },
      include: { enrollment: { include: { student: true, courseGroup: { include: { course: true } } } } },
      orderBy: { enrollment: { enrolledAt: 'desc' } },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: from, lte: to }, status: { not: 'REJECTED' } },
      include: { category: true },
      orderBy: { expenseDate: 'desc' },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.installment.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      include: { pricing: { include: { enrollment: { include: { student: true, courseGroup: { include: { course: true } } } } } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.findMany({
      where: { status: { in: ['TODO', 'IN_PROGRESS'] } },
      include: { assignedTo: { select: { fullName: true } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  return {
    newStudents: newStudents.map((s) => ({
      id: s.id,
      label: s.fullName,
      sub: `${s.phone} · ${STUDENT_STATUS_LABELS[s.status]}`,
      href: `/students/${s.id}`,
    })),
    revenue: enrollments.map((e) => ({
      id: e.id,
      label: `${e.enrollment.student.fullName} — ${e.enrollment.courseGroup.course.name}`,
      sub: formatCurrencyTR(e.finalAmount as never),
      href: `/students/${e.enrollment.studentId}`,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      label: `${e.category.name}${e.description ? ` — ${e.description}` : ''}`,
      sub: `${formatCurrencyTR(e.amount as never)} · ${formatDateTR(e.expenseDate)}`,
      href: '/expenses',
    })),
    payments: payments.map((p) => ({
      id: p.id,
      label: p.student.fullName,
      sub: `${formatCurrencyTR(p.amount as never)} · ${formatDateTR(p.paidAt)}`,
      href: `/students/${p.student.id}`,
    })),
    pendingInstallments: pendingInstallments.map((i) => ({
      id: i.id,
      label: `${i.pricing.enrollment.student.fullName} — ${i.pricing.enrollment.courseGroup.course.name}`,
      sub: `${formatCurrencyTR(Number(i.amount) - Number(i.paidAmount))} · Vade: ${formatDateTR(i.dueDate)}`,
      href: `/students/${i.pricing.enrollment.studentId}`,
    })),
    pendingTasks: pendingTasks.map((t) => ({
      id: t.id,
      label: t.title,
      sub: `${TASK_PRIORITY_LABELS[t.priority]} · ${t.assignedTo?.fullName ?? 'Havuzda'}${t.dueDate ? ' · ' + formatDateTR(t.dueDate) : ''}`,
      href: `/tasks/${t.id}`,
    })),
  };
}
