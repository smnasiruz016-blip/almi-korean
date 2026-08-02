import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";
import { PRODUCT } from "@/lib/brand";

// Privacy policy (audit H5).
//
// ── WRITTEN FROM THE SCHEMA, NOT FROM A TEMPLATE ──
// Every field named below was read out of prisma/schema.prisma. A generic policy would have
// been faster and would have described a product that does not exist — the whole value of this
// page is that a reader can check it against what is actually stored.
//
// ── WHAT IT DELIBERATELY DOES NOT CLAIM ──
// There is NO self-serve account deletion and NO self-serve data export in this product today.
// The audit's H5 check reported both as present, but it matched on keywords — `export const
// metadata` satisfies its /export.*data/ pattern — and neither path exists in the code. So this
// page offers the mechanism that IS real: email a request and it is handled by hand. Promising
// a button that is not there would be the exact failure this page is supposed to prevent.

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What AlmiKorean collects, why, how long it is kept, and how to get a copy of your data or have it deleted.",
  alternates: { canonical: canonical("/privacy") },
};

const CONTACT = "almiworld@almiworld.com";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-almi-ink">{heading}</h2>
      <div className="mt-2 space-y-3 text-almi-text">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{PRODUCT.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Privacy</h1>
      <p className="mt-4 text-almi-text">
        This page says exactly what {PRODUCT.name} stores about you, why, and how to get it back or have it removed. It
        describes what the product actually does today — not what it might do later.
      </p>

      <Section heading="What we store">
        <p>Only two kinds of thing: your account, and your practice.</p>
        <p>
          <strong className="text-almi-ink">Your account.</strong> Your email address, a one-way hash of your password
          (never the password itself), your name if you gave one, your language preference, and whether and when you
          verified your email. If you subscribe, we also store the customer and subscription identifiers Stripe gives us
          and your subscription status and renewal date.
        </p>
        <p>
          <strong className="text-almi-ink">Your practice.</strong> For each practice or mock attempt: which item you
          answered, the options you chose or the text you wrote, the mark or estimate produced, and when. If you leave a
          review, its rating and text.
        </p>
        <p>
          We do not store card details. Payment is handled entirely by Stripe, and card numbers never reach our servers.
        </p>
      </Section>

      <Section heading="What we do not do">
        <p>
          There are no analytics, advertising or tracking scripts on this site, so there is nothing to consent to and no
          cookie banner to dismiss. We set one cookie: the session cookie that keeps you signed in.
        </p>
        <p>We do not sell your data, and we do not share it for advertising.</p>
      </Section>

      <Section heading="Who else sees it">
        <p>Only the services needed to run the product:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-almi-ink">Neon</strong> — the database that stores your account and attempts.</li>
          <li><strong className="text-almi-ink">Vercel</strong> — hosting; it processes requests and keeps short-lived operational logs.</li>
          <li><strong className="text-almi-ink">Stripe</strong> — subscriptions and payment. Stripe holds your card details, we do not.</li>
          <li><strong className="text-almi-ink">Resend</strong> — sends your verification and account emails.</li>
          <li>
            <strong className="text-almi-ink">Anthropic</strong> — when you ask for feedback on a TOPIK II Writing task,
            the text you wrote is sent to Anthropic&apos;s API to be assessed, and the criteria feedback comes back to
            you. It is not used to train models.
          </li>
        </ul>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Your account and your attempt history are kept for as long as your account exists, because your progress over
          time is the point of keeping them at all. Sign-in sessions and email-verification links expire on their own —
          verification links after 24 hours, sessions when they lapse or when you sign out.
        </p>
      </Section>

      <Section heading="Getting a copy, or getting it deleted">
        <p>
          You can ask for a copy of everything we hold about you, or ask us to delete your account and its attempt
          history. Email{" "}
          <a className="text-almi-coral hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you
          signed up with and we will do it.
        </p>
        <p className="text-sm text-almi-text-muted">
          Being straight with you: there is no button for this yet. The request is handled by hand, which is why we ask
          you to email from your own address. Deleting your account removes your attempts and reviews with it.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If what we collect changes, this page changes with it. It is written from the product&apos;s own database
          schema, so it is meant to be checkable rather than reassuring.
        </p>
      </Section>

      <p className="mt-10 text-sm text-almi-text-muted">
        Questions about any of this: <a className="text-almi-coral hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        {" "}
        <Link href="/about" className="text-almi-coral hover:underline">About {PRODUCT.name}</Link>.
      </p>
    </main>
  );
}
