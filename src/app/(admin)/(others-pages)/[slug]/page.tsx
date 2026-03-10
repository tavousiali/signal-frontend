import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  let { slug: symbol } = await params;
  symbol = decodeURI(symbol);
  return {
    title: symbol,
    description: symbol,
  };
}

const Stock = async ({ params }: { params: { slug: string } }) => {
  const { slug: symbol } = await params;
  return <div>{decodeURI(symbol)}</div>;
};

export default Stock;
