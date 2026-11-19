import React, { memo } from "react";
import { Heart } from "lucide-react";
import { typeLabel } from "../PropertyTypes";
import { publicAsset } from "../lib/publicAsset";
import {
  landCardFooter,
  listingCardArea,
  listingCardFacts,
  listingCardPrice,
  listingCardRate,
  listingCardTitle,
} from "../listingPresentation";

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
  return (
    <article className="property-card listing-row">
      <button
        className="property-image"
        onClick={() => onOpen(p)}
        aria-label={"View " + p.title}
      >
        <img
          width="600"
          height="400"
          decoding="async"
          src={publicAsset(
            p.photos?.[0] || "/" + (p.image || "apartment") + ".jpg",
          )}
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
      <button
        className={"save-button " + (saved ? "is-saved" : "")}
        aria-label={(saved ? "Unsave " : "Save ") + p.title}
        aria-pressed={saved}
        onClick={() => onSave(p.id)}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <button className="property-copy" onClick={() => onOpen(p)}>
        <h3>{listingCardTitle(p)}</h3>
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
        {area ? <p className="listing-row-area">{area}</p> : null}
        {facts ? <p className="listing-row-facts">{facts}</p> : null}
        {footer ? <p className="listing-row-footer">{footer}</p> : null}
      </button>
    </article>
  );
}

export default memo(PropertyCard);
