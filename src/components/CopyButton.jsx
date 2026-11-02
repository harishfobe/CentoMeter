import React, { useEffect, useRef, useState } from "react";
import { notifyAgent } from "../lib/agentStore";
export default function CopyButton({
  value,
  children = "Copy",
  onResult,
  successMessage = "Copied",
  ...props
}) {
  const [busy, setBusy] = useState(false);
  const active = useRef(false),
    current = useRef(value);
  current.current = value;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    setBusy(false);
  }, [value]);
  const copy = async () => {
    setBusy(true);
    let ok = false;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      ok = false;
    } finally {
      if (active.current && current.current === value) {
        setBusy(false);
        if (onResult) onResult(ok);
        else
          notifyAgent(
            ok
              ? successMessage
              : "Copy failed. Select and copy the text manually.",
          );
      }
    }
  };
  return (
    <button
      type="button"
      {...props}
      disabled={busy}
      aria-busy={busy}
      onClick={copy}
    >
      {busy ? "Copying…" : children}
    </button>
  );
}
