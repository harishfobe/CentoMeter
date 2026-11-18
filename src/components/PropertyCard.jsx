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
  landCardApproval,
  landCardArea,
  landCardFacts,
  landCardFooter,
  landCardPrice,
  landCardRate,
  landCardTitle,
} from "../listingPresentation";

function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
}) {
  const land = p.type === "Land";
  const rentCosts = p.mode === "RENT" && !land;
  return (
    <article
      className={
        "property-card " +
        (land ? "land-listing " : compact ? "compact compact-wrapper " : "") +
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
        {!land && p.tag ? <span className="badge">{p.tag}</span> : null}
      </button>
      <button
        className={"save-button " + (saved ? "is-saved" : "")}
        aria-label={(saved ? "Unsave " : "Save ") + p.title}
        aria-pressed={saved}
        onClick={() => onSave(p.id)}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      {land ? (
        <LandCopy p={p} onOpen={onOpen} />
      ) : (
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
      )}
    </article>
  );
}

function LandCopy({ p, onOpen }) {
  const price = landCardPrice(p);
  const rate = landCardRate(p);
  const area = landCardArea(p);
  const facts = landCardFacts(p);
  const approval = landCardApproval(p);
  const footer = landCardFooter(p);
  return (
    <button className="property-copy" onClick={() => onOpen(p)}>
      <h3>{landCardTitle(p)}</h3>
      {(price || rate) && (
        <p className="land-listing-price price">
          {price ? <strong>{price}</strong> : null}
          {rate ? <span className="land-listing-rate">{rate}</span> : null}
        </p>
      )}
      {area ? <p className="land-listing-area">{area}</p> : null}
      {facts ? <p className="land-listing-facts">{facts}</p> : null}
      <p
        className="land-listing-approval"
        data-claimed={approval.claimed ? "true" : "false"}
      >
        {approval.label}
      </p>
      {footer ? <p className="land-listing-footer">{footer}</p> : null}
    </button>
  );
}

export default memo(PropertyCard);
