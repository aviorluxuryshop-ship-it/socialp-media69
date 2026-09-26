import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatDateTR } from '@/lib/form-utils';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/labels';
import { TaskStatusSelect } from '../TaskStatusSelect';
import { AssignSelect } from '../AssignSelect';
import { addTaskCommentAction, assignTaskAction, claimTaskAction, deleteTaskAction, updateTaskStatusAction } from '../actions';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('tasks.view');
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      comments: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!task) notFound();

  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const commentAuthorIds = [...new Set(task.comments.map((c) => c.userId))];
  const commentAuthors = await prisma.user.findMany({ where: { id: { in: commentAuthorIds } }, select: { id: true, name: true } });
  const authorNameById = new Map(commentAuthors.map((a) => [a.id, a.name]));

  const canEdit = hasPermission(user, 'tasks.edit');
  const canDelete = hasPermission(user, 'tasks.delete');

  return (
    <div>
      <PageHeader
        title={task.title}
        description={`Oluşturan: ${task.createdBy.name}${task.dueDate ? ` · Son Tarih: ${formatDateTR(task.dueDate)}` : ''}`}
        action={
          canDelete && (
            <ConfirmForm
              action={deleteTaskAction.bind(null, task.id)}
              confirmText="Bu görev silinsin mi?"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Sil
            </ConfirmForm>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Açıklama</h2>
          <p className="text-sm text-[var(--color-royal-dim)]">{task.description || 'Açıklama girilmemiş.'}</p>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--color-royal)]">Yorumlar</h2>
          <div className="space-y-2">
            {task.comments.length === 0 ? (
              <p className="text-sm text-[var(--color-royal-dim)]">Henüz yorum yok.</p>
            ) : (
              task.comments.map((c) => (
                <div key={c.id} className="rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm">
                  <p>{c.comment}</p>
                  <p className="mt-1 text-xs text-[var(--color-royal-dim)]">
                    {authorNameById.get(c.userId) ?? 'Bilinmeyen'} — {formatDateTR(c.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
          {canEdit && (
            <form action={addTaskCommentAction.bind(null, task.id)} className="mt-3 flex gap-2">
              <input
                name="comment"
                required
                placeholder="Yorum ekle…"
                className="flex-1 rounded-md border border-[var(--color-mist)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-royal)]"
              />
              <button type="submit" className="rounded-md bg-[var(--color-royal)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
                Ekle
              </button>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Detaylar</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-royal-dim)]">Öncelik</dt>
              <dd>
                <Badge>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-royal-dim)]">Durum</dt>
              <dd>{canEdit ? <TaskStatusSelect action={updateTaskStatusAction.bind(null, task.id)} defaultValue={task.status} /> : <Badge>{TASK_STATUS_LABELS[task.status]}</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-royal-dim)]">Atanan</dt>
              <dd>
                {canEdit ? (
                  <AssignSelect action={assignTaskAction.bind(null, task.id)} defaultValue={task.assignedTo?.id ?? ''} users={users} />
                ) : (
                  task.assignedTo?.name ?? 'Havuzda'
                )}
              </dd>
            </div>
          </dl>
          {!task.assignedTo && canEdit && (
            <form action={claimTaskAction.bind(null, task.id)} className="mt-4">
              <Button type="submit" className="w-full">
                Görevi Üstlen
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
