/**
 * RR-397 · the ONE door for "free 48 hours, no card". Every route and page asks this instead of hasPaidAccess() where a free account
 * should get in. hasPaidAccess() is asked FIRST and is unchanged, so card trials, comps, the owner and paying users are exactly as before.
 *
 *   hasPracticeAccess(user)            practice WITHOUT AI: paid, or inside the free 48 hours
 *   aiGate(user, kind, countUsed)      ONE AI scoring of a kind: paid, or (free 48 hours AND not used yet AND today's free-AI budget left)
 *   lockedCopy(user)                   the honest message when the door is shut ("Your free 48 hours are over" + "Unlock for $12/month")
 *
 * The full mock is never part of the free 48 hours (as AlmiOET): it stays behind hasPaidAccess().
 */
import { hasPaidAccess } from "@/lib/access";
import { isTasteActive, isTasteOver, tasteMayUseAi, TASTE_AI_LIMITS, type TasteAiKind, type TasteUser } from "./taste";
import { freeAiAllowedToday, FREE_AI_BUSY_MESSAGE } from "./free-ai-budget";
import { TASTE_OVER_TITLE, UNLOCK_LABEL } from "./offer";
import { claimFreeAi, releaseFreeAi } from "./free-ai-claim";

/* RR-399 A3: the user's id is part of the access type, so the free use can be reserved for this account */
type AccessUser = Parameters<typeof hasPaidAccess>[0] & TasteUser & { id: string };

export function hasPracticeAccess(user: AccessUser): boolean {
  return hasPaidAccess(user) || isTasteActive(user);
}

const KIND_WORD: Record<TasteAiKind, string> = { WRITING: "Writing", SPEAKING: "Speaking" };

/** The honest line for a shut door. */
export function lockedCopy(user: TasteUser, now: number = Date.now()): { title: string; line: string; cta: string; href: string } {
  if (isTasteOver(user, now)) return { title: TASTE_OVER_TITLE, line: "Unlock everything for $12/month. Cancel anytime.", cta: UNLOCK_LABEL, href: "/pricing" };
  return { title: "Unlock everything", /* RR-397: an account with no free 48 hours (it subscribed or was comped before) is never offered free time it cannot get */ line: "$12/month. Cancel anytime.", cta: UNLOCK_LABEL, href: "/pricing" };
}

/** `release()` gives a reserved free use back; the route calls it when the AI call fails after the gate said ok (RR-399 A3). */
export type AiGateResult = { ok: true; free: boolean; release: () => Promise<void> } | { ok: false; status: 402; body: { ok: false; error: string; upgradeUrl: string; reason: string } };

const nothingToRelease = async (): Promise<void> => {};

/** May this user receive ONE AI scoring of `kind` now? `countUsed` returns how many AI scorings of this kind the account already
 *  RECEIVED (scored attempts, not clicks); it is only called for a free account inside its 48 hours. */
export async function aiGate(user: AccessUser, kind: TasteAiKind, countUsed: () => Promise<number>, now: number = Date.now()): Promise<AiGateResult> {
  if (hasPaidAccess(user)) return { ok: true, free: false, release: nothingToRelease };
  const shut = (reason: string, error: string): AiGateResult => ({ ok: false, status: 402, body: { ok: false, error, upgradeUrl: "/pricing", reason } });
  const usedMessage = `Your free 48 hours include ${TASTE_AI_LIMITS[kind]} AI-scored ${KIND_WORD[kind]}, and you have used it. ${UNLOCK_LABEL} for unlimited AI feedback.`;
  if (!isTasteActive(user, now)) {
    const c = lockedCopy(user, now);
    return shut(isTasteOver(user, now) ? "OVER" : "NO_TASTE", `${c.title}. ${c.line}`);
  }
  const usedOfKind = await countUsed();
  if (usedOfKind >= TASTE_AI_LIMITS[kind]) {
    return shut("USED", usedMessage);
  }
  const verdict = tasteMayUseAi({ user, kind, usedOfKind, budgetOk: await freeAiAllowedToday(now), now });
  if (!verdict.ok) return shut(verdict.reason, verdict.reason === "BUDGET" ? FREE_AI_BUSY_MESSAGE : `${lockedCopy(user, now).title}.`);
  // RR-399 A3: the count said "not used yet", but two requests at the same moment both see that. The free use is now RESERVED in
  // one INSERT that only one request can win (FreeAiUse, unique userId + kind) before any AI call is made.
  const claim = await claimFreeAi(user.id, kind);
  if (claim === "USED") return shut("USED", usedMessage);
  if (claim === "RESERVED") return { ok: true, free: true, release: () => releaseFreeAi(user.id, kind) };
  return { ok: true, free: true, release: nothingToRelease }; // UNAVAILABLE: the table is not migrated yet; the count decision stands
}
