// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import HomeDiscovery from "../src/components/HomeDiscovery";
import properties from "../src/properties.json";
const home = properties[0];
const builder = { ...properties[2], seller: "Builder", mode: "BUY" };
const defaults = {
  items: [home, builder],
  city: "Bengaluru",
  saved: [],
  recent: [],
  onSave: vi.fn(),
  onOpen: vi.fn(),
  onBrowse: vi.fn(),
  priceUnit: "total",
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("renders the approved discovery sections using existing listing data", () => {
  render(<HomeDiscovery {...defaults} />);
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((el) => el.textContent),
  ).toEqual(["Suggested for you", "Spotlight", "Projects", "Most popular"]);
  expect(screen.getAllByText(home.title).length).toBeGreaterThan(0);
  expect(
    screen.queryByText(
      /most saved this week|verified developers|new launches/i,
    ),
  ).toBeNull();
});
it("reuses save and open actions and reflects the saved state across sections", () => {
  const app = render(<HomeDiscovery {...defaults} />);
  let suggested = screen.getByRole("region", { name: "Suggested properties" });
  fireEvent.click(
    within(suggested).getByRole("button", { name: "Save " + home.title }),
  );
  expect(defaults.onSave).toHaveBeenCalledWith(home.id);
  fireEvent.click(
    within(suggested).getByRole("button", { name: "View " + home.title }),
  );
  expect(defaults.onOpen).toHaveBeenCalledWith(home);
  app.rerender(<HomeDiscovery {...defaults} saved={[home.id]} />);
  suggested = screen.getByRole("region", { name: "Suggested properties" });
  expect(
    within(suggested)
      .getByRole("button", { name: "Unsave " + home.title })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.getByText("Saved and viewed on this device")).toBeTruthy();
});
it("retains a working path to the original property list", () => {
  render(<HomeDiscovery {...defaults} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Browse all properties" }),
  );
  expect(defaults.onBrowse).toHaveBeenCalledTimes(1);
});
it("omits empty projects and gives empty results a recovery action", () => {
  const app = render(<HomeDiscovery {...defaults} items={[home]} />);
  expect(screen.queryByRole("heading", { name: "Projects" })).toBeNull();
  app.rerender(<HomeDiscovery {...defaults} items={[]} />);
  expect(
    screen.getByRole("heading", { name: "No matching suggestions" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Browse all properties" }),
  );
  expect(defaults.onBrowse).toHaveBeenCalledTimes(1);
});

it("keeps land unit prices consistent in Spotlight and popular rows", () => {
  const land = { ...home, type: "Land", price: 10000000, area: 4356 };
  render(<HomeDiscovery {...defaults} items={[land]} priceUnit="cent" />);
  expect(
    within(
      screen.getByRole("region", { name: "Spotlight property" }),
    ).getByText("₹10 L / cent"),
  ).toBeTruthy();
  expect(
    within(
      screen.getByRole("region", { name: "Popular properties" }),
    ).getByText("₹10 L / cent"),
  ).toBeTruthy();
});
it("keeps the existing per-bed monthly rent label for PG listings", () => {
  const pg = {
    ...home,
    type: "PG",
    mode: "RENT",
    price: 30000,
    occupancy: "Sharing",
  };
  render(<HomeDiscovery {...defaults} items={[pg]} />);
  expect(
    within(
      screen.getByRole("region", { name: "Spotlight property" }),
    ).getByText("₹30,000 / bed / month"),
  ).toBeTruthy();
});
