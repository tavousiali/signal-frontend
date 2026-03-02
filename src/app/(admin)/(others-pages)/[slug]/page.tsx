const Stock = async ({ params }: { params: { slug: string } }) => {
  const { slug: stock } = await params;
  return <div>{decodeURI(stock)}</div>;
};

export default Stock;
