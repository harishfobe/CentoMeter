import React, { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { money } from "../../PropertyModel";
import { landPrice } from "../../JourneyUX";
import { recentlyConfirmed, statusLabel } from "../../lib/agents";
import { getExactLocation, accessStatus } from "../../lib/locationAccess";
import { viewerId, useAgentStore } from "../../lib/agentStore";
import LocationPrivacyChip from "./LocationPrivacyChip";
export default function ListingCard({
  p,
  onOpen,
  onSave,
  saved,
  unit = "total",
  compared,
  onCompare,
}) {
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const strip = useRef(null);
  const [index, setIndex] = useState(0);
  const access = useAgentStore();
  const request = access.requests.find(
    (r) => r.propertyId === p.id && r.viewerId === viewerId,
  );
  const price = landPrice(p, unit);
  return (
    <article
      className={
        "property-card agent-listing " +
        (["sold", "rented"].includes(p.status) ? "listing-inactive" : "")
      }
    >
      <div
        className="agent-photo-strip"
        ref={strip}
        onScroll={(e) =>
          setIndex(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
      >
        {!photos.length && (
          <div
            className="agent-photo-placeholder"
            role="img"
            aria-label="No property photos"
          >
            No photos available
          </div>
        )}
        {photos.map((url, i) => (
          <img
            key={url + i}
            loading="lazy"
            decoding="async"
            width="600"
            height="400"
            src={url}
            alt={p.title + " photo " + (i + 1)}
          />
        ))}
      </div>
      <div className="agent-photo-dots">
        {photos.map((_, i) => (
          <button
            key={i}
            aria-label={"Photo " + (i + 1)}
            aria-pressed={index === i}
            onClick={() =>
              strip.current?.scrollTo({
                left: i * strip.current.clientWidth,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              })
            }
          >
            ●
          </button>
        ))}
      </div>
      <button
        className="save-button"
        aria-label={(saved ? "Unsave " : "Save ") + p.title}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Heart size={20} fill={saved ? "currentColor" : "none"} />
      </button>
      <button className="property-copy" onClick={onOpen}>
        <div className="price">
          {money(price.amount)}
          <small>{p.mode === "RENT" ? "/mo" : price.suffix}</small>
        </div>
        <h3>{p.title}</h3>
        <p>
          {p.beds ? p.beds + " BHK · " : ""}
          {p.area.toLocaleString("en-IN")} sq ft ·{" "}
          {p.possessionStatus || p.available}
        </p>
        <p>{p.locality}</p>
      </button>
      <div className="agent-listing-chips">
        <span className="pill">{statusLabel(p.status)}</span>
        {recentlyConfirmed(p) ? (
          <span className="pill">Recently confirmed</span>
        ) : (
          <small>Not recently confirmed</small>
        )}
        <LocationPrivacyChip
          p={p}
          unlocked={!!getExactLocation(p.id, viewerId)}
        />
        {request && <small role="status">{accessStatus(request)}</small>}
        {onCompare && (
          <label>
            <input type="checkbox" checked={compared} onChange={onCompare} />
            Compare
          </label>
        )}
      </div>
    </article>
  );
}
