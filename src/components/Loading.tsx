export function Loading({ label = "Đang tải..." }: { label?: string }) {
  return <div className="notice">{label}</div>;
}
