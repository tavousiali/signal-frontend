import { NextResponse } from "next/server";
import { columns } from "@/lib/columns";

const API_URL =
  "https://BrsApi.ir/Api/Tsetmc/AllSymbols.php?key=BemAdgKdifLPD8TRvwXnXtjnHgPFRvzW&type=1";
// "https://brsapi.ir/Api/Tsetmc/Sample/Api_FreeBourseWebService.json";

const REVALIDATE_TIME = 1800; // 30 دقیقه

function formatLargeNumber(n: number) {
  if (typeof n !== "number" || !isFinite(n)) return n;

  const abs = Math.abs(n);

  if (abs < 1_000_000) return n.toLocaleString();

  if (abs < 1_000_000_000) {
    const v = n / 1_000_000;
    return `${v.toFixed(v % 1 === 0 ? 0 : 1)} M`;
  }

  const v = n / 1_000_000_000;
  return `${v.toFixed(v % 1 === 0 ? 0 : 1)} B`;
}

function calcPowerI(row: any) {
  const buy =
    row.Buy_I_Volume && row.Buy_CountI ? row.Buy_I_Volume / row.Buy_CountI : 0;

  const sell =
    row.Sell_I_Volume && row.Sell_CountI
      ? row.Sell_I_Volume / row.Sell_CountI
      : 0;

  if (!buy || !sell) return 0;

  return +(buy / sell).toFixed(2);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || 20);
  const sort = searchParams.get("sort");
  const order = searchParams.get("order") || "asc";
  const filter = searchParams.get("filter")?.toLowerCase() || "";

  let apiData: any[];

  try {
    const res = await fetch(API_URL, {
      next: { revalidate: REVALIDATE_TIME },
    });

    if (res.status === 429) {
      return NextResponse.json(
        {
          rows: [],
          total: 0,
          error: "RATE_LIMIT",
          message: "محدودیت تعداد درخواست‌ها به API اعمال شده است",
        },
        { status: 429 },
      );
    }

    if (!res.ok) {
      throw new Error("API request failed");
    }

    apiData = await res.json();
  } catch (error) {
    return NextResponse.json(
      {
        rows: [],
        total: 0,
        error: "FETCH_ERROR",
        message: "خطا در دریافت اطلاعات از سرور",
      },
      { status: 500 },
    );
  }

  let rows = apiData
    // حذف صندوق‌ها
    .filter((x: any) => !x.cs?.includes("صندوق"))
    // حذف نمادهای دارای نقطه
    .filter((x: any) => !x.l30?.includes("."))
    // محاسبات
    .map((row: any) => ({
      ...row,
      PowerI: calcPowerI(row),
      tvol: formatLargeNumber(row.tvol),
      tval: formatLargeNumber(row.tval),
    }));

  // Filter
  if (filter) {
    rows = rows.filter((item: any) =>
      columns.some((col) =>
        String(item[col.key] ?? "")
          .toLowerCase()
          .includes(filter),
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
    cachedAt: new Date().toISOString(),
  });
}
