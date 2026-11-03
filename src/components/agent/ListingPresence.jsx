import { useRef, useState, useEffect } from "react";
import { reducedMotion } from "../../lib/agentMotion";
export default function ListingPresence({ item, children }) {
  const retained = useRef(item);
  const [, redraw] = useState(0);
  if (item) retained.current = item;
  useEffect(() => {
    if (item) return;
    const timer = setTimeout(
      () => {
        retained.current = null;
        redraw((n) => n + 1);
      },
      reducedMotion() ? 0 : 200,
    );
    return () => clearTimeout(timer);
  }, [item]);
  const shown = item || retained.current;
  return shown ? children(shown, !item) : null;
}
