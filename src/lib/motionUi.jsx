import React, { useEffect } from "react";
import { AnimatePresence, motion, usePresence } from "motion/react";
import { reducedMotion } from "./agentMotion";

/** Visual springs stay inside 180–280ms. Transform and opacity only. */
export const sheetSpring = {
  type: "spring",
  duration: 0.26,
  bounce: 0.16,
};

export const fadeTransition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

export const tapTransition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
};

export const tabSlide = {
  type: "spring",
  duration: 0.24,
  bounce: 0.12,
};

const EXIT_MS = 280;

function PresenceHold({ children }) {
  const [present, safeToRemove] = usePresence();
  useEffect(() => {
    if (present || !safeToRemove) return undefined;
    const ms = reducedMotion() ? 0 : EXIT_MS;
    const id = window.setTimeout(safeToRemove, ms);
    return () => window.clearTimeout(id);
  }, [present, safeToRemove]);
  if (!React.isValidElement(children)) return children;
  return React.cloneElement(children, { exiting: !present });
}

/** Keeps a sheet mounted long enough for AnimatePresence to play the exit. */
export function ExitGate({ open, children }) {
  return (
    <AnimatePresence>
      {open ? <PresenceHold key="hold">{children}</PresenceHold> : null}
    </AnimatePresence>
  );
}

export function TapButton({ className = "", disabled, children, ...props }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={tapTransition}
      {...props}
      disabled={disabled}
      className={("motion-tap " + className).trim()}
    >
      {children}
    </motion.button>
  );
}

export function SlidingIndicator({ id, className }) {
  return (
    <motion.span
      layoutId={id}
      className={className}
      initial={false}
      transition={tabSlide}
    />
  );
}

/** Opacity crossfade. The first value appears immediately; later values overlap. */
export function FadeSwap({ swapKey, className = "", children }) {
  return (
    <span className={("fade-swap " + className).trim()}>
      <AnimatePresence initial={false}>
        <motion.span
          key={swapKey}
          className="fade-swap-item"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
