import { useCallback, useState } from "react";
import { readLocal, writeLocal } from "./Discovery";

function readMode(key) {
  const value = readLocal(key, "grid");
  return value === "list" ? "list" : "grid";
}

export default function useViewMode(key) {
  const [selection, setSelection] = useState(() => ({
    key,
    view: readMode(key),
  }));
  const view = selection.key === key ? selection.view : readMode(key);
  const setView = useCallback(
    (value) => {
      const next = value === "list" ? "list" : "grid";
      setSelection({ key, view: next });
      writeLocal(key, next);
    },
    [key],
  );
  return [view, setView];
}
