import { redirect } from "next/navigation";

export default async function LegacyAuthPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  redirect(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login");
}
