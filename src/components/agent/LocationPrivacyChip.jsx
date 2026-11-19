import React from "react";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
export default function LocationPrivacyChip({ p, unlocked = false }) {
  const privacy = p?.privacy;
  const radius = Number(privacy?.radiusM);
  const label = unlocked
    ? "Exact location"
    : privacy?.mode === "radius"
      ? "Within ~" + (Number.isFinite(radius) ? radius : 0) + " m"
      : "Location on request";
  return (
    <span className={"pill agent-privacy " + (unlocked ? "is-unlocked" : "")}>
      <span className="agent-lock-swap" data-unlocked={unlocked}>
        <LockKeyholeOpen size={14} />
        <LockKeyhole size={14} />
      </span>{" "}
      {label}
    </span>
  );
}
