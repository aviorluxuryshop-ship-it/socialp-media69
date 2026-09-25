export const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Öğrenciler' },
  { key: 'courses', label: 'Eğitimler' },
  { key: 'calendar', label: 'Takvim & Planlama' },
  { key: 'staff', label: 'Personeller' },
  { key: 'payments', label: 'Hesaplarım' },
  { key: 'expenses', label: 'Masraflar' },
  { key: 'tasks', label: 'Görevler' },
  { key: 'reports', label: 'Raporlar' },
  { key: 'settings', label: 'Ayarlar' },
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];

export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export function permCode(moduleKey: string, action: string) {
  return `${moduleKey}.${action}`;
}

export const EXTRA_PERMISSIONS = [{ code: 'expenses.approve', module: 'expenses', action: 'approve' }];

export const ALL_PERMISSIONS = [
  ...MODULES.flatMap((m) => ACTIONS.map((a) => ({ code: permCode(m.key, a), module: m.key, action: a }))),
  ...EXTRA_PERMISSIONS,
];

export const ROLE_DEFINITIONS: { name: string; description: string; permissions: string[] }[] = [
  {
    name: 'Süper Yönetici',
    description: 'Tüm modüllerde tam yetki, sistem ayarları dahil.',
    permissions: ALL_PERMISSIONS.map((p) => p.code),
  },
  {
    name: 'Yönetici',
    description: 'Ayarlar hariç tüm modüllerde tam yetki.',
    permissions: ALL_PERMISSIONS.filter((p) => p.module !== 'settings').map((p) => p.code),
  },
  {
    name: 'Eğitim Danışmanı',
    description: 'Öğrenci kaydı, eğitim/grup görüntüleme, takvim ve görevler.',
    permissions: [
      permCode('dashboard', 'view'),
      permCode('students', 'view'),
      permCode('students', 'create'),
      permCode('students', 'edit'),
      permCode('courses', 'view'),
      permCode('calendar', 'view'),
      permCode('calendar', 'create'),
      permCode('tasks', 'view'),
      permCode('tasks', 'create'),
      permCode('tasks', 'edit'),
    ],
  },
  {
    name: 'Eğitmen',
    description: 'Kendi grupları, ders programı ve yoklama.',
    permissions: [
      permCode('dashboard', 'view'),
      permCode('courses', 'view'),
      permCode('calendar', 'view'),
      permCode('tasks', 'view'),
      permCode('tasks', 'edit'),
    ],
  },
  {
    name: 'Muhasebe',
    description: 'Ödeme, cari hesap, masraf ve mali raporlar.',
    permissions: [
      permCode('dashboard', 'view'),
      permCode('students', 'view'),
      permCode('payments', 'view'),
      permCode('payments', 'create'),
      permCode('payments', 'edit'),
      permCode('expenses', 'view'),
      permCode('expenses', 'create'),
      permCode('expenses', 'edit'),
      'expenses.approve',
      permCode('reports', 'view'),
    ],
  },
  {
    name: 'Operasyon',
    description: 'Takvim, görevler ve genel koordinasyon.',
    permissions: [
      permCode('dashboard', 'view'),
      permCode('students', 'view'),
      permCode('staff', 'view'),
      permCode('calendar', 'view'),
      permCode('calendar', 'create'),
      permCode('calendar', 'edit'),
      permCode('tasks', 'view'),
      permCode('tasks', 'create'),
      permCode('tasks', 'edit'),
    ],
  },
];
