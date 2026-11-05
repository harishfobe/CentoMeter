import React from "react";
import { ChevronDown, Phone, Zap } from "lucide-react";
import { Costs } from "./Discovery";
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
      <details className="mobile-price-details">
        <summary>
          Price details
          <ChevronDown size={16} />
        </summary>
        <Costs p={p} money={money} />
      </details>
    </div>
  );
}

function WhatsAppGlyph({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.94.52 3.75 1.44 5.33L2 22l4.99-1.55a9.86 9.86 0 0 0 5.05 1.37h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2zm5.76 13.99c-.24.68-1.4 1.25-1.93 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.26-4.78-4.18-4.93-4.38-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.29.4-.24.67-.15.27.1 1.72.81 2.01.96.3.15.5.22.57.34.08.13.08.74-.16 1.42z" />
    </svg>
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
    <span className="sticky-contact-avatar sticky-contact-initials" aria-hidden="true">
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
                  <span className="sticky-contact-owner-perk">Zero Brokerage</span>
                </>
              )}
            </span>
          </div>
        </div>
        <div className="sticky-contact-actions">
          {contact.whatsappNumber != null || contact.whatsappHref ? (
            <WhatsAppLink
              className="sticky-contact-whatsapp"
              number={contact.whatsappNumber}
              href={contact.whatsappHref}
              message={contact.whatsappMessage}
            >
              <WhatsAppGlyph size={16} />
              <span>Chat on WhatsApp</span>
            </WhatsAppLink>
          ) : (
            <button type="button" className="sticky-contact-whatsapp" disabled>
              <WhatsAppGlyph size={16} />
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
              aria-label="Call Now"
              disabled
            >
              <Phone size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
