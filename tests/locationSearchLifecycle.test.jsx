// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import LocationSearch from "../src/LocationSearch";
import AgentFinder from "../src/pages/AgentFinder";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("aborts locality search when the city changes and ignores the old response", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
  let resolve;
  const fetch = vi.fn(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const view = render(
    <LocationSearch
      city="Coimbatore"
      value="RS Puram"
      onChange={() => {}}
      onPick={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Find locality/ }));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(fetch).toHaveBeenCalledTimes(1);
  view.rerender(
    <LocationSearch
      city="Chennai"
      value="RS Puram"
      onChange={() => {}}
      onPick={() => {}}
    />,
  );
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () =>
    resolve({
      ok: true,
      json: async () => [
        { lat: "12", lon: "77", display_name: "Old city result", place_id: 1 },
      ],
    }),
  );
  expect(screen.queryByRole("button", { name: "Old city result" })).toBeNull();
});
it("does not let late geolocation replace a city the user selected afterwards", () => {
  let success;
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: (fn) => {
        success = fn;
      },
    },
  });
  const Modal = ({ children }) => <section role="dialog">{children}</section>;
  render(<AgentFinder Modal={Modal} onNavigate={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Near me", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "City: Any" }));
  fireEvent.click(
    screen.getByRole("radio", { name: "Coimbatore", exact: true }),
  );
  act(() => success({ coords: { latitude: 13.09, longitude: 80.28 } }));
  expect(screen.getByRole("button", { name: "City: Coimbatore" })).toBeTruthy();
});
it("clears pending Finder input and blur timers on unmount", () => {
  vi.useFakeTimers();
  const view = render(
    <AgentFinder
      Modal={({ children }) => <section>{children}</section>}
      onNavigate={() => {}}
    />,
  );
  fireEvent.blur(screen.getByRole("combobox"));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
