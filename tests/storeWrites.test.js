// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { updateStore, flushStore } from "../src/lib/agentStore";
it("debounces persistent writes while updating the in-memory snapshot immediately", async () => {
  vi.useFakeTimers();
  const write = vi.spyOn(Storage.prototype, "setItem");
  try {
    updateStore((s) => ({ ...s, reports: [] }));
    updateStore((s) => ({ ...s, reports: [{ reason: "Test" }] }));
    expect(
      write.mock.calls.filter(([key]) => key === "centometer-agents-v2"),
    ).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(250);
    expect(
      write.mock.calls.filter(([key]) => key === "centometer-agents-v2"),
    ).toHaveLength(1);
  } finally {
    flushStore();
    write.mockRestore();
    vi.useRealTimers();
  }
});
