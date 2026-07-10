// Shared shell for all /admin pages: an ADMIN_EMAILS gate + the AdminNav
// sub-nav so every admin page (Accounts, Comp Accounts) can reach the others.
// Individual pages keep their own gate too — this is the common chrome, not
// the only guard.

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (!isAdmin(user.email)) redirect("/account");

  return (
    <div className="space-y-6">
      <AdminNav />
      {children}
    </div>
  );
}
