import { NextResponse } from "next/server";
import { columns } from "@/lib/columns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || 20);
  const sort = searchParams.get("sort");
  const order = searchParams.get("order") || "asc";
  const filter = searchParams.get("filter")?.toLowerCase() || "";

  const res = await fetch(
    "https://BrsApi.ir/Api/Tsetmc/AllSymbols.php?key=BemAdgKdifLPD8TRvwXnXtjnHgPFRvzW&type=1",
    { cache: "no-store" },
  );

  const data = await res.json();

  let rows = data
    .filter((x: any) => x.cs.indexOf("صندوق") === -1)
    .filter((x: any) => x.l30.indexOf(".") === -1);

  // Filter
  if (filter) {
    rows = rows.filter((item: any) =>
      columns.some((col) =>
        String(item[col.key]).toLowerCase().includes(filter),
      ),
    );
  }

  // Sort
  if (sort) {
    rows.sort((a: any, b: any) => {
      if (a[sort] < b[sort]) return order === "asc" ? -1 : 1;
      if (a[sort] > b[sort]) return order === "asc" ? 1 : -1;
      return 0;
    });
  }

  const paginated = rows.slice(offset, offset + limit);

  return NextResponse.json({
    rows: paginated,
    total: rows.length,
  });
}
