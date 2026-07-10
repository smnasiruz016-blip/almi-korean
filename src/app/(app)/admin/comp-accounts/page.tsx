import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import {
  listCompAccounts,
  grantCompPro,
  revokeCompPro,
  extendCompPro,
} from "@/lib/admin/comp-accounts";
import { CompAccountsClient } from "./comp-accounts-client";

export const dynamic = "force-dynamic";

export default async function CompAccountsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) redirect("/account");

  const res = await listCompAccounts();

  return (
    <CompAccountsClient
      accounts={res.ok ? res.accounts : []}
      loadError={res.ok ? null : res.error}
      grantAction={grantCompPro}
      revokeAction={revokeCompPro}
      extendAction={extendCompPro}
    />
  );
}
