'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { emptyToNull, parseDate } from '@/lib/form-utils';

export type FormState = { error?: string };

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export async function saveTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('tasks.create');

  const title = emptyToNull(formData.get('title'));
  if (!title) return { error: 'Görev başlığı zorunludur.' };

  const priorityRaw = String(formData.get('priority') ?? 'MEDIUM');
  const priority = PRIORITIES.includes(priorityRaw as TaskPriority) ? (priorityRaw as TaskPriority) : 'MEDIUM';
  const assignedToUserId = emptyToNull(formData.get('assignedToUserId'));

  await prisma.task.create({
    data: {
      title,
      description: emptyToNull(formData.get('description')),
      dueDate: parseDate(formData.get('dueDate')),
      priority,
      assignedToUserId,
      createdByUserId: user.id,
    },
  });

  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function updateTaskStatusAction(taskId: string, formData: FormData) {
  await requirePermission('tasks.edit');
  const statusRaw = String(formData.get('status') ?? '');
  if (!STATUSES.includes(statusRaw as TaskStatus)) return;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: statusRaw as TaskStatus,
      completedAt: statusRaw === 'DONE' ? new Date() : null,
    },
  });

  revalidatePath('/tasks');
}

export async function claimTaskAction(taskId: string) {
  const user = await requirePermission('tasks.edit');
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToUserId) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { assignedToUserId: user.id, claimedAt: new Date(), status: task.status === 'TODO' ? 'IN_PROGRESS' : task.status },
  });

  revalidatePath('/tasks');
}

export async function assignTaskAction(taskId: string, formData: FormData) {
  await requirePermission('tasks.edit');
  const userId = emptyToNull(formData.get('userId'));

  await prisma.task.update({
    where: { id: taskId },
    data: { assignedToUserId: userId, claimedAt: userId ? new Date() : null },
  });

  revalidatePath('/tasks');
}

export async function deleteTaskAction(taskId: string) {
  await requirePermission('tasks.delete');
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath('/tasks');
}

export async function addTaskCommentAction(taskId: string, formData: FormData) {
  const user = await requirePermission('tasks.edit');
  const comment = emptyToNull(formData.get('comment'));
  if (!comment) return;

  await prisma.taskComment.create({ data: { taskId, userId: user.id, comment } });
  revalidatePath(`/tasks/${taskId}`);
}
