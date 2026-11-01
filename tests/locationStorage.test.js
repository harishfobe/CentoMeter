import { it, expect, vi } from "vitest";
import { indexedDB } from "fake-indexeddb";
it("retains one private approximation across writes and a vault reload", async () => {
  vi.stubGlobal("indexedDB", indexedDB);
  try {
    let storage = await import("../src/lib/locationAccess");
    const first = await storage.registerExactLocation(
      "posted-private",
      [12, 77],
      500,
    );
    expect(
      await storage.registerExactLocation("posted-private", [12, 77], 500),
    ).toEqual(first);
    vi.resetModules();
    storage = await import("../src/lib/locationAccess");
    await storage.restoreExactLocations();
    expect(
      await storage.registerExactLocation("posted-private", [12, 77], 500),
    ).toEqual(first);
    storage.setAccessRequests([
      {
        propertyId: "posted-private",
        agentId: "a1",
        viewerId: "one",
        status: "approved",
      },
    ]);
    expect(storage.getExactLocation("posted-private", "two")).toBeNull();
    expect(storage.getExactLocation("posted-private", "one")).toEqual([12, 77]);
  } finally {
    vi.unstubAllGlobals();
  }
});
