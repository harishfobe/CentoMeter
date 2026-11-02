import { useEffect, useRef } from "react";
let pendingBack = Promise.resolve();
function reportHistoryFailure() {
  window.dispatchEvent(
    new CustomEvent("centometer-toast", {
      detail:
        "Browser history is unavailable. Use the close button or Escape to dismiss this dialog.",
    }),
  );
}
function clearOwnedMarker(token) {
  if (window.history.state?.centometerOverlay !== token) return;
  const state = { ...window.history.state };
  delete state.centometerOverlay;
  try {
    window.history.replaceState(state, "");
  } catch {
    reportHistoryFailure();
  }
}
// Wait for the actual Back event. A timeout can allow a new dialog to push an
// entry before a delayed Back arrives, immediately closing the new dialog.
function removeEntry(token, href) {
  if (window.history.state?.centometerOverlay !== token) return;
  if (window.location.href !== href) {
    clearOwnedMarker(token);
    return;
  }
  pendingBack = new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener("popstate", done);
      resolve();
    };
    const done = () => {
      if (window.history.state?.centometerOverlay !== token) finish();
    };
    window.addEventListener("popstate", done);
    try {
      window.history.back();
    } catch {
      clearOwnedMarker(token);
      reportHistoryFailure();
      finish();
    }
  });
}
export default function useOverlayBack(open, onClose) {
  const close = useRef(onClose);
  close.current = onClose;
  const token = useRef(null);
  if (!token.current)
    token.current = "overlay-" + Math.random().toString(36).slice(2);
  useEffect(() => {
    if (!open) return;
    let cancelled = false,
      active = false,
      href;
    const id = token.current;
    const pop = () => {
      if (active && window.history.state?.centometerOverlay !== id) {
        active = false;
        close.current();
      }
    };
    void pendingBack
      .then(() => {
        if (cancelled) return;
        href = window.location.href;
        window.history.pushState(
          { ...window.history.state, centometerOverlay: id },
          "",
          href,
        );
        active = true;
        window.addEventListener("popstate", pop);
      })
      .catch(() => {
        if (!cancelled) reportHistoryFailure();
      });
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", pop);
      if (active) removeEntry(id, href);
    };
  }, [open]);
}
