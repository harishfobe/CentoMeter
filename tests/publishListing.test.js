import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  registerExactLocation: vi.fn(),
  updateStore: vi.fn(),
}));
vi.mock("../src/lib/locationAccess", () => ({
  registerExactLocation: mocks.registerExactLocation,
}));
vi.mock("../src/lib/agentStore", () => ({ updateStore: mocks.updateStore }));
import { savePostedListing } from "../src/lib/savePostedListing";
const draft = {
  id: 3,
  type: "Apartment",
  intent: "SELL",
  title: "Test listing",
  price: 10000000,
  area: 1200,
  beds: 2,
  location: [12.97, 77.6],
  photos: [],
  address: "private",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.registerExactLocation.mockResolvedValue([12.98, 77.61]);
});
it("does not publish an agent listing to the public store if persistence fails", async () => {
  const saveListings = vi.fn().mockResolvedValue({ ok: false });
  await expect(
    savePostedListing({
      data: draft,
      agent: { id: "a1", name: "Agent" },
      drafts: [],
      saveListings,
    }),
  ).rejects.toThrow(/storage/);
  expect(mocks.updateStore).not.toHaveBeenCalled();
});
it("publishes an agent listing only after persistence succeeds and strips private fields", async () => {
  const saveListings = vi.fn(async () => {
    expect(mocks.updateStore).not.toHaveBeenCalled();
    return { ok: true, photosSaved: true };
  });
  const { next } = await savePostedListing({
    data: draft,
    agent: { id: "a1", name: "Agent" },
    drafts: [],
    saveListings,
  });
  expect(next[0].agentId).toBe("a1");
  expect(next[0]).not.toHaveProperty("address");
  expect(next[0]).not.toHaveProperty("location");
  expect(mocks.updateStore).toHaveBeenCalledTimes(1);
});
