// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  localStorage.clear();
});
it("preserves binary photo references after a failed restore, including public-photo fallbacks", async () => {
  vi.stubGlobal("indexedDB", undefined);
  const storage = await import("../src/PhotoStorage");
  for (const photos of [[], ["/apartment.jpg"]]) {
    const original = { id: "recover", photoKey: "listing:recover", photos };
    const restored = await storage.restorePhotos(original);
    expect(storage.hasPhotoRestoreFailure(restored)).toBe(true);
    const result = await storage.persistListings([restored]);
    expect(result.photosSaved).toBe(false);
    expect(
      JSON.parse(localStorage.getItem("centometer-listings"))[0].photoKey,
    ).toBe("listing:recover");
  }
});
it("clears only the completed draft, leaving a newer editor intact", async () => {
  vi.stubGlobal("indexedDB", undefined);
  const { removeDraft } = await import("../src/PhotoStorage");
  localStorage.setItem(
    "centometer-draft",
    JSON.stringify({ id: "new", data: { title: "New work" } }),
  );
  localStorage.setItem(
    "centometer-draft-bank",
    JSON.stringify([
      { id: "old", data: {} },
      { id: "new", data: { title: "New work" } },
    ]),
  );
  expect(await removeDraft("old")).toBe(true);
  expect(JSON.parse(localStorage.getItem("centometer-draft")).id).toBe("new");
  expect(
    JSON.parse(localStorage.getItem("centometer-draft-bank")).map((x) => x.id),
  ).toEqual(["new"]);
});
it("reports failed draft removal instead of claiming a discard succeeded", async () => {
  const { removeDraft } = await import("../src/PhotoStorage");
  localStorage.setItem(
    "centometer-draft",
    JSON.stringify({ id: "keep", data: {} }),
  );
  const remove = vi
    .spyOn(Storage.prototype, "removeItem")
    .mockImplementation(() => {
      throw Error("blocked");
    });
  try {
    expect(await removeDraft("keep")).toBe(false);
    expect(JSON.parse(localStorage.getItem("centometer-draft")).id).toBe(
      "keep",
    );
  } finally {
    remove.mockRestore();
  }
});
