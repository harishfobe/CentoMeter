import React from "react";

/** Official WhatsApp mark (full colour). Prefer over Lucide MessageCircle. */
export default function WhatsAppIcon({ size = 16, className = "whatsapp-icon" }) {
  return (
    <img
      className={className}
      src="/icons/whatsapp.svg"
      width={size}
      height={size}
      alt=""
      decoding="async"
      aria-hidden="true"
    />
  );
}
