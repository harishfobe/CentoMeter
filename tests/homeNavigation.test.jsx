// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
const mapCallbacks = vi.hoisted(() => ({ bounds: null }));
vi.mock("../src/MapView", () => ({
  default: ({ onBounds }) => {
    mapCallbacks.bounds = onBounds;
    return <div data-testid="map" />;
  },
}));
vi.mock("../src/useListingStorage", () => ({
  default: () => ({
    drafts: [],
    ready: true,
    setDrafts: vi.fn(),
    saveListings: vi.fn(),
  }),
}));
vi.mock("../src/PostFlow", () => ({ default: () => <h1>Post property</h1> }));
vi.mock("../src/lib/locationAccess", async (original) => ({
  ...(await original()),
  restoreExactLocations: vi.fn().mockResolvedValue(),
}));
import App from "../src/App";
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "#home");
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("uses Home/Map/Agents/Activity/Profile and opens the full map from its tab", async () => {
  render(<App />);
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(
    within(nav)
      .getAllByRole("button")
      .map((el) => el.textContent),
  ).toEqual(["Home", "Map", "Agents", "Activity", "Profile"]);
  expect(
    within(nav)
      .getByRole("button", { name: "Home" })
      .getAttribute("aria-current"),
  ).toBe("page");
  fireEvent.click(
    within(nav).getByRole("button", { name: "Map", exact: true }),
  );
  await waitFor(() => expect(location.hash).toBe("#map"));
  expect(document.querySelector(".map-only")).toBeTruthy();
  expect(screen.getByTestId("map")).toBeTruthy();
  expect(
    within(nav)
      .getByRole("button", { name: "Map", exact: true })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(screen.queryByRole("button", { name: "Explore full map" })).toBeNull();
  expect(screen.getByRole("button", { name: "View list" })).toBeTruthy();
  expect(document.querySelector(".search-controls")).toBeTruthy();
});
it("adds SELL between BUY and RENT and opens the existing posting route", async () => {
  render(<App />);
  const tabs = screen.getByRole("tablist", { name: "Property intent" });
  expect(
    within(tabs)
      .getAllByRole("tab")
      .map((el) => el.textContent),
  ).toEqual(["BUY", "SELL", "RENT"]);
  fireEvent.click(within(tabs).getByRole("tab", { name: "SELL" }));
  expect(
    await screen.findByRole("heading", { name: "Post property" }),
  ).toBeTruthy();
  expect(location.hash).toBe("#post");
});
it("retains BUY and RENT filtering on Home", async () => {
  render(<App />);
  const tabs = screen.getByRole("tablist", { name: "Property intent" });
  const types = document.querySelector(".property-types-reveal");
  expect(types.getAttribute("data-expanded")).toBe("false");
  fireEvent.click(within(tabs).getByRole("tab", { name: "BUY" }));
  expect(types.getAttribute("data-expanded")).toBe("true");
  expect(screen.getByRole("region", { name: "Property type" })).toBeTruthy();
  fireEvent.click(within(tabs).getByRole("tab", { name: "BUY" }));
  expect(types.getAttribute("data-expanded")).toBe("false");
  fireEvent.click(within(tabs).getByRole("tab", { name: "RENT" }));
  expect(
    within(tabs)
      .getByRole("tab", { name: "RENT" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(types.getAttribute("data-expanded")).toBe("true");
  fireEvent.click(within(tabs).getByRole("tab", { name: "RENT" }));
  expect(types.getAttribute("data-expanded")).toBe("false");
  fireEvent.click(within(tabs).getByRole("tab", { name: "BUY" }));
  expect(
    within(tabs)
      .getByRole("tab", { name: "BUY" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(types.getAttribute("data-expanded")).toBe("true");
});

it("switches Map to its list and back without changing route or active tab", async () => {
  history.replaceState(null, "", "#map");
  render(<App />);
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  const toggle = screen.getByRole("button", { name: "View list", exact: true });
  fireEvent.click(toggle);
  expect(location.hash).toBe("#map");
  expect(document.querySelector(".map-list-mode")).toBeTruthy();
  expect(
    screen.getByRole("complementary", { name: "Property list" }),
  ).toBeTruthy();
  expect(
    within(nav)
      .getByRole("button", { name: "Map", exact: true })
      .getAttribute("aria-current"),
  ).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "Back to map" }));
  expect(location.hash).toBe("#map");
  expect(document.querySelector(".map-only")).toBeTruthy();
  expect(
    screen.queryByRole("complementary", { name: "Property list" }),
  ).toBeNull();
  expect(document.activeElement).toBe(toggle);
});
it("keeps the full property list off Home and ends with local agents", async () => {
  const app = render(<App />);
  expect(app.container.querySelector("#property-results")).toBeNull();
  expect(
    app.container
      .querySelector(".home-discovery")
      .lastElementChild.getAttribute("aria-label"),
  ).toBe("Featured local agents");
});

it("keeps map-list properties when a hidden map emits collapsed bounds", () => {
  history.replaceState(null, "", "#map");
  const app = render(<App />);
  act(() => mapCallbacks.bounds({ contains: () => true }));
  fireEvent.click(
    screen.getByRole("button", { name: "View list", exact: true }),
  );
  const count = app.container.querySelectorAll(
    "#property-results .property-card",
  ).length;
  expect(count).toBeGreaterThan(0);
  act(() => mapCallbacks.bounds({ contains: () => false }));
  expect(
    app.container.querySelectorAll("#property-results .property-card"),
  ).toHaveLength(count);
});

it("keeps home discovery listings when the preview map area is empty", () => {
  history.replaceState(null, "", "#home");
  const app = render(<App />);
  const before = app.container.querySelectorAll(
    ".home-discovery .property-card",
  ).length;
  expect(before).toBeGreaterThan(0);
  act(() => mapCallbacks.bounds({ contains: () => false }));
  expect(
    app.container.querySelectorAll(".home-discovery .property-card"),
  ).toHaveLength(before);
  expect(
    screen.queryByRole("button", {
      name: /No properties in this view/,
    }),
  ).toBeNull();
});
