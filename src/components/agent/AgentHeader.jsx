import WhatsAppLink from "../WhatsAppLink";
import React from "react";
import { MapPin, Phone, ShieldCheck, Share2 } from "lucide-react";
import WhatsAppIcon from "../WhatsAppIcon";
import { indianMobile } from "../../PropertyModel";
import { responseLabel } from "../../lib/agents";
import StatsRow from "./StatsRow";
import { notifyAgent, toggleStore, useAgentStore } from "../../lib/agentStore";

function contactLabel(value) {
  const digits = indianMobile(value);
  if (!digits) return value;
  return "+91 " + digits.slice(0, 5) + " " + digits.slice(5);
}

function AgentContactNumber({ agent }) {
  const number = agent.phone || agent.whatsapp || "";
  if (!number) return null;
  const digits = indianMobile(number);
  const label = contactLabel(number);
  const content = (
    <>
      <Phone size={18} aria-hidden="true" />
      <span>
        <small>Contact number</small>
        <strong>{label}</strong>
      </span>
    </>
  );
  if (!digits) {
    return (
      <button
        type="button"
        className="agent-contact-number"
        onClick={() =>
          notifyAgent("Demo contact number: " + number + " is a sample number.")
        }
      >
        {content}
      </button>
    );
  }
  return (
    <a className="agent-contact-number" href={"tel:+91" + digits}>
      {content}
    </a>
  );
}
export default function AgentHeader({ agent: a, count, onShare }) {
  const s = useAgentStore();
  return (
    <header className="agent-profile-heading">
      <div className="agent-identity">
        <img src={a.avatar} alt="" width="64" height="64" />
        <div>
          <h1>{a.name}</h1>
          <p>
            @{a.handle}{" "}
            {a.verified && (
              <abbr title="Sample verification flag, not an independent identity or RERA check">
                <ShieldCheck size={13} aria-hidden="true" /> Verified
              </abbr>
            )}
          </p>
          <p>
            <MapPin size={13} aria-hidden="true" />
            {a.city} · {a.languages.join(", ")}
          </p>
        </div>
      </div>
      {responseLabel(a) && (
        <p className="agent-response">
          <span aria-hidden="true" />
          {responseLabel(a)}
        </p>
      )}
      <StatsRow agent={a} count={count} compact />
      <AgentContactNumber agent={a} />
      <details>
        <summary>About · Read more</summary>
        <p>{a.bio}</p>
        {a.reraAgentNo && (
          <p className="agent-registration">RERA agent no. {a.reraAgentNo}</p>
        )}
      </details>
      <div className="action-row">
        <WhatsAppLink
          className="primary"
          number={a.whatsapp}
          message={
            "Hello " + a.name + ", I am interested in your CentoMeter listings."
          }
        >
          <WhatsAppIcon size={17} /> Message on WhatsApp
        </WhatsAppLink>
        <a
          className="secondary"
          href={a.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
        <button className="secondary" onClick={onShare}>
          <Share2 size={15} aria-hidden="true" /> Share
        </button>
        <button
          className="secondary"
          aria-pressed={s.followed.includes(a.id)}
          onClick={() => toggleStore("followed", a.id)}
        >
          {s.followed.includes(a.id) ? "Following" : "Follow"}
        </button>
      </div>
    </header>
  );
}
