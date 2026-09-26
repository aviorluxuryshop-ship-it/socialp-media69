import { prisma } from '@/lib/prisma';

export async function getAccountsWithBalances() {
  const accounts = await prisma.financialAccount.findMany({ orderBy: { name: 'asc' } });
  const sums = await prisma.financialAccountEntry.groupBy({ by: ['accountId', 'direction'], _sum: { amount: true } });

  const balances = new Map<string, number>();
  for (const acc of accounts) balances.set(acc.id, Number(acc.openingBalance));
  for (const s of sums) {
    const delta = Number(s._sum.amount ?? 0) * (s.direction === 'IN' ? 1 : -1);
    balances.set(s.accountId, (balances.get(s.accountId) ?? 0) + delta);
  }

  return accounts.map((a) => ({ ...a, balance: balances.get(a.id) ?? Number(a.openingBalance) }));
}

export async function getAccountBalance(accountId: string) {
  const account = await prisma.financialAccount.findUniqueOrThrow({ where: { id: accountId } });
  const sums = await prisma.financialAccountEntry.groupBy({ by: ['direction'], where: { accountId }, _sum: { amount: true } });
  let balance = Number(account.openingBalance);
  for (const s of sums) balance += Number(s._sum.amount ?? 0) * (s.direction === 'IN' ? 1 : -1);
  return balance;
}
