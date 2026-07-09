import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started with AlmiKorean",
  description: "Create your AlmiKorean account and start a 7-day free trial of honest TOPIK practice.",
  alternates: { canonical: canonical("/signup") },
};

export default function Page() {
  return (
    <AuthCard
      heading="Create your account"
      sub="7-day free trial, then $12/month. Cancel anytime."
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
