import { useEffect, useRef } from "react";
export const reducedMotion = () =>
  typeof window === "undefined" ||
  !window.matchMedia ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let visibilityObserver;
const animating = new WeakMap();
function stopWhenOutside(element, animation) {
  if (typeof IntersectionObserver === "undefined") return () => {};
  visibilityObserver ||= new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (!entry.isIntersecting)
        for (const a of animating.get(entry.target) || []) a.finish();
  });
  const animations = animating.get(element) || new Set();
  animations.add(animation);
  animating.set(element, animations);
  visibilityObserver.observe(element);
  return () => {
    animations.delete(animation);
    if (!animations.size) visibilityObserver.unobserve(element);
  };
}
export function animateMotion(element, keyframes, options = {}) {
  if (!element?.animate || reducedMotion()) return null;
  element.style.willChange = "transform, opacity";
  const animation = element.animate(keyframes, {
    fill: "backwards",
    duration: 200,
    // Match --ease-out token (Emil strong ease-out).
    easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    ...options,
  });
  const stop = stopWhenOutside(element, animation);
  const release = () => {
    stop();
    element.style.willChange = "";
  };
  animation.addEventListener("finish", release, { once: true });
  animation.addEventListener("cancel", release, { once: true });
  return animation;
}
let observer;
const callbacks = new WeakMap();
export function observeOnce(element, callback) {
  if (!element) return () => {};
  if (typeof IntersectionObserver === "undefined") {
    callback();
    return () => {};
  }
  observer ||= new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          observer.unobserve(e.target);
          callbacks.get(e.target)?.();
          callbacks.delete(e.target);
        }
    },
    { threshold: 0.08 },
  );
  callbacks.set(element, callback);
  observer.observe(element);
  return () => {
    observer.unobserve(element);
    callbacks.delete(element);
  };
}
/** Listing scroll is high-frequency — no entrance stagger (frequency gate). */
export function useCardEntrance() {
  return useRef(null);
}
export function useScrollPolish(ref) {
  useEffect(() => {
    let frame = 0,
      previous = window.scrollY;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const host = ref.current;
      if (host) {
        host.dataset.scrolled = String(y > 8);
        host.dataset.scrollDown = String(y > previous + 2 && y > 180);
        host.dataset.backTop = String(y > 800);
      }
      previous = y;
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

export function revealGalleryImage(image) {
  return observeOnce(image, () => {
    if (image.dataset.revealed) return;
    image.dataset.revealed = "true";
    animateMotion(
      image,
      [
        { opacity: 0.6, scale: 1.04 },
        { opacity: 1, scale: 1 },
      ],
      { duration: 240 },
    );
  });
}
