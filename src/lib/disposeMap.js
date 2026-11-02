// Leaflet 1.9.4's zoom fallback timeout is not cancelled by Map.remove().
// Clear its animation flag before removing panes so a late callback is a no-op.
// Keep this version-specific teardown guard covered when upgrading Leaflet.
export function disposeMap(map) {
  map._animatingZoom = false;
  map.remove();
}
