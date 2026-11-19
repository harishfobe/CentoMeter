import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import useOverlayBack from "./OverlayHistory";
import { fadeTransition, sheetSpring } from "./lib/motionUi";
import { X } from "lucide-react";
export function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
  historyManaged = false,
  motionKind,
  exiting = false,
}) {
  const ref = useRef(null);
  const close = useRef(onClose);
  const dirtyForm = useRef(false);
  close.current = onClose;
  useOverlayBack(!historyManaged, () => close.current());
  useEffect(() => {
    const before = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
    const key = (e) => {
      const dialogs = document.querySelectorAll(".modal");
      if (ref.current !== dialogs[dialogs.length - 1]) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const els = ref.current.querySelectorAll(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
        );
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", key);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);
  const spring = ["listing", "filter", "location"].includes(motionKind);
  const Scrim = spring ? motion.div : "div";
  const Panel = spring ? motion.section : "section";
  return (
    <Scrim
      className="modal-scrim"
      data-motion-kind={motionKind}
      data-motion-lib={spring ? "true" : undefined}
      data-exiting={exiting}
      onChangeCapture={(e) => {
        if (e.target.closest("form")) dirtyForm.current = true;
      }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !(dirtyForm.current && ref.current?.querySelector("form"))
        )
          close.current();
      }}
    >
      {spring ? (
        <motion.div
          className="motion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={fadeTransition}
        />
      ) : null}
      <Panel
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
        {...(spring
          ? {
              initial: { y: "100%" },
              animate: { y: exiting ? "100%" : 0 },
              transition: sheetSpring,
            }
          : {})}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <IconButton label="Close dialog" onClick={() => close.current()}>
            <X />
          </IconButton>
        </div>
        {children}
      </Panel>
    </Scrim>
  );
}
