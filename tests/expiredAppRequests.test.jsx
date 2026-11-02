// @vitest-environment jsdom
import React, { Profiler } from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
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
