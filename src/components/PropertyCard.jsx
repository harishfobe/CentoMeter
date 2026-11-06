import React, { memo } from "react";
import { Heart, MapPin, BedDouble, Bath, Square } from "lucide-react";
import { money } from "../PropertyModel";
import { cardTypeLabel, typeLabel } from "../PropertyTypes";
import { pinPrice } from "../PlotUI";
import { landPrice } from "../JourneyUX";
import { landArea } from "../LandDetails";
import { priceBasis, areaBasis } from "../Journeys";
import {
  houseCardChips,
  houseCardSpecLine,
  isHouseOrVilla,
} from "../HouseVillaDetails";
function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
}) {
  const houseVilla = isHouseOrVilla(p.type);
  const houseSpec = houseVilla ? houseCardSpecLine(p) : null;
  const houseChips = houseVilla ? houseCardChips(p) : [];
  return (
    <article
      className={"property-card " + (compact ? "compact compact-wrapper" : "")}
    >
      <button
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
        {p.tag ? <span className="badge">{p.tag}</span> : null}
        <span className="property-type-badge">{cardTypeLabel(p.type)}</span>
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
        <div className="price">
          {p.type === "Land" && p.mode !== "BUY"
            ? pinPrice(p, money)
            : money(landPrice(p, priceUnit).amount)}
          {p.type === "Land" && p.mode === "BUY" && (
            <small>{landPrice(p, priceUnit).suffix || " total"}</small>
          )}
          {p.mode === "RENT" && p.type !== "Land" && (
            <small>{priceBasis(p)}</small>
          )}
        </div>
        <h3>{p.title}</h3>
        <p className="muted location-line">
          <MapPin size={13} />
          {p.locality}, {p.city}
        </p>
        {houseSpec ? (
          <p className="property-house-spec">{houseSpec}</p>
        ) : (
          <div className="property-specs">
            {!["Land", "Commercial", "PG"].includes(p.type) && (
              <span>
                <BedDouble />
                {p.beds === 0 ? "Studio" : p.beds + " BHK"}
              </span>
            )}
            {p.type === "PG" && <span>{p.occupancy}</span>}
            {p.baths > 0 && (
              <span>
                <Bath />
                {p.baths} baths
              </span>
            )}
            <span>
              <Square />
              {p.type === "Land"
                ? landArea(p.area)
                : Number(p.area || 0).toLocaleString("en-IN") +
                  " sq ft · " +
                  areaBasis(p)}
            </span>
          </div>
        )}
        {houseChips.length > 0 && (
          <div className="property-card-chips" aria-label="Highlights">
            {houseChips.map((chip) => (
              <span key={chip} className="pill">
                {chip}
              </span>
            ))}
          </div>
        )}
      </button>
    </article>
  );
}

export default memo(PropertyCard);
