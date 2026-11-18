// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PackagePricing from "../src/components/PackagePricing";

afterEach(cleanup);

it("lists sample packages and returns to the profile", () => {
  const onBack = vi.fn();
  render(<PackagePricing onBack={onBack} />);
  expect(
    screen.getByRole("heading", { name: "Package and Pricing" }),
  ).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Free" })).toBeTruthy();
  expect(screen.getByText("₹1,499")).toBeTruthy();
  expect(screen.getByText("₹4,999")).toBeTruthy();
  expect(screen.getByText(/Nothing is billed/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Back to profile" }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
