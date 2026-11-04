import React from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Costs } from "./Discovery";
import { PriceCaption } from "./MinimalUI";
import WhatsAppLink from "./components/WhatsAppLink";
import { propertyWhatsApp } from "./PropertyContact";

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

/** Fixed mobile CTA so WhatsApp stays visible above the home indicator. */
export function StickyWhatsAppBar({
  property,
  href,
  number,
  message,
  label = "WhatsApp",
}) {
  const fromProperty = property ? propertyWhatsApp(property) : null;
  const linkHref = href || fromProperty?.href;
  const linkNumber = number ?? fromProperty?.number;
  const linkMessage = message ?? fromProperty?.message;
  if (!linkHref && (linkNumber == null || linkNumber === "")) return null;
  return (
    <div
      className="sticky-whatsapp-bar"
      role="region"
      aria-label="Contact on WhatsApp"
    >
      <WhatsAppLink
        className="sticky-whatsapp-cta"
        href={linkHref}
        number={linkNumber}
        message={linkMessage}
      >
        <MessageCircle size={20} aria-hidden="true" />
        {label}
      </WhatsAppLink>
    </div>
  );
}
