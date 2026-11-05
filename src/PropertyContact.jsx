import WhatsAppLink from "./components/WhatsAppLink";
import React from "react";
import { exactLocation } from "./lib/locationAccess";
import { indianMobile } from "./PropertyModel";
import { Phone, UserRound } from "lucide-react";
import WhatsAppIcon from "./components/WhatsAppIcon";
function contactNumber(value) {
  const digits = indianMobile(value);
  return digits ? "91" + digits : null;
}
function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
/** Resolve agent vs owner contact presentation for the sticky contact bar. */
export function resolveListingContact(p, agent = null) {
  const isAgent = Boolean(
    agent || p.agentId || p.seller === "Agent" || p.contactType === "agent",
  );
  const name =
    agent?.name ||
    p.contactName ||
    (isAgent ? "Agent" : p.seller === "Builder" ? "Builder" : "Property owner");
  const role = isAgent
    ? "Partner"
    : p.seller === "Builder"
      ? "Builder"
      : "Property Owner";
  const callDigits = contactNumber(
    p.contactPhone || p.phone || (isAgent ? null : p.whatsapp),
  );
  const whatsappNumber =
    (agent && agent.whatsapp) ||
    indianMobile(p.whatsapp || p.contactPhone || p.phone) ||
    null;
  const whatsappMessage = isAgent
    ? "Hello, I am interested in " +
      p.title +
      " (" +
      p.id +
      ") on CentoMeter."
    : "Hi, I saw your property on CentoMeter — " +
      p.title +
      " in " +
      [p.locality, p.city].filter(Boolean).join(", ") +
      ". Please share more details.";
  const replyMins = agent?.responseTimeMins;
  return {
    isAgent,
    name,
    role,
    avatar: agent?.avatar || null,
    initials: initials(name),
    callHref: callDigits ? "tel:+" + callDigits : null,
    whatsappNumber,
    whatsappMessage,
    replyLabel:
      replyMins == null
        ? "10 mins"
        : replyMins < 60
          ? replyMins + " mins"
          : Math.round(replyMins / 60) + " h",
  };
}
function contactLinks(p) {
  const phone = contactNumber(p.contactPhone || p.phone);
  const whatsapp = contactNumber(p.whatsapp || p.contactPhone || p.phone);
  return {
    call: phone ? "tel:+" + phone : null,
    whatsapp: whatsapp
      ? "https://wa.me/" +
        whatsapp +
        "?text=" +
        encodeURIComponent(
          "Hi, I am interested in " +
            p.title +
            " in " +
            p.locality +
            ", " +
            p.city +
            ". Please share more details.",
        )
      : null,
  };
}
export function SellerProfile({ p }) {
  return (
    <div className="seller-profile">
      <span className="seller-avatar" aria-hidden="true">
        <UserRound size={20} />
      </span>
      <div>
        <strong>{p.contactName || "Property owner"}</strong>
        <small>{p.seller || "Owner"}</small>
      </div>
    </div>
  );
}
export function ContactButtons({ p }) {
  const links = contactLinks(p);
  return (
    <div className="direct-contact">
      <div className="direct-contact-buttons">
        {links.call ? (
          <a className="contact-call" href={links.call}>
            <Phone size={17} />
            Call Now
          </a>
        ) : (
          <button className="contact-call" disabled>
            <Phone size={17} />
            Call Now
          </button>
        )}
        {links.whatsapp ? (
          <WhatsAppLink className="contact-whatsapp" href={links.whatsapp}>
            <WhatsAppIcon size={18} />
            WhatsApp
          </WhatsAppLink>
        ) : (
          <button className="contact-whatsapp" disabled>
            <WhatsAppIcon size={18} />
            WhatsApp
          </button>
        )}
      </div>
      {!links.call && !links.whatsapp && (
        <small className="contact-unavailable">
          Contact number not provided
        </small>
      )}
    </div>
  );
}
export function propertyHotspots(p, requests = []) {
  const point = exactLocation(p, requests);
  if (!point) return [];
  const [lat, lng] = point;
  const east = 111.32 * Math.cos((lat * Math.PI) / 180);
  return [
    {
      id: "school",
      label: "School",
      distance: "600 m",
      north: 0.45,
      east: -0.4,
      glyph: "S",
    },
    {
      id: "hospital",
      label: "Hospital",
      distance: "1.2 km",
      north: 0.75,
      east: 0.94,
      glyph: "H",
    },
    {
      id: "transit",
      label: "Transit",
      distance: "900 m",
      north: -0.65,
      east: -0.62,
      glyph: "T",
    },
    {
      id: "retail",
      label: "Retail",
      distance: "1.8 km",
      north: -1.25,
      east: 1.3,
      glyph: "R",
    },
  ].map((x) => ({
    ...x,
    lat: lat + x.north / 111.32,
    lng: lng + x.east / east,
  }));
}
