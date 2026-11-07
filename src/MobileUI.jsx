import React from "react";
import { Phone, Zap } from "lucide-react";
import WhatsAppIcon from "./components/WhatsAppIcon";
import { PriceCaption } from "./MinimalUI";
import WhatsAppLink from "./components/WhatsAppLink";
import { resolveListingContact } from "./PropertyContact";
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
          {deposit ? (
            <span className="rent-pg-deposit">{deposit}</span>
          ) : null}
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
        src={contact.avatar}
        alt=""
        width="40"
        height="40"
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

/** Fixed dual-action contact bar for property and agent listing details. */
export function StickyContactBar({ property, agent = null, className = "" }) {
  if (!property) return null;
  const contact = resolveListingContact(property, agent);
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
            <strong className="sticky-contact-name">
              {contact.name}
              <span aria-hidden="true"> • </span>
              {contact.role}
            </strong>
            <span className="sticky-contact-status">
              {contact.isAgent ? (
                <>
                  <span className="sticky-contact-online">
                    <span className="sticky-contact-dot" aria-hidden="true" />
                    Online
                  </span>
                  <span className="sticky-contact-reply">
                    <Zap size={11} aria-hidden="true" />
                    Replies in {contact.replyLabel}
                  </span>
                </>
              ) : (
                <>
                  <span className="sticky-contact-online">
                    <span className="sticky-contact-dot" aria-hidden="true" />
                    Direct Contact
                  </span>
                  <span className="sticky-contact-owner-perk">
                    Zero Brokerage
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
        <div className="sticky-contact-actions">
          {contact.whatsappNumber != null ? (
            <WhatsAppLink
              className="sticky-contact-whatsapp"
              number={contact.whatsappNumber}
              message={contact.whatsappMessage}
            >
              <WhatsAppIcon size={16} />
              <span>Chat on WhatsApp</span>
            </WhatsAppLink>
          ) : (
            <button type="button" className="sticky-contact-whatsapp" disabled>
              <WhatsAppIcon size={16} />
              <span>Chat on WhatsApp</span>
            </button>
          )}
          {contact.callHref ? (
            <a
              className="sticky-contact-call"
              href={contact.callHref}
              aria-label="Call Now"
            >
              <Phone size={18} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className="sticky-contact-call"
              disabled
              aria-label="Call Now"
            >
              <Phone size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
