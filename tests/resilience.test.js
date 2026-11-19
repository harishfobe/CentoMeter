import { expect, it, vi } from "vitest";
import { openExternal } from "../src/lib/externalLink";
import { publicAsset } from "../src/lib/publicAsset";

it("keeps root public paths unchanged and leaves remote photos alone", () => {
  expect(publicAsset("/centometer-header-logo.png")).toBe(
    "/centometer-header-logo.png",
  );
  expect(publicAsset("/apartment.jpg")).toBe("/apartment.jpg");
  expect(publicAsset("data:image/png;base64,abc")).toBe(
    "data:image/png;base64,abc",
  );
  expect(publicAsset("blob:https://local/photo")).toBe(
    "blob:https://local/photo",
  );
  expect(publicAsset("https://example.com/a.jpg")).toBe(
    "https://example.com/a.jpg",
  );
  expect(publicAsset("")).toBe("");
});

it("opens an https link outside the WebView only when Capacitor is present", () => {
  const plain = {
    currentTarget: { href: "https://wa.me/919000000000" },
    preventDefault: vi.fn(),
  };
  openExternal(plain);
  expect(plain.preventDefault).not.toHaveBeenCalled();

  const open = vi.fn();
  globalThis.Capacitor = { Plugins: { Browser: { open } } };
  const event = {
    currentTarget: {
      href: "https://www.google.com/maps/dir/?api=1&destination=1,2",
    },
    preventDefault: vi.fn(),
  };
  openExternal(event);
  expect(event.preventDefault).toHaveBeenCalledOnce();
  expect(open).toHaveBeenCalledWith({ url: event.currentTarget.href });
  delete globalThis.Capacitor;

  const phone = {
    currentTarget: { href: "tel:+919000000000" },
    preventDefault: vi.fn(),
  };
  openExternal(phone);
  expect(phone.preventDefault).not.toHaveBeenCalled();
});
