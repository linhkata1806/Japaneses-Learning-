import SharedLesson from "./shared-lesson";

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedLesson token={token} />;
}
