// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
const io = vi.hoisted(() => ({
  persistDraft: vi.fn(),
  persistListings: vi.fn(),
  restoreListings: vi.fn(),
  migrateDraftPhotos: vi.fn(),
  hasPhotoRestoreFailure: vi.fn(() => false),
}));
vi.mock("../src/PhotoStorage", () => io);
import useDraftStorage from "../src/useDraftStorage";
import useListingStorage from "../src/useListingStorage";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.clearAllMocks();
  io.persistDraft.mockResolvedValue({ ok: true, photosSaved: true });
  io.persistListings.mockResolvedValue({ ok: true, photosSaved: true });
  io.restoreListings.mockImplementation(async (x) => x);
  io.migrateDraftPhotos.mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("reports a rejected draft write and permits retry without an unhandled promise", async () => {
  io.persistDraft.mockRejectedValueOnce(Error("blocked"));
  const h = renderHook(() =>
    useDraftStorage({ id: 1, step: 0, data: { title: "Draft" } }, true),
  );
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(h.result.current.status).toMatch(/could not be saved/);
  await act(async () => {
    expect(await h.result.current.flush()).toEqual({
      ok: true,
      photosSaved: true,
    });
  });
  expect(h.result.current.status).toMatch(/saved automatically/);
});
it("stops the draft debounce before awaiting an in-flight write", async () => {
  const pending = deferred();
  io.persistDraft.mockReturnValueOnce(pending.promise);
  const h = renderHook(
    ({ data }) => useDraftStorage({ id: 1, step: 0, data }, true),
    { initialProps: { data: { title: "First" } } },
  );
  await act(() => vi.advanceTimersByTimeAsync(500));
  h.rerender({ data: { title: "Second" } });
  let stopped;
  act(() => {
    stopped = h.result.current.stop();
  });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  await act(async () => {
    pending.resolve({ ok: true, photosSaved: true });
    await stopped;
  });
  h.unmount();
  expect(io.persistDraft).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it("deduplicates a flush of the same draft snapshot", async () => {
  const data = { title: "Same" };
  const h = renderHook(() => useDraftStorage({ id: 1, step: 0, data }, true));
  await act(() => vi.advanceTimersByTimeAsync(500));
  await act(async () => {
    await h.result.current.flush();
    await h.result.current.stop();
  });
  h.unmount();
  expect(io.persistDraft).toHaveBeenCalledTimes(1);
});
it("finishes listing loading and reports a failed restore", async () => {
  io.restoreListings.mockRejectedValueOnce(Error("read failed"));
  const report = vi.fn();
  const h = renderHook(() => useListingStorage(report));
  await act(async () => {});
  expect(h.result.current.ready).toBe(true);
  expect(report).toHaveBeenCalledWith(
    expect.stringMatching(/could not be restored/),
  );
});
it("does not resurrect a listing deleted during hydration", async () => {
  localStorage.setItem(
    "centometer-listings",
    JSON.stringify([{ id: 1 }, { id: 2 }]),
  );
  const pending = deferred();
  io.restoreListings.mockReturnValueOnce(pending.promise);
  const h = renderHook(() => useListingStorage(vi.fn()));
  act(() =>
    h.result.current.setDrafts((rows) => rows.filter((x) => x.id !== 1)),
  );
  await act(async () => {
    pending.resolve([
      { id: 1, photos: ["one"] },
      { id: 2, photos: ["two"] },
    ]);
    await pending.promise;
  });
  expect(h.result.current.drafts).toEqual([{ id: 2, photos: ["two"] }]);
});
it("cancels a stale listing debounce when an explicit save starts", async () => {
  const h = renderHook(() => useListingStorage(vi.fn()));
  await act(async () => {});
  act(() => h.result.current.setDrafts([{ id: "old" }]));
  const pending = deferred();
  io.persistListings.mockReturnValueOnce(pending.promise);
  let saved;
  act(() => {
    saved = h.result.current.saveListings([{ id: "new" }]);
  });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(io.persistListings).toHaveBeenCalledTimes(1);
  expect(io.persistListings).toHaveBeenCalledWith([{ id: "new" }]);
  await act(async () => {
    pending.resolve({ ok: true, photosSaved: true });
    await saved;
    h.result.current.setDrafts([{ id: "new" }]);
  });
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(
    io.persistListings.mock.calls.every(([rows]) => rows[0].id === "new"),
  ).toBe(true);
});
it("reports background listing failures and keeps the queue usable", async () => {
  const report = vi.fn();
  const h = renderHook(() => useListingStorage(report));
  await act(async () => {});
  io.persistListings.mockRejectedValueOnce(Error("write failed"));
  act(() => h.result.current.setDrafts([{ id: 1 }]));
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(report).toHaveBeenCalledWith(
    expect.stringMatching(/could not be saved/),
  );
  await act(async () => {
    expect((await h.result.current.saveListings([{ id: 2 }])).ok).toBe(true);
  });
});
it("does not report or set loading state after unmount", async () => {
  const pending = deferred();
  io.restoreListings.mockReturnValueOnce(pending.promise);
  const report = vi.fn();
  const h = renderHook(() => useListingStorage(report));
  h.unmount();
  await act(async () => {
    pending.reject(Error("late"));
    await Promise.resolve();
  });
  expect(report).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
