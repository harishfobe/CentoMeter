import React from "react";
import { Phone } from "lucide-react";
import { PriceCaption } from "./MinimalUI";
import WhatsAppLink from "./components/WhatsAppLink";
import { resolveListingContact } from "./PropertyContact";
import { publicAsset } from "./lib/publicAsset";
import { pricePerCent } from "./PlotUI";
import {
  houseBuyPriceMeta,
  houseRentDepositLabel,
  houseRentMaintenanceLabel,
  usesHomeDetailLayout,
} from "./HouseVillaDetails";
import {
  commercialBuyPriceMeta,
  commercialRentDepositLabel,
  commercialRentMaintenanceLabel,
  usesCommercialDetailLayout,
} from "./CommercialDetails";
import {
  pgRentDepositLabel,
  pgRentMealsLine,
  usesPgDetailLayout,
} from "./PgDetails";

function landBuyPriceMeta(p) {
  const pool = [
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.highlights) ? p.highlights : []),
    p.tag,
  ]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim());
  const negotiable =
    p.negotiable === true ||
    /^yes$/i.test(String(p.negotiable || "").trim()) ||
    pool.some((value) => /negotiable/i.test(value));
  const perSqft =
    Number(p.area) > 0 && Number(p.price) > 0
      ? "₹" +
        Math.round(Number(p.price) / Number(p.area)).toLocaleString("en-IN") +
        " / sqft"
      : null;
  return {
    perSqft,
    negotiable,
    perCent: pricePerCent(p),
  };
}

export function MobilePropertyPrice({ property: p, money }) {
  if (p.type === "Land" && p.mode === "BUY") {
    const { perSqft, negotiable, perCent } = landBuyPriceMeta(p);
    return (
      <div className="mobile-price-block land-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>{money(p.price)}</strong>
          {(perSqft || negotiable) && (
            <span>
              {[perSqft, negotiable ? "Negotiable" : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
          {perCent ? (
            <span className="land-price-equivalent">
              Equivalent: {money(perCent)} / Cent
            </span>
          ) : null}
        </div>
      </div>
    );
  }
  if (usesHomeDetailLayout(p) && p.mode === "BUY") {
    const { perSqft, negotiable } = houseBuyPriceMeta(p);
    return (
      <div className="mobile-price-block land-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>{money(p.price)}</strong>
          {(perSqft || negotiable) && (
            <span>
              {[perSqft, negotiable ? "Negotiable" : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
      </div>
    );
  }
  if (usesHomeDetailLayout(p) && p.mode === "RENT") {
    const maintenance = houseRentMaintenanceLabel(p);
    const deposit = houseRentDepositLabel(p);
    return (
      <div className="mobile-price-block land-price-block rent-home-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>
            {money(p.price)}
            <span className="pg-price-period"> / month</span>
          </strong>
          {maintenance ? (
            <span className="rent-home-maintenance">{maintenance}</span>
          ) : null}
          {deposit ? (
            <span className="rent-home-deposit">{deposit}</span>
          ) : null}
        </div>
      </div>
    );
  }
  if (usesCommercialDetailLayout(p) && p.mode === "BUY") {
    const { perSqft, negotiable } = commercialBuyPriceMeta(p);
    return (
      <div className="mobile-price-block land-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>{money(p.price)}</strong>
          {(perSqft || negotiable) && (
            <span>
              {[perSqft, negotiable ? "Negotiable" : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
      </div>
    );
  }
  if (usesCommercialDetailLayout(p) && p.mode === "RENT") {
    const maintenance = commercialRentMaintenanceLabel(p);
    const deposit = commercialRentDepositLabel(p);
    return (
      <div className="mobile-price-block land-price-block rent-commercial-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>
            {money(p.price)}
            <span className="pg-price-period"> / month</span>
          </strong>
          {maintenance ? (
            <span className="rent-commercial-maintenance">{maintenance}</span>
          ) : null}
          {deposit ? (
            <span className="rent-commercial-deposit">{deposit}</span>
          ) : null}
        </div>
      </div>
    );
  }
  if (usesPgDetailLayout(p)) {
    const meals = pgRentMealsLine(p);
    const deposit = pgRentDepositLabel(p);
    return (
      <div className="mobile-price-block land-price-block rent-pg-price-block">
        <div className="mobile-property-price land-property-price">
          <strong>
            {money(p.price)}
            <span className="pg-price-period"> / month</span>
          </strong>
          {meals ? <span className="rent-pg-meals">{meals}</span> : null}
          {deposit ? <span className="rent-pg-deposit">{deposit}</span> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="mobile-price-block">
      <div className="mobile-property-price">
        <strong>{money(p.price)}</strong>
        <span>
          <PriceCaption p={p} money={money} />
        </span>
      </div>
    </div>
  );
}

function ContactAvatar({ contact }) {
  if (contact.avatar) {
    return (
      <img
        className="sticky-contact-avatar"
        src={publicAsset(contact.avatar)}
        alt=""
        width="46"
        height="46"
      />
    );
  }
  return (
    <span
      className="sticky-contact-avatar sticky-contact-initials"
      aria-hidden="true"
    >
      {contact.initials}
    </span>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.9c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.39.86-.39h.62c.2 0 .46-.07.72.55.27.64.93 2.22 1.01 2.38.08.16.13.35.03.56-.1.21-.16.34-.31.53-.15.18-.32.41-.46.55-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.24.67-.15.27.1 1.72.81 2.02.96.3.15.49.22.56.34.08.13.08.73-.16 1.41z"
      />
    </svg>
  );
}

function contactStatus(contact) {
  if (contact.isAgent) return "agent";
  if (contact.role === "Builder") return "builder";
  return "owner";
}

/** Fixed dual-action contact bar for property and agent listing details. */
export function StickyContactBar({ property, agent = null, className = "" }) {
  if (!property) return null;
  const contact = resolveListingContact(property, agent);
  const status = contactStatus(contact);
  return (
    <div
      className={"sticky-contact-bar " + className}
      role="region"
      aria-label="Contact listing"
    >
      <div className="sticky-contact-bar-inner">
        <div className="sticky-contact-meta">
          <ContactAvatar contact={contact} />
          <div className="sticky-contact-copy">
            <strong className="sticky-contact-name">{contact.name}</strong>
            <span className="sticky-contact-status">{status}</span>
          </div>
        </div>
        <div className="sticky-contact-actions">
          {contact.whatsappNumber != null ? (
            <WhatsAppLink
              className="sticky-contact-whatsapp"
              number={contact.whatsappNumber}
              message={contact.whatsappMessage}
            >
              <WhatsAppGlyph />
              <span>WhatsApp</span>
            </WhatsAppLink>
          ) : (
            <button type="button" className="sticky-contact-whatsapp" disabled>
              <WhatsAppGlyph />
              <span>WhatsApp</span>
            </button>
          )}
          {contact.callHref ? (
            <a
              className="sticky-contact-call"
              href={contact.callHref}
              aria-label="Call now"
            >
              <Phone size={20} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className="sticky-contact-call"
              disabled
              aria-label="Contact number not provided"
              title="Contact number not provided"
            >
              <Phone size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
