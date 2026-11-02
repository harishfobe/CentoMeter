import { useCallback, useEffect, useRef, useState } from "react";
import { persistDraft } from "./PhotoStorage";
export default function useDraftStorage(snapshot, ready) {
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const stopped = useRef(false),
    queue = useRef(Promise.resolve()),
    timer = useRef(null),
    lastQueued = useRef(null);
  const [status, setStatus] = useState("Draft will save on this device");
  const mounted = useRef(false);
  const flush = useCallback(() => {
    const current = latest.current;
    if (stopped.current || !readyRef.current) return Promise.resolve();
    if (
      lastQueued.current?.id === current.id &&
      lastQueued.current.step === current.step &&
      lastQueued.current.data === current.data
    )
      return queue.current;
    clearTimeout(timer.current);
    lastQueued.current = current;
    queue.current = queue.current
      .then(async () => {
        if (stopped.current) return;
        if (mounted.current) setStatus("Saving draft…");
        const result = await persistDraft(current);
        if (!result.ok) lastQueued.current = null;
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
      })
      .catch(() => {
        lastQueued.current = null;
        if (mounted.current)
          setStatus("Draft could not be saved. Keep this page open and retry.");
        return { ok: false, photosSaved: false };
      });
    return queue.current;
  }, []);
  useEffect(() => {
    if (!ready) return;
    timer.current = setTimeout(() => {
      void flush();
    }, 500);
    return () => clearTimeout(timer.current);
  }, [snapshot.data, snapshot.step, ready, flush]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      if (!stopped.current) void flush();
    };
  }, [flush]);
  const stop = useCallback(async () => {
    // Mark stopped before waiting: a debounce firing during an in-flight write
    // must not queue a new write that resurrects a discarded/completed draft.
    stopped.current = true;
    clearTimeout(timer.current);
    await queue.current;
  }, []);
  const resume = useCallback(() => {
    stopped.current = false;
    lastQueued.current = null;
  }, []);
  return { status, flush, stop, resume };
}
