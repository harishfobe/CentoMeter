// @vitest-environment jsdom
import React from "react";
import { it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import AgentFinder from "../src/pages/AgentFinder";
import CompareTable from "../src/components/agent/CompareTable";
import ListingDetailSheet from "../src/components/agent/ListingDetailSheet";
import BudgetChips from "../src/components/agent/BudgetChips";
import { agents, listings, defaults, filterLabel } from "../src/lib/agents";
const Modal = ({ title, children, onClose }) => (
  <section role="dialog" aria-label={title}>
    {children}
    <button onClick={onClose}>Close</button>
  </section>
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("provides buy and rent budget ranges with readable applied labels", () => {
  const change = vi.fn();
  const view = render(<BudgetChips f={defaults} onChange={change} />);
  fireEvent.click(screen.getByText("50 L to 1 Cr"));
  expect(change).toHaveBeenCalledWith({
    ...defaults,
    min: 5000000,
    max: 10000000,
    unit: "total",
  });
  view.rerender(
    <BudgetChips f={{ ...defaults, mode: "RENT" }} onChange={change} />,
  );
  expect(screen.getByText("₹15k to ₹30k / month")).toBeTruthy();
  expect(filterLabel("max", 10000000)).toBe("Under 1 Cr");
  expect(filterLabel("beds", "3")).toBe("3 BHK");
});
it("renders price, area, price per sq ft, possession and status side by side", () => {
  render(<CompareTable items={listings.slice(0, 2)} onClear={() => {}} />);
  for (const label of [
    "Price",
    "Area",
    "Price per sq ft",
    "Possession",
    "Status",
  ])
    expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getAllByRole("columnheader")).toHaveLength(3);
});
it("handles zero photos without a counter and presents labelled detail facts", () => {
  render(
    <ListingDetailSheet
      p={{
        ...listings[0],
        type: "PG",
        mode: "RENT",
        photos: [],
        propertyAge: 2,
        roadWidth: 20,
      }}
      agent={agents[0]}
      Modal={Modal}
      onClose={() => {}}
    />,
  );
  expect(screen.queryByText("1/0")).toBeNull();
  expect(screen.getByRole("img", { name: "No property photos" })).toBeTruthy();
  expect(screen.getByText("2 years")).toBeTruthy();
  expect(screen.getByText("20 ft")).toBeTruthy();
  expect(screen.queryByText("View photo full screen")).toBeNull();
});
it("buy commercial detail uses the income-building layout", () => {
  render(
    <ListingDetailSheet
      p={{
        ...listings[0],
        type: "Commercial",
        mode: "BUY",
        photos: [],
        title: "Income-generating Commercial Building",
        subtype: "Building",
        price: 28000000,
        area: 4000,
        builtUpArea: 4000,
        floorsLabel: "G+2",
        shopCount: 6,
        monthlyRent: 165000,
        carParking: "Available",
        roadAccess: "Main road",
        powerBackup: "Available",
        waterSupply: "Available",
        possessionStatus: "Ready to move",
        condition: "Resale",
        ownershipType: "Freehold",
        negotiable: true,
        facilities: ["Parking", "CCTV", "Power backup"],
        commercialHighlights: ["6 shops", "Rental income"],
        postedAt: "2024-11-06",
      }}
      agent={agents[0]}
      Modal={Modal}
      onClose={() => {}}
    />,
  );
  expect(screen.getByText("FOR SALE · COMMERCIAL · BUILDING")).toBeTruthy();
  expect(screen.getByText("₹2.8 Cr")).toBeTruthy();
  expect(
    document.querySelector(".commercial-income-badge")?.textContent,
  ).toMatch(/Monthly rental income/);
  expect(screen.getByRole("heading", { name: "Property details" })).toBeTruthy();
  expect(screen.getAllByText("Commercial Building").length).toBeGreaterThan(0);
  expect(screen.getAllByText("G+2").length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { name: "Highlights" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Facilities" })).toBeTruthy();
  expect(screen.getByText(/20% down payment/)).toBeTruthy();
});
it("buy apartment detail uses the gated-villa home layout", () => {
  render(
    <ListingDetailSheet
      p={{
        ...listings[0],
        type: "Apartment",
        mode: "BUY",
        photos: [],
        beds: 3,
        baths: 2,
        area: 1680,
        builtUpArea: 1680,
        carpetArea: 1344,
        balconies: 1,
        floor: 5,
        totalFloors: 12,
        facing: "North",
        furnishing: "Semi-furnished",
        propertyAge: 2,
        condition: "Resale",
        carParking: 1,
        possessionStatus: "Ready to move",
        ownershipType: "Freehold",
        maintenance: 2500,
        negotiable: true,
      }}
      agent={agents[0]}
      Modal={Modal}
      onClose={() => {}}
    />,
  );
  expect(screen.getByText("FOR SALE · APARTMENT")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Property details" })).toBeTruthy();
  expect(screen.getAllByText("Configuration").length).toBeGreaterThan(0);
  expect(screen.getAllByText("5 of 12").length).toBeGreaterThan(0);
  expect(screen.getByText("₹2,500 / month")).toBeTruthy();
  expect(screen.getByText("2 years")).toBeTruthy();
  expect(screen.getByText(/20% down payment/)).toBeTruthy();
});
it("finder uses geolocation and explains the fallback", async () => {
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 13.09, longitude: 80.28 } }),
    },
  });
  render(<AgentFinder Modal={Modal} onNavigate={() => {}} />);
  fireEvent.click(screen.getByText("Near me"));
  expect(screen.getByRole("status").textContent).toContain("Using Chennai");
  cleanup();
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition: (_success, error) => error() },
  });
  render(<AgentFinder Modal={Modal} onNavigate={() => {}} />);
  fireEvent.click(screen.getByText("Near me"));
  expect(screen.getByRole("status").textContent).toContain("Using Coimbatore");
});
it("finder resets defaults, hides empty suggestions, and labels segments with units", async () => {
  render(<AgentFinder Modal={Modal} onNavigate={() => {}} />);
  fireEvent.click(screen.getByText("Fastest reply"));
  fireEvent.change(screen.getByLabelText("Name, area or language"), {
    target: { value: "no-such-agent" },
  });
  await waitFor(() =>
    expect(screen.getByText("No matching agents")).toBeTruthy(),
  );
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.click(screen.getAllByText("Clear all")[0]);
  expect(screen.getByText("Sort: Best")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Filters, 0 active"));
  for (const text of ["1 hour", "4 hours", "1 day", "3+ yrs"])
    expect(screen.getByText(text)).toBeTruthy();
});
