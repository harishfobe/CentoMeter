// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, renderHook, act, cleanup } from "@testing-library/react";
import { Modal } from "../src/Modal";
import useOverlayBack from "../src/OverlayHistory";
import { useAgentNavigation } from "../src/lib/agentNavigation";
const backFinished = async () => {
  await act(async () => {
    history.replaceState({ sentinel: 42 }, "");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: history.state }),
    );
    await Promise.resolve();
  });
};
it("waits for a child dialog's pending Back before closing its parent listing", async () => {
  history.replaceState(
    { sentinel: 42, centometerListing: true },
    "",
    "#agent/test?l=al1",
  );
  const back = vi.spyOn(history, "back").mockImplementation(() => {});
  const listing = renderHook(() => useAgentNavigation("agent/test?l=al1"));
  const child = renderHook(() => useOverlayBack(true, vi.fn()));
  await act(async () => {});
  child.unmount();
  expect(back).toHaveBeenCalledTimes(1);
  await act(async () => listing.result.current.close());
  expect(back).toHaveBeenCalledTimes(1);
  await act(async () => {
    history.replaceState({ sentinel: 42, centometerListing: true }, "");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: history.state }),
    );
    await Promise.resolve();
  });
  expect(back).toHaveBeenCalledTimes(2);
  listing.unmount();
});
it("releases a dialog's history entry when exit starts, before its animation unmounts", async () => {
  history.replaceState({ sentinel: 42 }, "");
  const back = vi.spyOn(history, "back").mockImplementation(() => {});
  const view = render(
    <Modal title="Posting dialog" onClose={() => {}}>
      Draft
    </Modal>,
  );
  await act(async () => {});
  expect(history.state.centometerOverlay).toBeTruthy();
  view.rerender(
    <Modal title="Posting dialog" onClose={() => {}} exiting>
      Draft
    </Modal>,
  );
  expect(back).toHaveBeenCalledTimes(1);
  expect(view.getByRole("dialog")).toBeTruthy();
  await backFinished();
  view.unmount();
  expect(back).toHaveBeenCalledTimes(1);
});
afterEach(async () => {
  cleanup();
  await backFinished();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("waits for a delayed Back before giving a replacement dialog its own entry", async () => {
  vi.useFakeTimers();
  history.replaceState({ sentinel: 42 }, "");
  vi.spyOn(history, "back").mockImplementation(() => {});
  const first = renderHook(() => useOverlayBack(true, vi.fn()));
  await act(async () => {});
  const old = history.state.centometerOverlay;
  expect(old).toBeTruthy();
  first.unmount();
  const second = renderHook(() => useOverlayBack(true, vi.fn()));
  await act(async () => {});
  await act(() => vi.advanceTimersByTimeAsync(1500));
  expect(history.state.centometerOverlay).toBe(old);
  // A spurious popstate without a state change cannot complete the pending Back.
  act(() =>
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: history.state }),
    ),
  );
  await act(async () => {});
  expect(history.state.centometerOverlay).toBe(old);
  await backFinished();
  expect(history.state.centometerOverlay).toBeTruthy();
  expect(history.state.centometerOverlay).not.toBe(old);
  expect(history.state.sentinel).toBe(42);
  second.unmount();
  await backFinished();
});
it("reports a rejected history push without an unhandled promise or bogus Back", async () => {
  const toast = vi.fn();
  window.addEventListener("centometer-toast", toast);
  const back = vi.spyOn(history, "back").mockImplementation(() => {});
  vi.spyOn(history, "pushState").mockImplementation(() => {
    throw Error("blocked");
  });
  const h = renderHook(() => useOverlayBack(true, vi.fn()));
  await act(async () => {});
  expect(toast).toHaveBeenCalledTimes(1);
  h.unmount();
  expect(back).not.toHaveBeenCalled();
  window.removeEventListener("centometer-toast", toast);
});
it("cleans up a failed Back while preserving unrelated history state", async () => {
  history.replaceState({ sentinel: 42 }, "");
  vi.spyOn(history, "back").mockImplementation(() => {
    throw Error("blocked");
  });
  const toast = vi.fn();
  window.addEventListener("centometer-toast", toast);
  const h = renderHook(() => useOverlayBack(true, vi.fn()));
  await act(async () => {});
  h.unmount();
  await act(async () => {});
  expect(history.state).toEqual({ sentinel: 42 });
  expect(toast).toHaveBeenCalled();
  window.removeEventListener("centometer-toast", toast);
});
