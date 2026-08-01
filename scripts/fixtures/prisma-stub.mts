// Stub for @/lib/prisma. The proof runs with no database and no DATABASE_URL.
// findMany returns [] so no attempt row resolves and the write is skipped, and createMany
// rejects if ever reached — together they prove a persistence fault never changes what the
// learner is told.
export const prisma = {
  koreanItem: { findMany: async () => [] },
  koreanAttempt: { createMany: async (): Promise<never> => { throw new Error("stubbed: no database in the proof harness"); } },
};
