import { useCallback, useEffect, useRef, useState } from "react";
import { persistDraft } from "./PhotoStorage";
export default function useDraftStorage(snapshot, ready) {
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const stopped = useRef(false);
  const queue = useRef(Promise.resolve());
  const [status, setStatus] = useState("Draft will save on this device");
  const mounted = useRef(true);
  const flush = useCallback(() => {
    const current = latest.current;
    if (stopped.current || !readyRef.current) return Promise.resolve();
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (stopped.current) return;
        const result = await persistDraft(current);
        if (mounted.current)
          setStatus(
            result.skipped
              ? "Add property details to save a draft."
              : !result.ok
                ? "Device storage is unavailable. Keep this page open to retain your draft."
                : !result.photosSaved
                  ? "Details saved. Photos could not be retained; reselect them when resuming."
                  : "Draft saved automatically on this device",
          );
        return result;
      });
    return queue.current;
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(flush, 500);
    return () => clearTimeout(timer);
  }, [snapshot.data, snapshot.step, ready, flush]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (!stopped.current) void flush();
    };
  }, [flush]);
  const stop = async () => {
    await queue.current.catch(() => {});
    stopped.current = true;
  };
  return { status, flush, stop };
}
