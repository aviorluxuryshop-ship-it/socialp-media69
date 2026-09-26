'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { EnrollmentStatus, Prisma, StudentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate, parseDecimal } from '@/lib/form-utils';

export type FormState = { error?: string };

const STUDENT_STATUSES: StudentStatus[] = ['LEAD', 'ACTIVE', 'COMPLETED', 'FROZEN', 'WITHDRAWN'];
const ENROLLMENT_STATUSES: EnrollmentStatus[] = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export async function saveStudentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = emptyToNull(formData.get('id'));
  await requirePermission(id ? 'students.edit' : 'students.create');

  const fullName = emptyToNull(formData.get('fullName'));
  const phone = emptyToNull(formData.get('phone'));
  if (!fullName || !phone) {
    return { error: 'Ad soyad ve telefon zorunludur.' };
  }

  const statusRaw = String(formData.get('status') ?? 'LEAD');
  const status = STUDENT_STATUSES.includes(statusRaw as StudentStatus) ? (statusRaw as StudentStatus) : 'LEAD';

  const data = {
    fullName,
    phone,
    nationalId: emptyToNull(formData.get('nationalId')),
    email: emptyToNull(formData.get('email')),
    birthDate: parseDate(formData.get('birthDate')),
    address: emptyToNull(formData.get('address')),
    source: emptyToNull(formData.get('source')),
    status,
  };

  const student = id ? await prisma.student.update({ where: { id }, data }) : await prisma.student.create({ data });

  revalidatePath('/students');
  revalidatePath(`/students/${student.id}`);
  redirect(`/students/${student.id}`);
}

export async function deleteStudentAction(id: string) {
  await requirePermission('students.delete');
  try {
    await prisma.student.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect(`/students/${id}?error=${encodeURIComponent('Bu öğrencinin eğitim kaydı veya ödeme geçmişi var, önce onları kaldırın.')}`);
    }
    throw err;
  }
  revalidatePath('/students');
  redirect('/students');
}

export async function addStudentNoteAction(studentId: string, formData: FormData) {
  const user = await requirePermission('students.edit');
  const note = emptyToNull(formData.get('note'));
  if (!note) return;

  await prisma.studentNote.create({ data: { studentId, authorUserId: user.id, note } });
  revalidatePath(`/students/${studentId}`);
}

export async function createEnrollmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission('students.edit');

  const studentId = emptyToNull(formData.get('studentId'));
  const courseGroupId = emptyToNull(formData.get('courseGroupId'));
  const totalAmount = parseDecimal(formData.get('totalAmount'));
  const discountAmount = parseDecimal(formData.get('discountAmount')) ?? 0;
  const installmentCount = Math.max(1, Number(formData.get('installmentCount')) || 1);

  if (!studentId || !courseGroupId || totalAmount === null) {
    return { error: 'Eğitim grubu ve toplam ücret zorunludur.' };
  }

  const finalAmount = Math.max(0, totalAmount - discountAmount);
  const baseInstallment = Math.floor((finalAmount / installmentCount) * 100) / 100;
  const enrolledAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.groupEnrollment.create({
        data: { studentId, courseGroupId, enrolledAt },
      });

      const pricing = await tx.enrollmentPricing.create({
        data: { enrollmentId: enrollment.id, totalAmount, discountAmount, finalAmount, installmentCount },
      });

      let remaining = finalAmount;
      for (let i = 0; i < installmentCount; i++) {
        const isLast = i === installmentCount - 1;
        const amount = isLast ? Math.round(remaining * 100) / 100 : baseInstallment;
        remaining -= amount;

        const dueDate = new Date(enrolledAt);
        dueDate.setMonth(dueDate.getMonth() + i);

        await tx.installment.create({
          data: { pricingId: pricing.id, sequenceNo: i + 1, amount, dueDate },
        });
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Bu öğrenci zaten bu gruba kayıtlı.' };
    }
    throw err;
  }

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function updateEnrollmentStatusAction(studentId: string, enrollmentId: string, formData: FormData) {
  await requirePermission('students.edit');
  const statusRaw = String(formData.get('status') ?? '');
  if (!ENROLLMENT_STATUSES.includes(statusRaw as EnrollmentStatus)) return;

  const data: { status: EnrollmentStatus; withdrawnAt?: Date | null } = { status: statusRaw as EnrollmentStatus };
  if (statusRaw === 'CANCELLED') data.withdrawnAt = new Date();

  await prisma.groupEnrollment.update({ where: { id: enrollmentId }, data });
  revalidatePath(`/students/${studentId}`);
}

export async function deleteEnrollmentAction(studentId: string, enrollmentId: string) {
  await requirePermission('students.delete');

  const pricing = await prisma.enrollmentPricing.findUnique({
    where: { enrollmentId },
    include: { installments: { include: { payments: true } } },
  });

  const hasPayments = pricing?.installments.some((i) => i.payments.length > 0 || Number(i.paidAmount) > 0);
  if (hasPayments) {
    redirect(`/students/${studentId}?error=${encodeURIComponent('Bu kayıt için ödeme alınmış, kayıt silinemez.')}`);
  }

  await prisma.$transaction(async (tx) => {
    if (pricing) {
      await tx.installment.deleteMany({ where: { pricingId: pricing.id } });
      await tx.enrollmentPricing.delete({ where: { id: pricing.id } });
    }
    await tx.groupEnrollment.delete({ where: { id: enrollmentId } });
  });

  revalidatePath(`/students/${studentId}`);
}
