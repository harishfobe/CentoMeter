import React, { useRef } from "react";
import { ExitGate } from "../../lib/motionUi";
export default function ListingPresence({ item, children }) {
  const retained = useRef(item);
  if (item) retained.current = item;
  const shown = item || retained.current;
  return (
    <ExitGate open={Boolean(item)}>
      {shown ? children(shown, !item) : null}
    </ExitGate>
  );
}
