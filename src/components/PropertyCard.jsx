import React, { memo } from "react";
import { Heart, MoveDiagonal, Square } from "lucide-react";
import { typeLabel } from "../PropertyTypes";
import {
  landCardFooter,
  listingCardArea,
  listingCardFacts,
  listingCardPrice,
  listingCardRate,
  listingCardTitle,
} from "../listingPresentation";

function RoadMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M3 13.25 6.75 2.75M13 13.25 9.25 2.75M8 12.75V3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FactMark({ kind }) {
  if (kind === "area")
    return <Square size={14} strokeWidth={1.75} aria-hidden="true" />;
  if (kind === "size")
    return <MoveDiagonal size={14} strokeWidth={1.75} aria-hidden="true" />;
  if (kind === "road") return <RoadMark />;
  return null;
}

function middot(text) {
  return text ? String(text).replaceAll(" • ", " · ") : text;
}

/** Area, then dimensions and facing, then road — each on its own line. */
function cardFactLines(area, facts) {
  if (!facts)
    return area ? [{ key: "area", kind: null, text: middot(area) }] : [];
  const parts = String(facts)
    .split(" • ")
    .map((part) => part.trim())
    .filter(Boolean);
  const road = parts.filter((part) => /road/i.test(part));
  const size = parts.filter((part) => !/road/i.test(part));
  const lines = [];
  if (area) lines.push({ key: "area", kind: "area", text: middot(area) });
  if (size.length) {
    lines.push({ key: "size", kind: "size", text: middot(size.join(" • ")) });
  }
  road.forEach((text, index) => {
    lines.push({ key: "road-" + index, kind: "road", text });
  });
  return lines;
}

function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
}) {
  void compact;
  void priceUnit;
  const price = listingCardPrice(p);
  const rate = listingCardRate(p);
  const area = listingCardArea(p);
  const facts = listingCardFacts(p);
  const footer = landCardFooter(p);
  const lines = cardFactLines(area, facts);
  return (
    <article className="property-card listing-row">
      <button
        type="button"
        className="property-image"
        onClick={() => onOpen(p)}
        aria-label={"View " + p.title}
      >
        <img
          width="600"
          height="400"
          decoding="async"
          src={p.photos?.[0] || "/" + p.image + ".jpg"}
          alt={
            p.type === "Land"
              ? "Illustrative green residential land"
              : `Illustrative ${String(typeLabel(p.type) || "property").toLowerCase()}`
          }
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = 0;
            e.currentTarget.parentElement.classList.add("photo-unavailable");
          }}
        />
      </button>
      <div className="listing-row-main">
        <div className="listing-row-top">
          <h3>
            <button
              type="button"
              className="listing-row-title"
              onClick={() => onOpen(p)}
            >
              {middot(listingCardTitle(p))}
            </button>
          </h3>
          <button
            type="button"
            className={"save-button " + (saved ? "is-saved" : "")}
            aria-label={(saved ? "Unsave " : "Save ") + p.title}
            aria-pressed={saved}
            onClick={() => onSave(p.id)}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <button
          type="button"
          className="property-copy"
          onClick={() => onOpen(p)}
        >
          {(price || rate) && (
            <p className="listing-row-price price">
              {price ? <strong>{price}</strong> : null}
              {rate ? (
                <span
                  className="listing-row-rate"
                  data-unit={rate.unit ? "true" : "false"}
                >
                  {rate.text}
                </span>
              ) : null}
            </p>
          )}
          {lines.map((line) => (
            <p
              className={line.kind ? "listing-row-fact" : "listing-row-area"}
              key={line.key}
            >
              <FactMark kind={line.kind} />
              {line.text}
            </p>
          ))}
          {footer ? (
            <p className="listing-row-footer">{middot(footer)}</p>
          ) : null}
        </button>
      </div>
    </article>
  );
}

export default memo(PropertyCard);
