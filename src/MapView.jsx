import React, { lazy, Suspense } from "react";
import LoadingSkeleton from "./components/LoadingSkeleton";
const Map = lazy(() => import("./MapViewImpl"));
export default function MapView(props) {
  return (
    <Suspense fallback={<LoadingSkeleton kind="map" />}>
      <Map {...props} />
    </Suspense>
  );
}
