// prompt/[id]/page.tsx — 详情页

import Header from "@/components/Header";
import PromptDetailClient from "./PromptDetailClient";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main>
        <PromptDetailClient id={id} />
      </main>
    </>
  );
}
