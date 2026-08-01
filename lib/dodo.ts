import DodoPayments from "dodopayments";
import type { PlanId } from "@/lib/mythmind/billing";

const productEnv: Record<Exclude<PlanId, "free">, string | undefined> = {
  hustler: process.env.DODO_PRODUCT_HUSTLER,
  pro: process.env.DODO_PRODUCT_PRO,
  team: process.env.DODO_PRODUCT_TEAM,
  startup: process.env.DODO_PRODUCT_STARTUP,
};

export function getDodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not configured.");
  return new DodoPayments({ bearerToken, environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" ? "test_mode" : "live_mode" });
}

export function getDodoProductId(plan: Exclude<PlanId, "free">) {
  const id = productEnv[plan];
  if (!id) throw new Error(`DODO_PRODUCT_${plan.toUpperCase()} is not configured.`);
  return id;
}

export function appUrl() {
  return process.env.APP_URL || "https://mythmind.co";
}