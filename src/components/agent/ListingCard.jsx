import { preloadListingDetails } from "../../lib/listingDetailsLoader";
import { useCardEntrance, revealGalleryImage } from "../../lib/agentMotion";
import React, { useRef, useState, useEffect, memo } from "react";
import { Heart } from "lucide-react";
import { money } from "../../PropertyModel";
import { landPrice } from "../../JourneyUX";
import { cardTypeLabel } from "../../PropertyTypes";
import { recentlyConfirmed, statusLabel } from "../../lib/agents";
import { accessStatus } from "../../lib/locationAccess";

import LocationPrivacyChip from "./LocationPrivacyChip";
function ListingCard({
  p,
  onOpen,
  onSave,
  saved,
  unit = "total",
  compared,
  request,
  unlocked = false,
  entranceIndex = 0,
  onCompare,
}) {
  const entrance = useCardEntrance(entranceIndex);
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const strip = useRef(null),
    imageStops = useRef([]);
  useEffect(() => () => imageStops.current.forEach((stop) => stop()), []);
  const [index, setIndex] = useState(0);
  const price = landPrice(p, unit);
  return (
    <article
      ref={entrance}
      data-listing-id={p.id}
      data-below-fold={entranceIndex >= 3}
      className={
        "property-card agent-listing " +
        (["sold", "rented"].includes(p.status) ? "listing-inactive" : "")
      }
    >
      <div className="agent-listing-media">
        <div
          className="agent-photo-strip"
          ref={strip}
          tabIndex={0}
          role="group"
          aria-label={"Photos of " + p.title}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
              e.preventDefault();
              strip.current?.scrollBy({
                left:
                  (e.key === "ArrowRight" ? 1 : -1) * strip.current.clientWidth,
                behavior: window.matchMedia?.(
                  "(prefers-reduced-motion: reduce)",
                ).matches
                  ? "instant"
                  : "smooth",
              });
            }
          }}
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
              onLoad={(e) => {
                e.currentTarget.dataset.loaded = "true";
                imageStops.current.push(revealGalleryImage(e.currentTarget));
              }}
              alt={p.title + " photo " + (i + 1)}
            />
          ))}
        </div>
        {photos.length > 0 && (
          <span className="agent-photo-count" aria-hidden="true">
            {index + 1} / {photos.length}
          </span>
        )}
        <span className="property-type-badge">{cardTypeLabel(p.type)}</span>
        <div className="agent-photo-dots" aria-hidden="true">
          {photos.map((_, i) => (
            <span key={i} data-active={index === i} />
          ))}
        </div>
      </div>
      <button
        className="save-button"
        aria-label={(saved ? "Unsave " : "Save ") + p.title}
        aria-pressed={saved}
        onClick={() => onSave(p.id)}
      >
        <span className="agent-heart-burst" aria-hidden="true" />
        <Heart size={20} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        className="property-copy"
        onPointerEnter={preloadListingDetails}
        onFocus={preloadListingDetails}
        onClick={() => onOpen(p.id)}
      >
        {p.type === "Land" ? (
          <p className="agent-listing-eyebrow">
            {p.mode === "RENT" ? "FOR RENT" : "FOR SALE"} · LAND
          </p>
        ) : null}
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
          <span className="pill agent-confirmed">Recently confirmed</span>
        ) : (
          <small>Not recently confirmed</small>
        )}
        <LocationPrivacyChip p={p} unlocked={unlocked} />
        {request && <small role="status">{accessStatus(request)}</small>}
        {onCompare && (
          <label>
            <input
              type="checkbox"
              checked={compared}
              onChange={() => onCompare(p.id)}
            />
            Compare
          </label>
        )}
      </div>
    </article>
  );
}

export default memo(ListingCard);
