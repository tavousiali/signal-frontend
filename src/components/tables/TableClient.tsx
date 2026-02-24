"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { columns } from "@/lib/columns";

type Props = {
  initialRows: any[];
};

export default function TableClient({ initialRows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<any[]>(initialRows);
  const [offset, setOffset] = useState(initialRows.length);
  const [hasMore, setHasMore] = useState(true);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");

  // ============================
  // Fetch More (Pagination)
  // ============================
  const fetchMore = useCallback(async () => {
    if (!hasMore) return;

    const res = await fetch(
      `/api/stocks?offset=${offset}&limit=20&sort=${sortKey ?? ""}&order=${order}&filter=${filter}`
    );

    const data = await res.json();

    if (data.rows.length === 0) {
      setHasMore(false);
      return;
    }

    setRows((prev) => [...prev, ...data.rows]);
    setOffset((prev) => prev + data.rows.length);
  }, [offset, sortKey, order, filter, hasMore]);

  // ============================
  // Reset on sort/filter change
  // ============================
  useEffect(() => {
    const reset = async () => {
      const res = await fetch(
        `/api/stocks?offset=0&limit=20&sort=${sortKey ?? ""}&order=${order}&filter=${filter}`
      );
      const data = await res.json();
      setRows(data.rows);
      setOffset(data.rows.length);
      setHasMore(true);
    };

    reset();
  }, [sortKey, order, filter]);

  // ============================
  // Virtualizer
  // ============================
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  // Trigger fetch when reaching bottom
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 &&
      hasMore
    ) {
      fetchMore();
    }
  }, [rowVirtualizer.getVirtualItems(), rows.length, hasMore, fetchMore]);

  // ============================
  // Sorting Handler
  // ============================
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setOrder("asc");
    }
  };

  // ============================
  // Render
  // ============================
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

      {/* Filter */}
      <div className="p-4 border-b border-stroke dark:border-strokedark">
        <input
          type="text"
          placeholder="جستجو..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-64 rounded border px-3 py-2 text-sm dark:bg-boxdark dark:text-white"
        />
      </div>

      {/* Header */}
      <div
        className="grid text-xs font-semibold bg-gray-100 dark:bg-meta-4 p-3 sticky top-0 z-10"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(120px,1fr))`,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            onClick={() => handleSort(col.key)}
            className="cursor-pointer select-none"
          >
            {col.label}
            {sortKey === col.key && (order === "asc" ? " 🔼" : " 🔽")}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];

            if (!row) {
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center justify-center text-sm text-gray-400"
                >
                  در حال بارگذاری...
                </div>
              );
            }

            return (
              <div
                key={virtualRow.key}
                className="grid text-xs border-b border-stroke dark:border-strokedark items-center px-3"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(120px,1fr))`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => {
                  const value = row[col.key];

                  return (
                    <div key={col.key}>
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}