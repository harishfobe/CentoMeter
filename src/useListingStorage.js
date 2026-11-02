import { useCallback, useEffect, useRef, useState } from "react";
import { readLocal } from "./Discovery";
import {
  migrateDraftPhotos,
  restoreListings,
  persistListings,
  hasPhotoRestoreFailure,
} from "./PhotoStorage";

export default function useListingStorage(onProblem) {
  const [drafts, setState] = useState(() => {
    const value = readLocal("centometer-listings", []);
    return Array.isArray(value) ? value : [];
  });
  const latest = useRef(drafts),
    initial = useRef(drafts);
  const [ready, setReady] = useState(false);
  const report = useRef(onProblem);
  report.current = onProblem;
  const mounted = useRef(false),
    queue = useRef(Promise.resolve()),
    timer = useRef(null),
    manual = useRef(0),
    dirty = useRef(false);
  const setDrafts = useCallback((value) => {
    const next = typeof value === "function" ? value(latest.current) : value;
    latest.current = next;
    dirty.current = true;
    setState(next);
  }, []);
  const write = useCallback((next) => {
    const job = queue.current
      .then(() => persistListings(next))
      .catch(() => ({ ok: false, photosSaved: false }));
    queue.current = job;
    return job;
  }, []);
  const saveListings = useCallback(
    async (next) => {
      clearTimeout(timer.current);
      manual.current++;
      try {
        return await write(next);
      } finally {
        manual.current--;
      }
    },
    [write],
  );
  useEffect(() => {
    mounted.current = true;
    let active = true;
    void migrateDraftPhotos().catch(() => {
      if (active)
        report.current?.(
          "Saved draft photos could not be upgraded. Your existing drafts are unchanged.",
        );
    });
    void restoreListings(initial.current)
      .then((items) => {
        if (!active) return;
        // Hydration may finish after a user edit/delete; replace only untouched records.
        const hydrated = latest.current.map((record) => {
          const i = initial.current.indexOf(record);
          return i >= 0 ? items[i] : record;
        });
        if (items.some(hasPhotoRestoreFailure))
          report.current?.(
            "Some saved photos could not be restored. Their stored references have been kept for a later retry.",
          );
        latest.current = hydrated;
        setState(hydrated);
      })
      .catch(() => {
        if (active)
          report.current?.(
            "Saved photos could not be restored. Listing details are still available.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!ready || !dirty.current) return;
    const snapshot = drafts;
    timer.current = setTimeout(() => {
      if (manual.current || latest.current !== snapshot) return;
      void write(snapshot)
        .then((result) => {
          if (!mounted.current) return;
          if (!result.ok)
            report.current?.(
              "Listing changes could not be saved. Device storage is unavailable.",
            );
          else if (!result.photosSaved)
            report.current?.(
              "Listing details saved. Some photos could not be retained on this device.",
            );
          if (result.ok && latest.current === snapshot) dirty.current = false;
        })
        .catch(() => {
          if (mounted.current)
            report.current?.(
              "Listing changes could not be saved. Please retry.",
            );
        });
    }, 500);
    return () => clearTimeout(timer.current);
  }, [drafts, ready, write]);
  return { drafts, setDrafts, ready, saveListings };
}
