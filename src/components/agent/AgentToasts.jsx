import React, { useState, useEffect, useRef, useCallback } from "react";
function Toast({ item, onRemove }) {
  const [paused, setPaused] = useState(false),
    [leaving, setLeaving] = useState(false);
  const remaining = useRef(3000),
    started = useRef(0);
  useEffect(() => {
    if (paused) return;
    started.current = performance.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - started.current),
      );
    };
  }, [paused]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => onRemove(item.id), 160);
    return () => clearTimeout(timer);
  }, [leaving, item.id, onRemove]);
  return (
    <div
      className="agent-toast"
      data-exiting={leaving}
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span>{item.message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={() => setLeaving(true)}
      >
        ×
      </button>
    </div>
  );
}
export default function AgentToasts() {
  const [items, setItems] = useState([]);
  const remove = useCallback(
    (id) => setItems((xs) => xs.filter((x) => x.id !== id)),
    [],
  );
  useEffect(() => {
    const add = (e) =>
      setItems((xs) => [
        ...xs.slice(-2),
        { id: crypto.randomUUID(), message: e.detail },
      ]);
    window.addEventListener("centometer-toast", add);
    return () => window.removeEventListener("centometer-toast", add);
  }, []);
  return (
    <div
      className="agent-toast-stack"
      role="region"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <Toast key={item.id} item={item} onRemove={remove} />
      ))}
    </div>
  );
}
