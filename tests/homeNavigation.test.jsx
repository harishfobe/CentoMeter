// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
vi.mock("../src/MapView", () => ({ default: () => <div data-testid="map" /> }));
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
  fireEvent.click(within(tabs).getByRole("tab", { name: "RENT" }));
  expect(
    within(tabs)
      .getByRole("tab", { name: "RENT" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  fireEvent.click(within(tabs).getByRole("tab", { name: "BUY" }));
  expect(
    within(tabs)
      .getByRole("tab", { name: "BUY" })
      .getAttribute("aria-selected"),
  ).toBe("true");
});
