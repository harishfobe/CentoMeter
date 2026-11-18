// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PropertyCard from "../src/components/PropertyCard";

const plot = {
  id: "plot-1",
  type: "Land",
  mode: "BUY",
  title: "Kovai Plot 3",
  locality: "Saibaba Colony",
  city: "Coimbatore",
  landType: "Residential",
  price: 7549250,
  area: 2460,
  width: 40,
  length: 62,
  facing: "South-East",
  roadWidth: "20 ft",
  approvals: ["DTCP"],
  features: ["DTCP Approved"],
  seller: "Owner",
  postedAt: "2026-10-20",
  photos: ["/land.jpg"],
  image: "land",
  tag: "Corner plot",
};

afterEach(cleanup);

it("shows a land listing as a plot card and keeps the open name", () => {
  render(
    <PropertyCard p={plot} saved={false} onSave={vi.fn()} onOpen={vi.fn()} />,
  );
  expect(
    screen.getByRole("heading", { name: "Saibaba Colony • Residential plot" }),
  ).toBeTruthy();
  expect(screen.getByText("₹75.5L")).toBeTruthy();
  expect(screen.getByText("₹13.4L/cent")).toBeTruthy();
  expect(screen.getByText(/cents • 2,460 sq ft/)).toBeTruthy();
  expect(screen.getByText("40 × 62 ft • South-East • 20 ft road")).toBeTruthy();
  expect(screen.getByText("DTCP claimed by seller")).toBeTruthy();
  expect(screen.getByText(/^Owner • Updated /)).toBeTruthy();
  expect(screen.queryByText("Corner plot")).toBeNull();
  expect(
    screen.getByRole("button", { name: "View Kovai Plot 3" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Save Kovai Plot 3" }),
  ).toBeTruthy();
});

it("says approval evidence is pending when the seller has not claimed one", () => {
  render(
    <PropertyCard
      p={{ ...plot, approvals: [], features: ["Road access"] }}
      saved={false}
      onSave={vi.fn()}
      onOpen={vi.fn()}
    />,
  );
  expect(screen.getByText("Approval evidence pending")).toBeTruthy();
  expect(screen.queryByText(/DTCP/)).toBeNull();
});
