import { requireChatGPTUser } from "../chatgpt-auth";
import { ContentReview } from "./review-client";
export const dynamic = "force-dynamic";
export const metadata = {title:"Content review — Stackscroll"};
export default async function ContentReviewPage() {
  await requireChatGPTUser("/content-review");
  return <ContentReview/>;
}
