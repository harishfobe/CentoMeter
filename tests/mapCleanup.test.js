// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import L from "leaflet";
import { disposeMap } from "../src/lib/disposeMap";
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("makes a pending Leaflet zoom completion harmless after the map is removed", async () => {
  vi.useFakeTimers();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const host = document.createElement("div");
  document.body.append(host);
  const map = L.map(host).setView([12.97, 77.6], 11);
  map._animatingZoom = true;
  map._animateToCenter = L.latLng([12.97, 77.6]);
  map._animateToZoom = 12;
  setTimeout(() => map._onZoomTransitionEnd(), 250);
  disposeMap(map);
  await vi.advanceTimersByTimeAsync(250);
  expect(map._mapPane).toBeUndefined();
  expect(host._leaflet_id).toBeUndefined();
  host.remove();
});
