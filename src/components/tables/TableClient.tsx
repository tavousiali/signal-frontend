"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { columns } from "@/lib/columns";
import NumberCell from "./NumberCell";
import Link from "next/link";

type Props = {
  initialRows: any[];
};

export default function TableClient({ initialRows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<any[]>(initialRows);
  const [offset, setOffset] = useState(initialRows.length);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");

  // ============================
  // Debounce Filter
  // ============================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 400);

    return () => clearTimeout(timer);
  }, [filter]);

  // ============================
  // Fetch More
  // ============================
  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/stocks?offset=${offset}&limit=20&sort=${sortKey ?? ""}&order=${order}&filter=${debouncedFilter}`,
      );

      if (res.status === 429) {
        setError("محدودیت درخواست‌ها فعال شده است. کمی بعد تلاش کنید.");
        setHasMore(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Fetch failed");
      }

      const data = await res.json();

      if (!data.rows?.length) {
        setHasMore(false);
        return;
      }

      setRows((prev) => [...prev, ...data.rows]);
      setOffset((prev) => prev + data.rows.length);
    } catch (err) {
      setError("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }, [offset, sortKey, order, debouncedFilter, hasMore, loading]);

  // ============================
  // Reset on sort/filter change
  // ============================
  useEffect(() => {
    const reset = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/stocks?offset=0&limit=20&sort=${sortKey ?? ""}&order=${order}&filter=${debouncedFilter}`,
        );

        const data = await res.json();

        setRows(data.rows || []);
        setOffset(data.rows?.length || 0);
        setHasMore(true);
      } catch {
        setError("خطا در دریافت اطلاعات");
      } finally {
        setLoading(false);
      }
    };

    reset();
  }, [sortKey, order, debouncedFilter]);

  // ============================
  // Virtualizer
  // ============================
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  // Trigger fetch when bottom reached
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];

    if (!lastItem) return;

    if (lastItem.index >= rows.length - 1 && hasMore && !loading) {
      fetchMore();
    }
  }, [rowVirtualizer, rows.length, hasMore, loading, fetchMore]);

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
    <div className="rounded-sm border bg-white dark:bg-boxdark">
      {/* Filter */}
      <div className="p-4 border-b">
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
        className="grid text-xs font-semibold bg-gray-100 p-3 sticky top-0 z-10 pl-4"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(120px,1fr))`,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            onClick={() => handleSort(col.key)}
            className="cursor-pointer select-none text-right-dir-ltr"
          >
            {col.label}
            {sortKey === col.key && (order === "asc" ? " 🔼" : " 🔽")}
          </div>
        ))}
      </div>

      {/* Body */}
      <div ref={parentRef} className="h-[600px] overflow-auto">
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
                  {loading ? "در حال بارگذاری..." : "—"}
                </div>
              );
            }

            return (
              <div
                key={virtualRow.key}
                className="grid text-xs border-b items-center px-3"
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
                  if (col.key === "l18") {
                    return (
                      <Link key={col.key} href={`/stock/${value}`}>
                        {value}
                      </Link>
                    );
                  }
                  return <NumberCell key={col.key} value={value} />;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-red-500 text-sm border-t">{error}</div>
      )}
    </div>
  );
}
