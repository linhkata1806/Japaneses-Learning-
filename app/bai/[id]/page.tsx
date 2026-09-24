import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import LessonView from "@/components/lesson-view";
import type { GeneratedContent } from "@/lib/generated-content";

export const dynamic = "force-dynamic";

export default async function PublicLessonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!env.DB) notFound();
  const { id } = await params;
  const row = await env.DB.prepare(
    "SELECT c.payload_json AS payloadJson, p.display_name AS author FROM generated_contents c JOIN documents d ON d.id = c.document_id LEFT JOIN profiles p ON p.id = c.owner_id WHERE c.id = ? AND d.visibility = 'PUBLIC' AND c.status = 'USER_CONFIRMED' AND c.review_status = 'APPROVED'"
  ).bind(id).first<{ payloadJson: string; author: string | null }>();
  if (!row) notFound();
  return <main className="mx-auto max-w-3xl px-5 py-8"><a href="/thu-vien" className="text-sm font-semibold text-study-link">← Thư viện</a><div className="mt-6"><LessonView content={JSON.parse(row.payloadJson) as GeneratedContent} author={row.author} /></div></main>;
}
