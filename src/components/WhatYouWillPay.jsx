import React from "react";
import { money } from "../PropertyModel";
import {
  brokerageLabel,
  knownMoveIn,
  moveInExclusionNote,
} from "../listingPresentation";

/** Rental "What you will pay" with known move-in amount and exclusion notes. */
export default function WhatYouWillPay({ p, formatMoney = money }) {
  if (!p || p.mode !== "RENT") return null;
  const moveIn = knownMoveIn(p);
  const maintenance = Number(p.maintenance);
  const deposit = Number(p.deposit);
  const rows = [
    {
      label: "Monthly rent",
      value: formatMoney(p.price),
    },
    {
      label: "Maintenance",
      value: Number.isFinite(maintenance) && maintenance >= 0
        ? `${formatMoney(maintenance)}${maintenance > 0 ? " extra" : ""}`
        : "Not provided",
    },
    {
      label: "Refundable deposit",
      value:
        Number.isFinite(deposit) && deposit >= 0
          ? formatMoney(deposit)
          : "Not provided",
    },
    {
      label: "Brokerage",
      value: brokerageLabel(p, { formatMoney }),
    },
  ];
  return (
    <section className="what-you-will-pay" aria-label="What you will pay">
      <h2>What you will pay</h2>
      <dl className="what-you-will-pay-list">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {moveIn ? (
          <div className="what-you-will-pay-total">
            <dt>Known move-in amount</dt>
            <dd>{formatMoney(moveIn.total)}</dd>
          </div>
        ) : null}
      </dl>
      {moveIn?.excluded?.length ? (
        <p className="what-you-will-pay-note">
          {moveInExclusionNote(moveIn.excluded)}
        </p>
      ) : (
        <p className="what-you-will-pay-note">
          Known move-in amount includes first month rent
          {Number.isFinite(maintenance) && maintenance >= 0
            ? ", maintenance"
            : ""}
          {Number.isFinite(deposit) && deposit >= 0 ? ", deposit" : ""}
          {brokerageLabel(p) !== "Not provided" ? " and brokerage" : ""}.
        </p>
      )}
      <p className="fine-print">
        Provided by the seller; not independently verified by CentoMeter.
      </p>
    </section>
  );
}
