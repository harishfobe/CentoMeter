import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  money,
  cityForLocation,
  normalizePostedListing,
  sortProperties,
} from "../src/PropertyModel";
import {
  visitDates,
  compressPhotos,
  landPrice,
  MAX_PHOTO_BYTES,
} from "../src/JourneyUX";
import { pinPrice } from "../src/PlotUI";
import { Costs } from "../src/Discovery";
import { SelectedPropertySheet } from "../src/MinimalUI";
import { StickyContactBar } from "../src/MobileUI";
import { isBlankDraft, persistDraft } from "../src/PhotoStorage";
import properties from "../src/properties.json";
const draft = {
  id: "rent",
  title: "Posted apartment",
  type: "Apartment",
  intent: "RENT",
  price: 42000,
  area: 1200,
  location: [11.0168, 76.9558],
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("Phase 1 money and charges", () => {
  it("promotes rounded lakh boundaries to crore", () => {
    expect(money(9999999)).toBe("₹1 Cr");
    expect(money(-9999999)).toBe("₹-1 Cr");
    expect(money(9940000)).toBe("₹99.4 L");
  });
  it("keeps unknown charges distinct from explicit free charges", () => {
    for (const value of ["", null, undefined, "   ", "bad"]) {
      const p = normalizePostedListing({
        ...draft,
        deposit: value,
        maintenance: value,
      });
      expect(p.deposit).toBe(null);
      expect(p.maintenance).toBe(null);
      const html = renderToStaticMarkup(<Costs p={p} money={money} />);
      expect(html).not.toContain("Refundable deposit");
      expect(html).not.toContain("Monthly maintenance");
      expect(html).not.toContain("Move-in total");
    }
    const p = normalizePostedListing({
      ...draft,
      deposit: "0",
      maintenance: 0,
    });
    expect(p.deposit).toBe(0);
    expect(renderToStaticMarkup(<Costs p={p} money={money} />)).toContain(
      "Refundable deposit",
    );
    expect(money(null)).toBe("—");
  });
});
describe("pin-derived service city", () => {
  it("ignores a stale selected city", () => {
    expect(normalizePostedListing({ ...draft, city: "Chennai" }).city).toBe(
      "Coimbatore",
    );
    expect(cityForLocation([13.0827, 80.2707])).toBe("Chennai");
  });
  it("rejects distant, invalid and just-outside-radius pins", () => {
    for (const point of [
      [28.61, 77.21],
      [11.7, 76.9558],
      [null, 77],
      [91, 0],
      null,
    ])
      expect(cityForLocation(point)).toBe(null);
    expect(normalizePostedListing({ ...draft, location: [28.61, 77.21] })).toBe(
      null,
    );
    expect(cityForLocation([11.2, 76.9558])).toBe("Coimbatore");
  });
});
describe("land rent display and visits", () => {
  const p = {
    ...normalizePostedListing({ ...draft, type: "Land" }),
    locality: "Central",
    city: "Coimbatore",
  };
  it("keeps rent per month regardless of selected land unit", () => {
    for (const unit of ["total", "cent", "sqft"])
      expect(landPrice(p, unit)).toEqual({ amount: 42000, suffix: "" });
    expect(pinPrice(p, money)).toBe("₹42,000/mo");
    const items = [
      { ...p, id: "a", price: 1000, area: 100 },
      { ...p, id: "b", price: 2000, area: 10000 },
    ];
    expect(sortProperties(items, "low", "cent")[0].id).toBe("a");
  });
  it("shows sticky contact actions and keeps visit on the map card", () => {
    const bar = renderToStaticMarkup(<StickyContactBar property={p} />);
    expect(bar).toContain("Chat on WhatsApp");
    expect(bar).toContain("Property Owner");
    expect(bar).toContain("Direct Contact");
    expect(bar).toContain("Zero Brokerage");
    const card = renderToStaticMarkup(
      <SelectedPropertySheet
        p={p}
        money={money}
        onVisit={() => {}}
        onClose={() => {}}
        onOpen={() => {}}
        onSimilar={() => {}}
        priceUnit="cent"
      />,
    );
    expect(card).toContain("Book site visit");
    expect(card).toContain("₹42,000/mo");
    expect(card).not.toContain("Total price");
    expect(card).not.toContain(" total");
  });
});
describe("future visit date choices", () => {
  it.each([
    new Date(2026, 9, 30, 12),
    new Date(2026, 9, 31, 12),
    new Date(2026, 10, 1, 12),
    new Date(2026, 11, 31, 12),
  ])("deduplicates future dates at %s", (now) => {
    const dates = visitDates(now);
    expect(new Set(dates.map((x) => x.value)).size).toBe(dates.length);
    expect(dates.length).toBeGreaterThanOrEqual(2);
    for (const date of dates) {
      expect(new Date(date.value + "T00:00:00").getTime()).toBeGreaterThan(
        now.getTime(),
      );
      expect(date.label).toMatch(/\d/);
    }
    expect(dates).toEqual(
      [...dates].sort((a, b) => a.value.localeCompare(b.value)),
    );
  });
});
describe("optimized photo processing", () => {
  it("reduces quality before resizing and has no whole-draft character cap", async () => {
    const attempts = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ fillRect() {}, drawImage() {} }),
      toDataURL(_format, quality) {
        attempts.push({ width: this.width, quality });
        return (
          "data:image/jpeg;base64," + "A".repeat(quality > 0.5 ? 600000 : 1000)
        );
      },
    };
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 2400;
        naturalHeight = 1800;
        decode() {
          return Promise.resolve();
        }
      },
    );
    vi.stubGlobal("document", { createElement: () => canvas });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:test",
      revokeObjectURL: vi.fn(),
    });
    const result = await compressPhotos(
      [{ type: "image/jpeg" }],
      ["A".repeat(1200000)],
    );
    expect(attempts.length).toBeGreaterThan(1);
    expect(attempts.every((x) => x.width === 1200)).toBe(true);
    expect(attempts.at(-1).quality).toBeLessThan(attempts[0].quality);
    expect(result[0].split(",")[1].length * 0.75).toBeLessThanOrEqual(
      MAX_PHOTO_BYTES,
    );
  });
});
describe("draft and photo writes", () => {
  it("does not save a pristine blank draft", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    expect(
      isBlankDraft({
        type: "Apartment",
        intent: "SELL",
        beds: "1",
        facing: "Not specified",
        photos: [],
        features: [],
        title: "",
        location: null,
      }),
    ).toBe(true);
    expect(
      await persistDraft({ id: "blank", step: 0, data: { photos: [] } }),
    ).toEqual({ ok: true, photosSaved: true, skipped: true });
    expect(setItem).not.toHaveBeenCalled();
    expect(isBlankDraft({ title: "A listing" })).toBe(false);
    expect(isBlankDraft({ deposit: 0 })).toBe(false);
  });
  it("writes only changed photos and reuses restored photos after a reload", async () => {
    vi.resetModules();
    const records = new Map();
    let puts = 0;
    const db = {
      close() {},
      transaction() {
        const tx = {
          objectStore() {
            const request = (action) => {
              const req = {};
              queueMicrotask(() => {
                req.result = action();
                req.onsuccess?.();
                tx.oncomplete?.();
              });
              return req;
            };
            return {
              get: (key) => request(() => records.get(key)),
              put: (value, key) =>
                request(() => {
                  puts++;
                  records.set(key, value);
                }),
              delete: (key) => request(() => records.delete(key)),
            };
          },
        };
        return tx;
      },
    };
    vi.stubGlobal("indexedDB", {
      open() {
        const req = { result: db };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
    });
    let storage = await import("../src/PhotoStorage");
    const data = { photos: ["data:image/jpeg;base64,AAAA"] };
    const first = await storage.storePhotoData(data, "test");
    expect(first.photosSaved).toBe(true);
    await storage.storePhotoData(
      { ...data, title: "Changed title", photos: [...data.photos] },
      "test",
    );
    expect(puts).toBe(1);
    vi.resetModules();
    storage = await import("../src/PhotoStorage");
    const restored = await storage.restorePhotos(first.data);
    await storage.storePhotoData(restored, "test");
    expect(puts).toBe(1);
    await storage.storePhotoData(
      { photos: ["data:image/jpeg;base64,BBBB"] },
      "test",
    );
    expect(puts).toBe(2);
  });
});
describe("clean sample data", () => {
  it("has consistent category fields, unique city titles and prices, dates and photos", () => {
    const byCity = new Map();
    expect(properties.some((p) => p.type === "Land" && p.mode === "RENT")).toBe(
      false,
    );
    for (const p of properties) {
      expect(Number.isFinite(Date.parse(p.postedAt))).toBe(true);
      expect(p.photos.length).toBeGreaterThanOrEqual(p.type === "Land" ? 1 : 2);
      expect(new Set(p.photos).size).toBe(p.photos.length);
      if (p.type === "Land")
        for (const key of [
          "beds",
          "baths",
          "furnishing",
          "occupancy",
          "meals",
          "floor",
          "deposit",
          "maintenance",
          "ac",
          "frontage",
        ])
          expect(p).not.toHaveProperty(key);
      if (p.type === "Commercial")
        for (const key of ["beds", "occupancy", "meals", "pets", "bathroom"])
          expect(p).not.toHaveProperty(key);
      if (p.type === "Apartment") expect(p.beds).toBe(3);
      const list = byCity.get(p.city) || [];
      list.push(p);
      byCity.set(p.city, list);
    }
    for (const list of byCity.values()) {
      expect(new Set(list.map((p) => p.title)).size).toBe(list.length);
      expect(new Set(list.map((p) => p.price)).size).toBe(list.length);
    }
  });
});
