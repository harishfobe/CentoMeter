import React, { memo } from "react";
import { Bath, BedDouble, Camera, Heart, MapPin, Ruler, User } from "lucide-react";
import { money } from "../PropertyModel";
import { typeLabel } from "../PropertyTypes";
import {
  listingAreaSpec,
  listingBathSpec,
  listingConfigSpec,
  listingPhotoCount,
  listingPriceParts,
  listingStatusBadge,
  listingSubtitle,
  postedByLabel,
} from "../listingPresentation";

function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
}) {
  const rentCosts = p.mode === "RENT";
  const status = listingStatusBadge(p);
  const photoCount = listingPhotoCount(p);
  const price = listingPriceParts(p, { unit: priceUnit, formatMoney: money });
  const specs = [
    listingAreaSpec(p) && { icon: Ruler, label: listingAreaSpec(p) },
    listingConfigSpec(p) && { icon: BedDouble, label: listingConfigSpec(p) },
    listingBathSpec(p) && { icon: Bath, label: listingBathSpec(p) },
  ].filter(Boolean);
  const place = [p.locality, p.city].filter(Boolean).join(", ");
  return (
    <article
      className={
        "property-card listing-row " +
        (compact ? "compact compact-wrapper " : "") +
        (rentCosts ? "property-card-rent " : "")
      }
    >
      <div className="listing-row-media">
        <button
          className="property-image"
          onClick={() => onOpen(p)}
          aria-label={["View " + p.title, status, photoCount ? photoCount + " photos" : null]
            .filter(Boolean)
            .join(". ")}
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
          {status ? <span className="listing-status">{status}</span> : null}
          {photoCount > 0 ? (
            <span className="listing-photo-count">
              <Camera size={11} aria-hidden="true" />
              {photoCount}
            </span>
          ) : null}
        </button>
        <button
          className={"save-button " + (saved ? "is-saved" : "")}
          aria-label={(saved ? "Unsave " : "Save ") + p.title}
          aria-pressed={saved}
          onClick={() => onSave(p.id)}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <p className="listing-poster property-card-poster">
          <User size={12} aria-hidden="true" />
          {postedByLabel(p)}
        </p>
      </div>
      <button className="property-copy" onClick={() => onOpen(p)}>
        <h3>{p.title}</h3>
        <p className="property-card-type">{listingSubtitle(p)}</p>
        {place ? (
          <p className="muted location-line">
            <MapPin size={12} aria-hidden="true" />
            {place}
          </p>
        ) : null}
        <p className="listing-price price">
          <strong>{price.amount}</strong>
          {price.basis ? <small>{price.basis}</small> : null}
          {price.rate ? <span>{price.rate}</span> : null}
        </p>
        {specs.length > 0 ? (
          <ul className="listing-specs">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <li key={spec.label}>
                  <Icon size={13} aria-hidden="true" />
                  {spec.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </button>
    </article>
  );
}

export default memo(PropertyCard);
