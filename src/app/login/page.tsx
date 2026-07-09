import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log in — AlmiKorean",
  description: "Log in to AlmiKorean to continue your TOPIK practice.",
  alternates: { canonical: canonical("/login") },
};

export default function Page() {
  return (
    <AuthCard
      heading="Welcome back"
      sub="Log in to continue."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-almi-coral hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthCard>
  );
}
