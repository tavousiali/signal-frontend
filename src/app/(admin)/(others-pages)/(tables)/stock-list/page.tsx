import TableClient from "@/components/tables/TableClient";

async function getInitialData() {
  const res = await fetch(
    "http://localhost:3000/api/stocks?offset=0&limit=20",
    { cache: "no-store" }
  );
  return res.json();
}

export default async function Page() {
  const { rows } = await getInitialData();

  return <TableClient initialRows={rows} />;
}