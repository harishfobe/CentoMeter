import React, { useRef } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { landNumber, toCents } from "./LandDetails";
import { priceBasis } from "./Journeys";
import { plotStatus, pricePerCent, pinPrice } from "./PlotUI";
import { landPrice } from "./JourneyUX";
import useOverlayBack from "./OverlayHistory";

export function Wordmark() {
  return (
    <span className="wordmark" aria-hidden="true">
      Cent<span>o</span>Meter
    </span>
  );
}
export function PriceCaption({ p, money }) {
  return p.mode === "RENT"
    ? priceBasis(p).trim()
    : pricePerCent(p)
      ? money(pricePerCent(p)) + " / cent"
      : Number(p.area) > 0
        ? "₹" +
          Math.round(p.price / p.area).toLocaleString("en-IN") +
          " / sq ft"
        : null;
}
export function SelectedPropertySheet({
  p,
  money,
  onClose,
  onOpen,
  onSave,
  saved = false,
  onSimilar,
  items = [p],
  onVisit,
  onSelect,
  locked = false,
  onRequestLocation,
  priceUnit = "total",
}) {
  useOverlayBack(true, onClose);
  const touch = useRef(null);
  const swiped = useRef(false);
  const index = items.findIndex((item) => item.id === p.id);
  const multiple = items.length > 1 && index >= 0;
  const move = (direction) => {
    if (multiple)
      onSelect?.(items[(index + direction + items.length) % items.length].id);
  };
  const land = p.type === "Land";
  const price = landPrice(p, priceUnit);
  const status = plotStatus(p);
  const image =
    p.photos?.[0] || "/" + (p.image || (land ? "land" : "apartment")) + ".jpg";
  const specs = [
    ...(!land && Number(p.beds) > 0
      ? [Number(p.beds) + " beds"]
      : Number(p.beds) === 0 &&
          ["Apartment", "Villa", "Independent House"].includes(p.type)
        ? ["Studio"]
        : []),
    ...(!land && Number(p.baths) > 0 ? [Number(p.baths) + " baths"] : []),
    ...(Number(p.area) > 0 ? [landNumber(p.area) + " sq ft"] : []),
    ...(land && Number(p.area) > 0
      ? [landNumber(toCents(p.area)) + " cents"]
      : []),
  ];
  return (
    <div className="selected-property selection-card">
      <section
        className="selection-sheet"
        aria-label="Selected property"
        onClick={(e) => {
          if (swiped.current) {
            swiped.current = false;
            e.preventDefault();
            return;
          }
          if (!e.target.closest("button,a")) onOpen();
        }}
        onPointerDown={(e) => {
          swiped.current = false;
          touch.current = {
            x: e.clientX,
            y: e.clientY,
            control: !!e.target.closest("button:not(.selection-image-open),a"),
          };
          if (!touch.current.control)
            e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || start.control || !multiple) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            swiped.current = true;
            move(dx < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => {
          touch.current = null;
        }}
      >
        <div className="selection-image">
          <button
            type="button"
            className="selection-image-open"
            aria-label={"View " + p.title}
            onClick={() => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              onOpen();
            }}
          >
            <img
              width="600"
              height="400"
              decoding="async"
              draggable={false}
              src={image}
              alt={p.title}
              onError={(e) => {
                const fallback = land ? "/land.jpg" : "/apartment.jpg";
                if (e.currentTarget.getAttribute("src") !== fallback)
                  e.currentTarget.src = fallback;
              }}
            />
          </button>
          <span className="selection-status">
            {status === "sold"
              ? "Sold"
              : status === "reserved"
                ? "Reserved"
                : p.mode === "RENT"
                  ? "For Rent"
                  : p.badge || "On Market"}
          </span>
          <button
            type="button"
            className="icon-button selection-save"
            aria-label={(saved ? "Unsave " : "Save ") + p.title}
            aria-pressed={saved}
            onClick={() => onSave?.(p.id)}
          >
            <Heart size={20} fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="icon-button sheet-close"
            aria-label="Close property summary"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="selection-scroll">
          <div className="selection-price">
            <strong>
              {land && p.mode !== "BUY"
                ? pinPrice(p, money)
                : money(price.amount)}
            </strong>
            <span>
              {land && p.mode === "BUY" && priceUnit !== "total"
                ? price.suffix.trim()
                : p.mode === "RENT"
                  ? priceBasis(p).trim()
                  : "Total price"}
            </span>
          </div>
          <div className="selection-price-caption">
            {land && p.mode === "BUY" && priceUnit !== "total" ? (
              money(p.price) + " total"
            ) : (
              <PriceCaption p={p} money={money} />
            )}
          </div>
          {specs.length > 0 && (
            <ul
              className="selection-specs"
              aria-label="Property specifications"
            >
              {specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )}
          <h2>{p.title}</h2>
          <p className="selection-location">
            <MapPin size={13} />
            <span>{[p.locality, p.city].filter(Boolean).join(", ")}</span>
          </p>
        </div>
        <div className="selection-actions">
          {onVisit && (
            <button type="button" className="primary" onClick={onVisit}>
              Book site visit
            </button>
          )}
          <button
            type="button"
            className={onVisit ? "secondary" : "primary"}
            onClick={onOpen}
          >
            View details
            <ArrowUpRight size={15} />
          </button>
          <button type="button" className="secondary" onClick={onSimilar}>
            See similar
          </button>
        </div>
        {locked && (
          <div className="selection-location-gate">
            <span>Exact location private</span>
            <button className="primary" onClick={onRequestLocation}>
              Request location
            </button>
          </div>
        )}
        {multiple && (
          <div className="selection-pager" aria-label="Nearby properties">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous nearby property"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span role="status" aria-live="polite">
              {index + 1} of {items.length} nearby · Swipe to browse
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next nearby property"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
