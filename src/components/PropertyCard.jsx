import React, { memo } from "react";
import { Heart, MapPin } from "lucide-react";
import { money } from "../PropertyModel";
import { typeLabel } from "../PropertyTypes";
import {
  typeTransactionLine,
  priceWithBasis,
  configAreaLine,
  postedByLine,
  availabilityLine,
  depositLabel,
  maintenanceLabel,
  brokerageLabel,
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
  return (
    <article
      className={
        "property-card " +
        (compact ? "compact compact-wrapper " : "") +
        (rentCosts ? "property-card-rent " : "")
      }
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
        <p className="property-card-type">{typeTransactionLine(p)}</p>
        <div className="price">
          {priceWithBasis(p, { unit: priceUnit, formatMoney: money })}
        </div>
        <h3>{p.title}</h3>
        {configAreaLine(p) ? (
          <p className="property-card-config">{configAreaLine(p)}</p>
        ) : null}
        <p className="muted location-line">
          <MapPin size={13} aria-hidden="true" />
          {[p.locality, p.city].filter(Boolean).join(", ")}
        </p>
        {rentCosts ? (
          <dl className="property-card-costs" aria-label="Rental costs">
            <div>
              <dt>Deposit</dt>
              <dd>{depositLabel(p, { formatMoney: money, missing: "—" })}</dd>
            </div>
            <div>
              <dt>Maintenance</dt>
              <dd>
                {maintenanceLabel(p, { formatMoney: money, missing: "—" })}
              </dd>
            </div>
            <div>
              <dt>Brokerage</dt>
              <dd>{brokerageLabel(p, { formatMoney: money })}</dd>
            </div>
          </dl>
        ) : null}
        <p className="property-card-poster">{postedByLine(p)}</p>
        {availabilityLine(p) ? (
          <p className="property-card-availability">{availabilityLine(p)}</p>
        ) : null}
      </button>
    </article>
  );
}

export default memo(PropertyCard);
