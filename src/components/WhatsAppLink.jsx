import React from "react";
import { notifyAgent } from "../lib/agentStore";
import { openExternal } from "../lib/externalLink";
export default function WhatsAppLink({
  number,
  message,
  href,
  children,
  ...props
}) {
  const hasNumber = number != null && number !== "";
  const demo = hasNumber && !/^\d{10}$/.test(String(number));
  const url =
    href ||
    (hasNumber
      ? "https://wa.me/91" +
        number +
        "?text=" +
        encodeURIComponent(message || "")
      : "");
  if (!url) {
    return (
      <button
        type="button"
        {...props}
        onClick={() => notifyAgent("No WhatsApp number is listed.")}
      >
        {children}
      </button>
    );
  }
  return (
    <a
      {...props}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (demo) {
          event.preventDefault();
          notifyAgent(number + " is not a working WhatsApp number.");
          return;
        }
        notifyAgent("Opening WhatsApp");
        openExternal(event);
      }}
    >
      {children}
    </a>
  );
}
