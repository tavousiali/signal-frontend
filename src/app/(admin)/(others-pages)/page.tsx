import TableClient from "@/components/tables/TableClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "لیست سهام",
  description: "لیست سهام",
};
async function getInitialData() {
  const res = await fetch(
    "http://localhost:3000/api/stocks?offset=0&limit=20",
    { cache: "no-store" },
  );
  return res.json();
}

export default async function Page() {
  const { rows } = await getInitialData();

  return <TableClient initialRows={rows} />;
}
