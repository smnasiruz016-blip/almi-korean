import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const TRIAL_DAYS = 7;

let cached: Stripe | null = null;
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.length < 20) throw new Error("STRIPE_SECRET_KEY missing/invalid");
  // Don't pin apiVersion — let the SDK use its own to avoid type drift on upgrades.
  cached = new Stripe(key, { typescript: true });
  return cached;
}

const baseUrl = () => process.env.APP_URL ?? "https://almikorean.almiworld.com";

export async function getOrCreateCustomer(user: { id: string; email: string; name: string | null }): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id, product: "almi-korean" },
  });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(user: { id: string; email: string; name: string | null }): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID missing");
  const customerId = await getOrCreateCustomer(user);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { userId: user.id } },
    success_url: `${baseUrl()}/account?checkout=success`,
    cancel_url: `${baseUrl()}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl()}/account`,
  });
  return portal.url;
}
