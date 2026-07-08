import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Email verification",
  robots: { index: false },
};

const MESSAGES: Record<string, { heading: string; body: string }> = {
  success: {
    heading: "Email verified",
    body: "Thanks — your email is confirmed. TOPIK II Writing feedback and the sequenced mock are now unlocked with an active subscription.",
  },
  expired: {
    heading: "That link has expired",
    body: "Verification links last 24 hours. Sign in and use “Resend email” from your account to get a fresh one.",
  },
  invalid: {
    heading: "That link isn't valid",
    body: "The link may be incomplete or already used. Sign in and use “Resend email” from your account to get a fresh one.",
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const m = MESSAGES[status ?? ""] ?? MESSAGES.invalid;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-almi-line bg-almi-paper p-8">
        <h1 className="text-2xl font-bold text-almi-ink">{m.heading}</h1>
        <p className="mt-3 text-almi-text">{m.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Go to account</Link>
          <Link href="/practice" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">Practise</Link>
        </div>
      </div>
    </main>
  );
}
