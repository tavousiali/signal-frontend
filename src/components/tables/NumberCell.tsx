export default function NumberCell({ value }: { value: number | string }) {
  const isNegative = typeof value === "number" && value < 0;
  const displayValue =
    typeof value === "number" ? Math.abs(value).toLocaleString() : value;

  return (
    <div
      key={value}
      data-negative={isNegative ? "true" : undefined}
      className="inline-block p-1 text-right-dir-ltr"
    >
      {displayValue}
    </div>
  );
}
