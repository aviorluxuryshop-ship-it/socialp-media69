import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui';
import { formatDateTR } from '@/lib/form-utils';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/labels';
import { assignTaskAction, claimTaskAction, updateTaskStatusAction } from './actions';
import { TaskStatusSelect } from './TaskStatusSelect';
import { AssignSelect } from './AssignSelect';

const PRIORITY_TONE = { LOW: 'default', MEDIUM: 'default', HIGH: 'warning', URGENT: 'danger' } as const;

const FILTERS = [
  { key: 'mine', label: 'Bana Atananlar' },
  { key: 'pool', label: 'Görev Havuzu' },
  { key: 'all', label: 'Tümü' },
  { key: 'done', label: 'Tamamlananlar' },
] as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requirePermission('tasks.view');
  const { filter = 'mine' } = await searchParams;

  const where: Prisma.TaskWhereInput =
    filter === 'pool'
      ? { assignedToUserId: null, status: { notIn: ['DONE', 'CANCELLED'] } }
      : filter === 'all'
        ? {}
        : filter === 'done'
          ? { status: 'DONE' }
          : { assignedToUserId: user.id, status: { notIn: ['DONE', 'CANCELLED'] } };

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true } }, createdBy: { select: { name: true } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const canEdit = hasPermission(user, 'tasks.edit');
  const canCreate = hasPermission(user, 'tasks.create');
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Görevler"
        description="Görev havuzu, atamalar ve durum takibi."
        action={canCreate ? <Button href="/tasks/new">+ Yeni Görev</Button> : undefined}
      />

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/tasks?filter=${f.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === f.key ? 'bg-[var(--color-royal)] text-white' : 'border border-[var(--color-mist)] text-[var(--color-royal)]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="Bu görünümde görev yok" />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const overdue = t.dueDate && t.dueDate < today && t.status !== 'DONE' && t.status !== 'CANCELLED';
            return (
              <div key={t.id} className="rounded-lg border border-[var(--color-mist)] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link href={`/tasks/${t.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {t.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-royal-dim)]">
                      <Badge tone={PRIORITY_TONE[t.priority]}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                      {t.dueDate && (
                        <span className={overdue ? 'font-medium text-red-600' : ''}>
                          Son Tarih: {formatDateTR(t.dueDate)} {overdue && '(Gecikti)'}
                        </span>
                      )}
                      <span>Oluşturan: {t.createdBy.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!t.assignedTo && canEdit ? (
                      <form action={claimTaskAction.bind(null, t.id)}>
                        <button type="submit" className="rounded-md bg-[var(--color-royal)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                          Görevi Üstlen
                        </button>
                      </form>
                    ) : canEdit ? (
                      <AssignSelect action={assignTaskAction.bind(null, t.id)} defaultValue={t.assignedTo?.id ?? ''} users={users} />
                    ) : (
                      <span className="text-xs text-[var(--color-royal-dim)]">{t.assignedTo?.name ?? 'Havuzda'}</span>
                    )}
                    {canEdit ? (
                      <TaskStatusSelect action={updateTaskStatusAction.bind(null, t.id)} defaultValue={t.status} />
                    ) : (
                      <Badge>{TASK_STATUS_LABELS[t.status]}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
