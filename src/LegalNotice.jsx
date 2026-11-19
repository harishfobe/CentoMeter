import React from "react";
import { ArrowLeft } from "lucide-react";

export default function LegalNotice({ kind, onBack }) {
  const privacy = kind === "privacy";
  return (
    <section className="page legal-page">
      <button className="packages-back" type="button" onClick={onBack} aria-label="Back">
        <ArrowLeft size={22} />
      </button>
      <div className="page-intro">
        <p className="eyebrow">{privacy ? "PRIVACY" : "TERMS"}</p>
        <h1>{privacy ? "Privacy Policy" : "Terms of use"}</h1>
      </div>
      {privacy ? (
        <div className="form-stack legal-copy">
          <p>
            CentoMeter is a design preview. It keeps your account on this device,
            not on a CentoMeter account server.
          </p>
          <p>
            The profile name, email, phone number, and photo stay in this browser.
            Saved homes, saved searches, listing drafts, visit requests, and
            location requests stay here too.
          </p>
          <p>
            Listing photos load from this site. The map loads tiles from
            OpenStreetMap. This preview does not send your profile or requests
            to a CentoMeter server.
          </p>
          <p>
            Sign out keeps that information on the device. Delete account, in
            Edit profile, removes the account, saved homes, drafts, and requests
            from this device. Clearing the browser’s site data does the same.
          </p>
        </div>
      ) : (
        <div className="form-stack legal-copy">
          <p>
            This preview is for trying the CentoMeter interface. It is not a
            brokerage, and it does not list homes for sale or rent.
          </p>
          <p>
            Properties, prices, agents, phone numbers, and RERA references are
            illustrative. Visit requests and messages are saved on this device
            and are not delivered to anyone.
          </p>
          <p>
            There are no payments in this preview. Package prices are examples.
          </p>
        </div>
      )}
    </section>
  );
}
