// Stub for @/lib/prisma, used ONLY by scripts/writing-grader-proof.mts.
// Separate from prisma-stub.mts because this route needs count/findFirst/create rather than
// findMany/createMany, and because the rate limit is proved by DRIVING the count — a shared
// stub would have to grow a mode flag and stop being obvious.
//
// State on globalThis for the reason spelled out in anthropic-stub.mts: the proof and the
// route get two module instances, so a module-level `let` would leave the proof driving a
// counter the route never reads.

// RR-399: also the AICostLedger (every model call writes a row) and FreeAiUse (the atomic "1 free", unique userId + kind).
type LedgerRow = { userId: string | null; feature: string; model: string; inputTokens: number; outputTokens: number; costCents: number; success: boolean; timestamp: Date };
type State = { attemptCount: number; createThrows: boolean; created: unknown[]; ledger: LedgerRow[]; freeUses: Set<string>; users: { id: string; createdAt: Date | null; subscriptionStatus: string | null; stripeSubscriptionId: string | null; compProUntil: Date | null }[] };

const KEY = "__almiKoreanPrismaWritingStub";
const g = globalThis as unknown as Record<string, State | undefined>;

const fresh = (): State => ({ attemptCount: 0, createThrows: false, created: [], ledger: [], freeUses: new Set(), users: [] });
const s = (): State => (g[KEY] ??= fresh());

export function __setAttemptCount(n: number): void { s().attemptCount = n; }
export function __setCreateThrows(v: boolean): void { s().createThrows = v; }
export function __reset(): void { g[KEY] = fresh(); }
export function __created(): unknown[] { return s().created; }
export function __ledger(): LedgerRow[] { return s().ledger; }
export function __freeUses(): string[] { return [...s().freeUses]; }
export function __setUsers(u: State["users"]): void { s().users = u; }

export const prisma = {
  aICostLedger: {
    create: async ({ data }: { data: Omit<LedgerRow, "timestamp"> }) => { s().ledger.push({ ...data, timestamp: new Date() }); return data; },
    findMany: async ({ where }: { where: { timestamp: { gte: Date } } }) =>
      s().ledger.filter((r) => r.userId !== null && r.timestamp >= where.timestamp.gte).map((r) => ({ userId: r.userId, costCents: r.costCents })),
  },
  freeAiUse: {
    create: async ({ data }: { data: { userId: string; kind: string } }) => {
      const k = `${data.userId}|${data.kind}`;
      if (s().freeUses.has(k)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
      s().freeUses.add(k);
      return data;
    },
    deleteMany: async ({ where }: { where: { userId: string; kind: string } }) => { s().freeUses.delete(`${where.userId}|${where.kind}`); return { count: 1 }; },
  },
  user: {
    findMany: async ({ where }: { where: { id: { in: string[] } } }) => s().users.filter((u) => where.id.in.includes(u.id)),
  },
  koreanAttempt: {
    count: async () => s().attemptCount,
    create: async (args: unknown) => {
      if (s().createThrows) throw new Error("stubbed: persistence fault");
      s().created.push(args);
      return { id: "proof-attempt" };
    },
  },
  koreanItem: {
    // A real row id, so the persistence path is EXERCISED rather than skipped — otherwise
    // "attempts are best-effort" would be proved by never running.
    findFirst: async () => ({ id: "proof-item-row" }),
  },
};
