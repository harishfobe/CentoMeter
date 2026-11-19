import React from "react";
import { publicAsset } from "../lib/publicAsset";

/** Official WhatsApp mark (full colour). Prefer over Lucide MessageCircle. */
export default function WhatsAppIcon({
  size = 16,
  className = "whatsapp-icon",
}) {
  return (
    <img
      className={className}
      src={publicAsset("/icons/whatsapp.svg")}
      width={size}
      height={size}
      alt=""
      decoding="async"
      aria-hidden="true"
    />
  );
}
