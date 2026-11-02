import React, { memo, useRef, useLayoutEffect } from "react";
import ListingCard from "./ListingCard";
import { animateMotion, reducedMotion } from "../../lib/agentMotion";
function ListingGrid({
  rows,
  unit,
  saved,
  requests,
  unlocked,
  compared,
  onOpen,
  onSave,
  onCompare,
}) {
  const root = useRef(null),
    before = useRef(new Map());
  const key = rows.map((p) => p.id).join("|");
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const nodes = [
      ...host.querySelectorAll(":scope > [data-listing-id]"),
    ].slice(0, 20);
    const after = new Map(
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return [
          node.dataset.listingId,
          {
            node,
            x: r.x + scrollX,
            y: r.y + scrollY,
            width: r.width,
            height: r.height,
          },
        ];
      }),
    );
    if (!reducedMotion() && before.current.size) {
      for (const [id, item] of after) {
        const old = before.current.get(id);
        if (old) {
          const x = old.x - item.x,
            y = old.y - item.y;
          if (x || y)
            animateMotion(
              item.node,
              [{ translate: `${x}px ${y}px` }, { translate: "0 0" }],
              { duration: 220 },
            );
        } else
          animateMotion(
            item.node,
            [
              { opacity: 0, translate: "0 8px" },
              { opacity: 1, translate: "0 0" },
            ],
            { duration: 200 },
          );
      }
      const parent = host.getBoundingClientRect();
      for (const [id, item] of before.current)
        if (!after.has(id)) {
          const clone = item.node.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.inert = true;
          clone.classList.add("agent-exit-clone");
          Object.assign(clone.style, {
            position: "absolute",
            left: `${item.x - parent.x - scrollX}px`,
            top: `${item.y - parent.y - scrollY}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
          });
          host.append(clone);
          const a = animateMotion(
            clone,
            [
              { opacity: 1, scale: 1 },
              { opacity: 0, scale: 0.98 },
            ],
            { duration: 180 },
          );
          if (a) a.onfinish = () => clone.remove();
          else clone.remove();
        }
    }
    before.current = after;
  }, [key]);
  return (
    <div ref={root} className="property-grid agent-motion-grid">
      {rows.map((p, index) => (
        <ListingCard
          key={p.id}
          p={p}
          entranceIndex={index}
          unit={unit}
          saved={saved.includes(p.id)}
          request={requests.get(p.id)}
          unlocked={unlocked.has(p.id)}
          compared={compared.includes(p.id)}
          onOpen={onOpen}
          onSave={onSave}
          onCompare={onCompare}
        />
      ))}
    </div>
  );
}
export default memo(ListingGrid);
