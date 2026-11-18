import React from "react";
import { ArrowLeft } from "lucide-react";

const packages = [
  {
    name: "Free",
    price: "₹0",
    period: "Sample listing",
    current: true,
    points: [
      "1 sample listing kept on this device",
      "Shown in search and on the map",
      "Standard photo set",
    ],
  },
  {
    name: "Featured",
    price: "₹1,499",
    period: "30 days",
    points: [
      "Marked as a featured sample",
      "Room for a larger photo set",
      "Listed with featured placement",
    ],
  },
  {
    name: "Agent",
    price: "₹4,999",
    period: "30 days",
    points: [
      "Several listings under one profile",
      "An agent profile in the finder",
      "Visit requests saved on this device",
    ],
  },
];

export default function PackagePricing({ onBack }) {
  return (
    <section className="page packages-page" aria-label="Package and pricing">
      <button
        type="button"
        className="packages-back"
        onClick={onBack}
        aria-label="Back to profile"
      >
        <ArrowLeft size={22} aria-hidden="true" />
      </button>
      <div className="page-intro">
        <p className="eyebrow">PROFILE</p>
        <h1>Package and Pricing</h1>
        <p>
          Sample packages for this prototype. Nothing is billed, and choosing a
          package does not activate a plan.
        </p>
      </div>
      <ul className="package-list">
        {packages.map((item) => (
          <li key={item.name} className="package-card">
            <div className="package-card-head">
              <h2>{item.name}</h2>
              {item.current ? <span className="pill">Current sample</span> : null}
            </div>
            <p className="package-price">
              <strong>{item.price}</strong>
              <span>{item.period}</span>
            </p>
            <ul>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
