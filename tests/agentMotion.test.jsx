// @vitest-environment jsdom
import React, { Profiler } from "react";
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  renderHook,
  cleanup,
  act,
  screen,
  fireEvent,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import ListingCard from "../src/components/agent/ListingCard";
import useExpiryTick from "../src/lib/useExpiryTick";
import { snapshot, toggleStore, flushStore } from "../src/lib/agentStore";
import { listings } from "../src/lib/agents";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("does not subscribe listing cards to store changes", () => {
  const commits = vi.fn(),
    handler = () => {};
  render(
    <Profiler id="card" onRender={commits}>
      <ListingCard p={listings[0]} onSave={handler} onOpen={handler} />
    </Profiler>,
  );
  const before = commits.mock.calls.length;
  act(() => toggleStore("saved", "unrelated-id"));
  expect(commits.mock.calls.length).toBe(before);
  flushStore();
});
it("only refreshes expiry labels inside the last hour, and stops at expiry", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
  const requests = [{ status: "approved", expiresAt: "2026-11-01T14:00:00Z" }];
  const hook = renderHook(() => useExpiryTick(requests));
  const first = hook.result.current;
  await act(() => vi.advanceTimersByTimeAsync(3600000 - 1));
  expect(hook.result.current).toBe(first);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(hook.result.current).not.toBe(first);
  await act(() => vi.advanceTimersByTimeAsync(3600000));
  expect(vi.getTimerCount()).toBe(0);
});
it("has no interval in the listing detail sheet", () => {
  expect(
    readFileSync("src/components/agent/ListingDetailSheet.jsx", "utf8"),
  ).not.toMatch(/setInterval\s*\(/);
});
it("rolls back optimistic preferences with a notification if persistence fails", async () => {
  flushStore();
  vi.useFakeTimers();
  const before = snapshot().saved.includes("failed-save");
  const notify = vi.fn();
  window.addEventListener("centometer-toast", notify);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("Storage blocked");
  });
  act(() => toggleStore("saved", "failed-save"));
  expect(snapshot().saved.includes("failed-save")).toBe(!before);
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(snapshot().saved.includes("failed-save")).toBe(before);
  expect(notify).toHaveBeenCalled();
  window.removeEventListener("centometer-toast", notify);
});
it("still calls card actions with the listing id", () => {
  const save = vi.fn();
  render(<ListingCard p={listings[0]} onSave={save} onOpen={() => {}} />);
  fireEvent.click(screen.getByLabelText("Save " + listings[0].title));
  expect(save).toHaveBeenCalledWith(listings[0].id);
});
