// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import useViewMode from "../src/useViewMode";
import ViewToggle from "../src/components/ViewToggle";

function Example({ storageKey = "test-view" }) {
  const [view, setView] = useViewMode(storageKey);
  return <ViewToggle view={view} onChange={setView} />;
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
it("defaults to grid and announces the selected view", () => {
  render(<Example />);
  expect(screen.getByRole("group", { name: "Listing view" })).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Grid view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    screen
      .getByRole("button", { name: "List view" })
      .getAttribute("aria-pressed"),
  ).toBe("false");
  expect(screen.getByText("Grid view selected").getAttribute("aria-live")).toBe(
    "polite",
  );
});
it("switches without losing focus, announces list, and persists after remount", () => {
  const app = render(<Example />);
  const button = screen.getByRole("button", { name: "List view" });
  button.focus();
  fireEvent.click(button);
  expect(document.activeElement).toBe(button);
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(
    screen
      .getByRole("button", { name: "Grid view" })
      .getAttribute("aria-pressed"),
  ).toBe("false");
  expect(screen.getByText("List view selected").getAttribute("aria-live")).toBe(
    "polite",
  );
  app.unmount();
  render(<Example />);
  expect(
    screen
      .getByRole("button", { name: "List view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
it.each(["broken-json", '"table"', "false", "{}", "null"])(
  "ignores corrupt or invalid storage: %s",
  (value) => {
    localStorage.setItem("test-view", value);
    render(<Example />);
    expect(
      screen
        .getByRole("button", { name: "Grid view" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  },
);
it("falls back to grid with blocked storage and still lets the user switch", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  render(<Example />);
  expect(
    screen
      .getByRole("button", { name: "Grid view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "List view" }));
  expect(
    screen
      .getByRole("button", { name: "List view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
it("keeps different screens independent, including when the key changes", () => {
  localStorage.setItem("finder-view", '"list"');
  const app = render(<Example storageKey="browse-view" />);
  app.rerender(<Example storageKey="finder-view" />);
  expect(
    screen
      .getByRole("button", { name: "List view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  app.rerender(<Example storageKey="browse-view" />);
  expect(
    screen
      .getByRole("button", { name: "Grid view" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
