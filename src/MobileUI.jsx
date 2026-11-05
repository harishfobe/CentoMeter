import React from "react";
import { Phone, Zap } from "lucide-react";
import WhatsAppIcon from "./components/WhatsAppIcon";
import { PriceCaption } from "./MinimalUI";
import WhatsAppLink from "./components/WhatsAppLink";
import { resolveListingContact } from "./PropertyContact";

export function MobilePropertyPrice({ property: p, money }) {
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
