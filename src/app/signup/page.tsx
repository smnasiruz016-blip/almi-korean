import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started with AlmiKorean",
  description: "Create your AlmiKorean account and try free for 48 hours, no card: honest TOPIK practice, then $12/month.",
  alternates: { canonical: canonical("/signup") },
};

export default function Page() {
  return (
    <AuthCard
      heading="Create your account"
      sub="Try free for 48 hours, no card. Then $12/month. Cancel anytime."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-almi-coral hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
