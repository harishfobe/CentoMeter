import React, { memo } from "react";
import { Heart, Phone } from "lucide-react";
import { typeLabel } from "../PropertyTypes";
import { publicAsset } from "../lib/publicAsset";
import { notifyAgent } from "../lib/agentStore";
import { listingContactLinks } from "../PropertyContact";
import WhatsAppIcon from "./WhatsAppIcon";
import WhatsAppLink from "./WhatsAppLink";
import {
  landCardFooter,
  listingCardArea,
  listingCardFacts,
  listingCardPrice,
  listingCardRate,
  listingCardTitle,
} from "../listingPresentation";

function keepUnitsTogether(text) {
  return String(text)
    .replace(/sq\s+ft/gi, "sq\u00A0ft")
    .replace(/(\d)\s+(cents|baths?|built-up)/gi, "$1\u00A0$2");
}

function PriceLine({ price, rate }) {
  if (!price && !rate) return null;
  return (
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
  );
}

function CardContact({ p }) {
  const links = listingContactLinks(p);
  const callLabel = "Call " + p.title;
  const whatsappLabel = "WhatsApp " + p.title;
  return (
    <div className="listing-card-actions">
      <WhatsAppLink
        className="listing-card-whatsapp"
        href={links.whatsapp || undefined}
        aria-label={whatsappLabel}
      >
        <WhatsAppIcon size={32} />
      </WhatsAppLink>
      {links.call ? (
        <a
          className="listing-card-call"
          href={links.call}
          aria-label={callLabel}
        >
          <Phone size={15} aria-hidden="true" />
        </a>
      ) : (
        <button
          type="button"
          className="listing-card-call"
          aria-label={callLabel}
          onClick={() => notifyAgent("Contact number not provided")}
        >
          <Phone size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function PropertyCard({
  p,
  saved,
  onSave,
  onOpen,
  compact = false,
  priceUnit = "total",
  layout = "row",
}) {
  void compact;
  void priceUnit;
  const feature = layout === "feature";
  const price = listingCardPrice(p);
  const rate = listingCardRate(p);
  const area = listingCardArea(p);
  const facts = listingCardFacts(p);
  const footer = landCardFooter(p);
  const factParts = facts
    ? String(facts)
        .split(" • ")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
  return (
    <article
      className={
        "property-card listing-row" + (feature ? " listing-feature" : "")
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
      <div className="listing-row-main">
        <button className="property-copy" onClick={() => onOpen(p)}>
          <h3>{listingCardTitle(p)}</h3>
          {feature ? (
            <div className="listing-feature-metrics">
              <PriceLine price={price} rate={rate} />
              {area ? (
                <p className="listing-row-area">{keepUnitsTogether(area)}</p>
              ) : null}
            </div>
          ) : (
            <PriceLine price={price} rate={rate} />
          )}
          {feature && factParts.length ? (
            <p className="listing-feature-facts">
              {factParts.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </p>
          ) : null}
          {!feature && area ? <p className="listing-row-area">{area}</p> : null}
          {!feature && facts ? (
            <p className="listing-row-facts">{facts}</p>
          ) : null}
        </button>
        <div className="listing-card-bar">
          {footer ? (
            <button
              type="button"
              className="listing-row-footer"
              onClick={() => onOpen(p)}
            >
              {footer}
            </button>
          ) : (
            <span className="listing-row-footer" />
          )}
          <CardContact p={p} />
        </div>
      </div>
    </article>
  );
}

export default memo(PropertyCard);
