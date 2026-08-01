// Stub for @/lib/prisma. The proof runs with no database and no DATABASE_URL.
// findUnique returns null so the attempt write is skipped, and create rejects if ever reached
// — together they prove a persistence fault never changes the learner's marks.
export const prisma = {
  koreanItem: { findUnique: async () => null },
  koreanAttempt: { create: async (): Promise<never> => { throw new Error("stubbed: no database in the proof harness"); } },
};
