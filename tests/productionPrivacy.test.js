import { it, expect, vi } from "vitest";
it("uses obviously fake production sample coordinates rather than loading the fixture", async () => {
  vi.stubEnv("DEV", false);
  vi.stubEnv("PROD", true);
  vi.stubEnv("MODE", "production");
  vi.resetModules();
  try {
    const access = await import("../src/lib/locationAccess");
    access.setAccessRequests([
      {
        propertyId: "al1",
        viewerId: "buyer",
        agentId: "a1",
        status: "approved",
      },
    ]);
    expect(access.getExactLocation("al1", "buyer")).toEqual([0, 0]);
    expect(access.getExactLocation("al1", "other")).toBeNull();
  } finally {
    vi.unstubAllEnvs();
  }
});
