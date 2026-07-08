// Logged-in app shell. The family GlobalHeader + GlobalFooter come from the
// root layout — this wrapper adds the left Sidebar nav (desktop fixed rail /
// mobile drawer) and gates access with requireUser. Only genuinely private
// pages live under (app); the public SEO surface (home, /practice and its
// attempt pages, /mock, guides, study-in-korea, …) stays under the root layout
// so it keeps rendering to anonymous visitors and stays statically generated.

import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="bg-almi-bg">
      <Sidebar email={user.email} logout={logoutAction} />
      <main className="px-4 py-8 sm:px-6 md:ml-60 md:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
