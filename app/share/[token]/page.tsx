import SharedLesson from "./shared-lesson";
import { RouteAccessGate } from "@/components/route-access-gate";

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RouteAccessGate><SharedLesson token={token} /></RouteAccessGate>;
}
