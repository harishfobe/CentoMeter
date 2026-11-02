// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
vi.mock("../src/lib/agentMotion", async (original) => ({
  ...(await original()),
  useCardEntrance: () => null,
  reducedMotion: vi.fn(() => false),
  animateMotion: vi.fn(() => null),
}));
import { animateMotion, reducedMotion } from "../src/lib/agentMotion";
import ListingGrid from "../src/components/agent/ListingGrid";
import LoadingSkeleton from "../src/components/LoadingSkeleton";
import { listings } from "../src/lib/agents";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
});
const props = {
  rows: listings.slice(0, 2),
  saved: [],
  requests: new Map(),
  unlocked: new Set(),
  compared: [],
  onOpen: () => {},
  onSave: () => {},
  onCompare: () => {},
};
it("keeps card nodes and measures direct children for a view-switch FLIP", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function () {
      const list = this.closest('[data-view="list"]');
      return { x: 0, y: 0, width: list ? 400 : 200, height: list ? 180 : 300 };
    },
  );
  reducedMotion.mockReturnValue(false);
  const app = render(<ListingGrid {...props} view="grid" />);
  const cards = [
    ...app.container.querySelectorAll(".agent-motion-grid > [data-listing-id]"),
  ];
  app.rerender(<ListingGrid {...props} view="list" />);
  expect([
    ...app.container.querySelectorAll(".agent-motion-grid > [data-listing-id]"),
  ]).toEqual(cards);
  expect(animateMotion).toHaveBeenCalledWith(
    cards[0],
    [
      { translate: "0px 0px", scale: `${200 / 400} ${300 / 180}` },
      { translate: "0 0", scale: "1 1" },
    ],
    { duration: 220 },
  );
});
it("switches instantly for reduced motion", () => {
  reducedMotion.mockReturnValue(true);
  const app = render(<ListingGrid {...props} view="grid" />);
  app.rerender(<ListingGrid {...props} view="list" />);
  expect(animateMotion).not.toHaveBeenCalled();
  expect(app.container.querySelectorAll(".property-card--list")).toHaveLength(
    2,
  );
});
it.each([
  ["finder", "centometer-view-finder"],
  ["profile", "centometer-view-agent-listings"],
])("matches the persisted %s skeleton to list layout", (kind, key) => {
  localStorage.setItem(key, '"list"');
  const app = render(<LoadingSkeleton kind={kind} />);
  expect(app.container.querySelector(".loading-skeleton").dataset.view).toBe(
    "list",
  );
  expect(app.container.querySelectorAll(".loading-card")).toHaveLength(3);
});

it("cancels a pending FLIP when the user switches views again", () => {
  reducedMotion.mockReturnValue(false);
  const cancel = vi.fn();
  animateMotion.mockReturnValue({ cancel });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function () {
      return {
        x: 0,
        y: 0,
        width: this.closest('[data-view="list"]') ? 400 : 200,
        height: 200,
      };
    },
  );
  const app = render(<ListingGrid {...props} view="grid" />);
  app.rerender(<ListingGrid {...props} view="list" />);
  app.rerender(<ListingGrid {...props} view="grid" />);
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(
    app.container.querySelectorAll(".agent-motion-grid > [data-listing-id]"),
  ).toHaveLength(2);
});
