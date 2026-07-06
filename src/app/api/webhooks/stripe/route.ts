import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { verifyRouterSignature } from "@/lib/router-auth";
import { prisma } from "@/lib/prisma";

// Stripe webhook: keep the subscription status in sync so hasPaidAccess() is accurate.
// Accepts EITHER an almi-billing-router HMAC (a forwarded event) OR a direct Stripe signature.
export async function POST(req: Request) {
  const body = await req.text(); // raw body required for signature verification
  let event: Stripe.Event;
  if (verifyRouterSignature(body, req.headers.get("x-almi-router-signature"))) {
    event = JSON.parse(body) as Stripe.Event; // trusted via the router's per-product HMAC
  } else {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    try {
      event = getStripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  async function syncSubscription(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
