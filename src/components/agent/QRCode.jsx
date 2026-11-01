import React from "react";
import { qrMatrix } from "../../lib/qr";
export default function QRCode({ value }) {
  let matrix;
  try {
    matrix = qrMatrix(value);
  } catch {
    return <p>Link is too long for this QR. Use Copy my link.</p>;
  }
  return (
    <svg
      role="img"
      aria-label="Agent profile QR code"
      width="180"
      height="180"
      viewBox="-4 -4 45 45"
      shapeRendering="crispEdges"
    >
      <rect x="-4" y="-4" width="45" height="45" fill="white" />
      {matrix.flatMap((row, y) =>
        row.map((v, x) =>
          v ? (
            <rect
              key={x + "," + y}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="#18181B"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
