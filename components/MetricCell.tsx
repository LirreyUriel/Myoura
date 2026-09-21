type MetricCellProps = {
  label: string;
  value: string;
  wide?: boolean;
  loading?: boolean;
};

export function MetricCell({ label, value, wide, loading }: MetricCellProps) {
  return (
    <div className={wide ? "col-span-2 text-center" : "min-w-0"}>
      {loading ? (
        <span
          className="skeleton-bar"
          aria-hidden="true"
        />
      ) : (
        <p className="metric-value">{value}</p>
      )}
      <p className="metric-label">{label}</p>
    </div>
  );
}
