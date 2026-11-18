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
    screen.getByRole("heading", { name: "Saibaba Colony · Residential plot" }),
  ).toBeTruthy();
  expect(screen.getByText("₹75.5L")).toBeTruthy();
  expect(screen.getByText("₹13.4L/cent")).toBeTruthy();
  expect(screen.getByText(/cents · 2,460 sq ft/)).toBeTruthy();
  expect(screen.getByText("40 × 62 ft · South-East")).toBeTruthy();
  expect(screen.getByText("20 ft road")).toBeTruthy();
  expect(screen.queryByText("DTCP claimed by seller")).toBeNull();
  expect(screen.queryByText("Approval evidence pending")).toBeNull();
  expect(screen.getByText(/^Owner · Updated /)).toBeTruthy();
  expect(screen.queryByText("Corner plot")).toBeNull();
  expect(
    screen.getByRole("button", { name: "View Kovai Plot 3" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Save Kovai Plot 3" }),
  ).toBeTruthy();
});

it("uses the same short row for an apartment", () => {
  render(
    <PropertyCard
      p={{
        id: "home",
        type: "Apartment",
        mode: "BUY",
        title: "Kovai Palm Residences",
        locality: "RS Puram",
        beds: 3,
        baths: 2,
        price: 10880000,
        builtUpArea: 1680,
        area: 1680,
        seller: "Owner",
        tag: "New arrival",
        image: "apartment",
      }}
      saved={false}
      onSave={vi.fn()}
      onOpen={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "RS Puram · 3 BHK Apartment" }),
  ).toBeTruthy();
  expect(screen.getByText("₹1.09Cr")).toBeTruthy();
  expect(screen.getByText("₹6,476/sq ft")).toBeTruthy();
  expect(screen.getByText("1,680 sq ft built-up · 2 baths")).toBeTruthy();
  expect(screen.queryByText("New arrival")).toBeNull();
  expect(
    screen.getByRole("button", { name: "View Kovai Palm Residences" }),
  ).toBeTruthy();
});

it("leaves approval claims off the plot card", () => {
  render(
    <PropertyCard
      p={{ ...plot, approvals: [], features: ["Road access"] }}
      saved={false}
      onSave={vi.fn()}
      onOpen={vi.fn()}
    />,
  );
  expect(screen.queryByText("Approval evidence pending")).toBeNull();
  expect(screen.queryByText(/DTCP/)).toBeNull();
});
