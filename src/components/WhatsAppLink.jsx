import React from "react";
import { notifyAgent } from "../lib/agentStore";
export default function WhatsAppLink({
  number,
  message,
  href,
  children,
  ...props
}) {
  const demo = number != null && !/^\d{10}$/.test(number);
  const url =
    href ||
    "https://wa.me/91" + number + "?text=" + encodeURIComponent(message || "");
  return (
    <a
      {...props}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (demo) {
          event.preventDefault();
          notifyAgent("Demo WhatsApp: " + number + " is a fake number.");
        }
      }}
    >
      {children}
    </a>
  );
}
