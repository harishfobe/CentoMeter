import { useEffect, useState } from "react";
// Sleep until the final hour; only then refresh expiry labels at minute boundaries.
export default function useExpiryTick(requests) {
  const [now, setNow] = useState(Date.now);
  const deadlines = requests
    .filter((r) => r?.status === "approved" && r.expiresAt)
    .map((r) => Date.parse(r.expiresAt))
    .filter(Number.isFinite);
  const key = deadlines.join(",");
  useEffect(() => {
    const current = Date.now();
    const future = key
      .split(",")
      .map(Number)
      .filter((t) => t > current);
    if (!future.length) return;
    const next = Math.min(...future);
    const delay =
      next - current > 3600000
        ? next - current - 3600000
        : Math.min(60000, next - current);
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(2147483647, Math.max(1, delay)),
    );
    return () => clearTimeout(timer);
  }, [key, now]);
  return now;
}
