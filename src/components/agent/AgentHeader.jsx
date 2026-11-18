import WhatsAppLink from "../WhatsAppLink";
import React from "react";
import { MapPin, Phone, ShieldCheck, Share2 } from "lucide-react";
import WhatsAppIcon from "../WhatsAppIcon";
import { indianMobile } from "../../PropertyModel";
import { responseLabel } from "../../lib/agents";
import StatsRow from "./StatsRow";
import { notifyAgent, toggleStore, useAgentStore } from "../../lib/agentStore";

function ContactButton({ agent }) {
  const number = agent.phone || agent.whatsapp || "";
  const digits = indianMobile(number);
  const content = (
    <>
      <Phone size={17} aria-hidden="true" /> Contact
    </>
  );
  if (digits) {
    return (
      <a className="secondary agent-reach" href={"tel:+91" + digits}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className="secondary agent-reach"
      onClick={() =>
        notifyAgent(
          number
            ? "Demo contact number: " + number + " is a sample number."
            : "No contact number is listed for this agent.",
        )
      }
    >
      {content}
    </button>
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
      <div className="action-row">
        <ContactButton agent={a} />
        <WhatsAppLink
          className="primary agent-reach"
          number={a.whatsapp}
          message={
            "Hello " + a.name + ", I am interested in your CentoMeter listings."
          }
        >
          <WhatsAppIcon size={17} /> WhatsApp
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
