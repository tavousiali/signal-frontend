async function getStock(symbol: any) {
  const res = await fetch(`http://localhost:3000/api/stocks?symbol=${symbol}`, {
    cache: "no-store",
  });
  return res.json();
}

const Stock = async ({ params }: { params: { slug: string } }) => {
  const { slug: symbol } = await params;
  const stock = await getStock(symbol);
  console.log("🚀 ~ Stock ~ stock:", stock);
  return <div>{decodeURI(symbol)}</div>;
};

export default Stock;
