// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import useOverlayBack from "../src/OverlayHistory";
const backFinished = async () => {
  await act(async () => {
    history.replaceState({ sentinel: 42 }, "");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: history.state }),
    );
    await Promise.resolve();
  });
};
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
