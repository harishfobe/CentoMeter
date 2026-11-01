import React from "react";
import { ChevronDown } from "lucide-react";
import { Costs } from "./Discovery";
import { PriceCaption } from "./MinimalUI";

export function MobilePropertyPrice({ property: p, money }) {
  return (
    <div className="mobile-price-block">
      <div className="mobile-property-price">
        <strong>{money(p.price)}</strong>
        <span>
          <PriceCaption p={p} money={money} />
        </span>
      </div>
      <details className="mobile-price-details">
        <summary>
          Price details
          <ChevronDown size={16} />
        </summary>
        <Costs p={p} money={money} />
      </details>
    </div>
  );
}
