// @vitest-environment jsdom
import React, { Profiler } from "react";
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  act,
  cleanup,
  screen,
  fireEvent,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  followed: [],
  saved: [],
  requests: [
    {
      id: "expired",
      viewerId: "test",
      agentId: "a1",
      propertyId: "al1",
      status: "approved",
      expiresAt: "2020-01-01T00:00:00Z",
    },
  ],
  visits: [],
  events: [],
  overrides: {},
  customListings: [],
}));
vi.mock("../src/lib/agentStore", async (importOriginal) => ({
  ...(await importOriginal()),
  useAgentStore: () => state,
}));
vi.mock("../src/useListingStorage", () => ({
  default: () => ({
    drafts: [],
    ready: true,
    setDrafts: vi.fn(),
    saveListings: vi.fn(),
  }),
}));
vi.mock("../src/lib/locationAccess", async (importOriginal) => ({
  ...(await importOriginal()),
  restoreExactLocations: vi.fn().mockResolvedValue(),
}));
import App from "../src/App";
import { restoreExactLocations } from "../src/lib/locationAccess";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "#home");
});
it("does not continuously rerender for an already expired agent approval", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  history.replaceState(null, "", "#profile");
  const commits = vi.fn();
  render(
    <Profiler id="app" onRender={commits}>
      <App />
    </Profiler>,
  );
  await act(async () => {});
  const before = commits.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(10));
  expect(commits.mock.calls.length).toBe(before);
});

it("shows a recovery action for unknown routes instead of an empty page", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  history.replaceState(null, "", "#unknown-route");
  render(<App />);
  await act(async () => {});
  expect(
    screen.getByRole("heading", { name: "Page not found", level: 1 }),
  ).toBeTruthy();
  expect(document.querySelectorAll(".empty")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Back to exploring" }));
  expect(location.hash).toBe("#home");
});
it("reports a saved-places storage failure visibly", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(
    function (key, value) {
      if (key === "centometer-saved") throw Error("blocked");
      return original.call(this, key, value);
    },
  );
  history.replaceState(null, "", "#profile");
  render(<App />);
  await act(async () => {});
  expect(screen.getByText(/Saved places could not be retained/)).toBeTruthy();
  vi.restoreAllMocks();
});

it("reports failed private-location restoration and keeps recovery visible", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  restoreExactLocations.mockRejectedValueOnce(Error("unavailable"));
  history.replaceState(null, "", "#profile");
  render(<App />);
  expect(
    await screen.findByText(/Private locations could not be restored/),
  ).toBeTruthy();
});
