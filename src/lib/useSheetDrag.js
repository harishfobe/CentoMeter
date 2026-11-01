import { useRef } from "react";
import { animateMotion, reducedMotion } from "./agentMotion";
export default function useSheetDrag(onClose) {
  const origin = useRef(null);
  const reset = (element) => {
    if (!element) return;
    if (!reducedMotion())
      animateMotion(
        element,
        [{ translate: element.style.translate || "0 0" }, { translate: "0 0" }],
        { duration: 200 },
      );
    element.style.translate = "";
    element.style.willChange = "";
    element.removeAttribute("data-dragging");
  };
  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      const sheet = e.currentTarget.closest(".modal");
      origin.current = { y: e.clientY, time: performance.now(), sheet };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      sheet.dataset.dragging = "true";
      sheet.style.willChange = "transform";
    },
    onPointerMove: (e) => {
      const start = origin.current;
      if (!start) return;
      const delta = e.clientY - start.y;
      const distance =
        delta < 0
          ? delta * 0.15
          : delta > 240
            ? 240 + (delta - 240) * 0.2
            : delta;
      if (!reducedMotion()) start.sheet.style.translate = `0 ${distance}px`;
    },
    onPointerUp: (e) => {
      const start = origin.current;
      if (!start) return;
      origin.current = null;
      const distance = e.clientY - start.y,
        velocity = distance / Math.max(1, performance.now() - start.time);
      if (distance > 120 || (distance > 35 && velocity > 0.7)) {
        start.sheet.style.translate = "";
        start.sheet.style.willChange = "";
        delete start.sheet.dataset.dragging;
        onClose();
      } else reset(start.sheet);
    },
    onPointerCancel: () => {
      reset(origin.current?.sheet);
      origin.current = null;
    },
  };
}
