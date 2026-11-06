import React from "react";

/** Capsule swipe indicator: orange elongated active pill + grey inactive dots. */
export default function PhotoSwipeDots({
  count = 0,
  index = 0,
  className = "",
}) {
  if (count < 2) return null;
  const active = Math.min(Math.max(index, 0), count - 1);
  return (
    <div
      className={"photo-swipe-dots" + (className ? " " + className : "")}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} data-active={active === i} />
      ))}
    </div>
  );
}
