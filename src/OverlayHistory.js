import { useEffect, useRef } from "react";
let pendingBack = Promise.resolve();
// Serialize closing/reopening so switching one dialog to another cannot pop the new dialog.
function removeEntry(token, href) {
  if (window.history.state?.centometerOverlay !== token) return;
  if (window.location.href !== href) {
    const state = { ...window.history.state };
    delete state.centometerOverlay;
    window.history.replaceState(state, "");
    return;
  }
  pendingBack = new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", done);
      resolve();
    };
    const timer = setTimeout(done, 1000);
    window.addEventListener("popstate", done);
    window.history.back();
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
    pendingBack.then(() => {
      if (cancelled) return;
      href = window.location.href;
      window.history.pushState(
        { ...window.history.state, centometerOverlay: id },
        "",
        href,
      );
      active = true;
      window.addEventListener("popstate", pop);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", pop);
      if (active) removeEntry(id, href);
    };
  }, [open]);
}
