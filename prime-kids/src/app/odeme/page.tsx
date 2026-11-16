import type { Metadata } from "next";
import Checkout from "@/components/Checkout";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const { durum } = await searchParams;
  return <Checkout failed={durum === "basarisiz"} />;
}
