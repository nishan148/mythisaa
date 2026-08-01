import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutPage } from "@/components/billing/checkout-page";

export const dynamic = "force-dynamic";

export default async function CheckoutRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=signup&next=/checkout");
  return <CheckoutPage />;
}