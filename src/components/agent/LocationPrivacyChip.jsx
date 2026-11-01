import React from "react";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
export default function LocationPrivacyChip({ p, unlocked = false }) {
  return (
    <span className={"pill agent-privacy " + (unlocked ? "is-unlocked" : "")}>
      {unlocked ? <LockKeyholeOpen size={14} /> : <LockKeyhole size={14} />}{" "}
      {unlocked
        ? "Exact location"
        : p.privacy.mode === "radius"
          ? "Within ~" + p.privacy.radiusM + " m"
          : "Location on request"}
    </span>
  );
}
