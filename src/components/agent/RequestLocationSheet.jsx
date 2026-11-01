import React, { useState } from "react";
import { requestLocation, notifyAgent } from "../../lib/agentStore";
import { responseLabel } from "../../lib/agents";
export default function RequestLocationSheet({
  p,
  agent,
  source,
  Modal,
  onClose,
}) {
  const [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  return (
    <Modal title="Request location" onClose={onClose}>
      {sent ? (
        <div role="status">
          <h3>Request sent</h3>
          <p>
            @{agent.handle} {responseLabel(agent).toLowerCase()}
          </p>
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              requestLocation(
                p,
                {
                  name: f.get("name"),
                  phone: f.get("phone"),
                  message: f.get("message"),
                  budget: f.get("budget"),
                  timeline: f.get("timeline"),
                  consent: f.get("consent") === "on",
                },
                source,
              );
              setSent(true);
              notifyAgent("Location request sent. This is a local demo.");
              navigator.vibrate?.(8);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>
            Name
            <input name="name" required autoComplete="name" maxLength="80" />
          </label>
          <label>
            Indian mobile
            <input
              name="phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 mobile number"
            />
          </label>
          <label>
            Message (optional)
            <textarea name="message" maxLength="500" />
          </label>
          <label>
            Budget (optional)
            <input name="budget" type="number" min="0" />
          </label>
          <label>
            Timeline (optional)
            <input name="timeline" placeholder="e.g. This month" />
          </label>
          <label>
            <input name="consent" type="checkbox" required />I agree to share
            these details with {agent.name} for this property enquiry only.
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="primary">Send request</button>
        </form>
      )}
    </Modal>
  );
}
