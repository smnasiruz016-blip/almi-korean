import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBillingEnabled } from "@/lib/access";
import { createPortalSession } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!isBillingEnabled() || !user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription to manage yet." }, { status: 400 });
  }
  try {
    const url = await createPortalSession(user.stripeCustomerId);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
