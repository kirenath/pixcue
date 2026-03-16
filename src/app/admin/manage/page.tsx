// admin/manage/page.tsx — 内容管理

import Header from "@/components/Header";
import ManagePageClient from "./ManagePageClient";

export default function ManagePage() {
  return (
    <>
      <Header />
      <main>
        <ManagePageClient />
      </main>
    </>
  );
}
