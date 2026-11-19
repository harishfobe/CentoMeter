// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import App from "../src/App";

afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState(null, "", "#home");
});

function media() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

it("starts signed out and sends the profile route to login", async () => {
  media();
  localStorage.clear();
  history.replaceState(null, "", "#profile");
  render(<App />);
  await act(async () => {});
  expect(location.hash).toBe("#login");
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Terms of use" })).toBeTruthy();
});

it("opens the privacy policy without an account", async () => {
  media();
  localStorage.clear();
  history.replaceState(null, "", "#privacy");
  render(<App />);
  await act(async () => {});
  expect(
    screen.getByRole("heading", { name: "Privacy Policy", level: 1 }),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Page not found" })).toBeNull();
});
