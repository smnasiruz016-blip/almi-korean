import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBillingEnabled } from "@/lib/access";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!isBillingEnabled()) return NextResponse.json({ error: "Billing is not enabled yet." }, { status: 503 });
  try {
    const url = await createCheckoutSession({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
