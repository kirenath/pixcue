"use client";

// 首页 — 画廊（客户端组件，协调 Header ↔ Gallery 状态）

import { useState } from "react";
import Header from "@/components/Header";
import Gallery from "@/components/Gallery";
import type { FilterState } from "@/components/FilterBar";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    platform: "",
    sort: "newest",
  });

  function handleSearchChange(value: string) {
    setSearch(value);
  }

  function handleFilterChange(newFilters: FilterState) {
    setFilters(newFilters);
  }

  return (
    <>
      <Header
        search={search}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <main style={{ paddingTop: "var(--space-6)" }}>
        <Gallery search={search} filters={filters} />
      </main>
    </>
  );
}
