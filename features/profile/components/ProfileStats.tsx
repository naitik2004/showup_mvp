export default function ProfileStats({
  stats,
  loading,
  error,
}: {
  stats: readonly (readonly [string, number])[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="tiles">
      {stats.map(([label, value]) => (
        <div key={label}>
          <b>{loading ? "…" : error ? "—" : value}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
