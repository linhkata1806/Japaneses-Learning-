type TatoebaSentence = {
  id: number;
  text: string;
  lang: string;
  license: string;
  owner: string | null;
  is_unapproved: boolean;
};

// Câu ví dụ hỗ trợ bài N5; không dùng dữ liệu bên ngoài làm đề thi khi chưa biên tập.
export async function GET() {
  const url = new URL("https://api.tatoeba.org/v1/sentences");
  url.search = new URLSearchParams({
    lang: "jpn",
    q: "飲みます",
    is_unapproved: "no",
    is_orphan: "no",
    sort: "words",
    limit: "8",
    showtrans: "none",
  }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Tatoeba returned ${response.status}`);
    const payload = await response.json() as { data?: TatoebaSentence[] };
    const examples = (payload.data || [])
      .filter(item => Number.isInteger(item.id) && item.lang === "jpn" && !item.is_unapproved &&
        typeof item.owner === "string" && item.owner.length > 0 &&
        ["CC BY 2.0 FR", "CC0 1.0"].includes(item.license) &&
        typeof item.text === "string" && item.text.length < 200)
      .slice(0, 2)
      .map(item => ({ text: item.text, author: item.owner, license: item.license, url: `https://tatoeba.org/en/sentences/show/${item.id}` }));
    return Response.json({ examples }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return Response.json({ examples: [], unavailable: true }, { status: 503 });
  }
}
