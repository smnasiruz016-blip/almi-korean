// Stub for @/lib/prisma, used ONLY by scripts/writing-grader-proof.mts.
// Separate from prisma-stub.mts because this route needs count/findFirst/create rather than
// findMany/createMany, and because the rate limit is proved by DRIVING the count — a shared
// stub would have to grow a mode flag and stop being obvious.
//
// State on globalThis for the reason spelled out in anthropic-stub.mts: the proof and the
// route get two module instances, so a module-level `let` would leave the proof driving a
// counter the route never reads.

type State = { attemptCount: number; createThrows: boolean; created: unknown[] };

const KEY = "__almiKoreanPrismaWritingStub";
const g = globalThis as unknown as Record<string, State | undefined>;

const fresh = (): State => ({ attemptCount: 0, createThrows: false, created: [] });
const s = (): State => (g[KEY] ??= fresh());

export function __setAttemptCount(n: number): void { s().attemptCount = n; }
export function __setCreateThrows(v: boolean): void { s().createThrows = v; }
export function __reset(): void { g[KEY] = fresh(); }
export function __created(): unknown[] { return s().created; }

export const prisma = {
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
