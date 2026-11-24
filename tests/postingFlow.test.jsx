// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
const io = vi.hoisted(() => ({
  restorePhotos: vi.fn(),
  persistDraft: vi.fn(),
  removeDraft: vi.fn(),
  hasPhotoRestoreFailure: vi.fn(() => false),
}));
vi.mock("../src/PhotoStorage", () => io);
vi.mock("../src/components/PostLocationMap", () => ({
  default: ({ onPick }) => (
    <button onClick={() => onPick([11.1179, 77.0369])}>
      Choose property pin
    </button>
  ),
}));
import PostFlow from "../src/PostFlow";
const base = {
  postingFlowVersion: 2,
  type: "Apartment",
  intent: "RENT",
  seller: "Owner",
  title: "Test home",
  description: "",
  price: "18000",
  area: "1200",
  areaUnit: "sq ft",
  beds: "2",
  photos: ["/apartment.jpg"],
  location: [11.1179, 77.0369],
  locality: "Kovilpalayam",
  city: "Coimbatore",
  shareDefault: { mode: "hidden", radiusM: 500 },
};
function seed(step, data = {}) {
  localStorage.setItem(
    "centometer-draft",
    JSON.stringify({ id: 1, step, data: { ...base, ...data } }),
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  io.restorePhotos.mockImplementation(async (record) => record);
  io.persistDraft.mockResolvedValue({ ok: true, photosSaved: true });
  io.removeDraft.mockResolvedValue(true);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("uses the login profile on review, retries a failed save and preserves owner sharing rules", async () => {
  seed(5, {
    brokerage: "4000",
    agentId: "old-agent",
    privacy: { mode: "hidden" },
  });
  const onComplete = vi
    .fn()
    .mockRejectedValueOnce(Error("Storage unavailable"))
    .mockResolvedValue(undefined);
  render(
    <PostFlow
      profile={{ name: "Login owner", phone: "9876543210" }}
      onExit={() => {}}
      onComplete={onComplete}
    />,
  );
  expect(screen.getByLabelText("Contact name").value).toBe("Login owner");
  expect(screen.getByLabelText("Phone number").value).toBe("9876543210");
  const save = await screen.findByRole("button", {
    name: "Save listing",
    exact: true,
  });
  await waitFor(() => expect(save.disabled).toBe(false));
  fireEvent.click(save);
  await screen.findByText("Storage unavailable");
  expect(io.removeDraft).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Save listing", exact: true }),
  );
  await screen.findByRole("heading", { name: "Your listing looks great." });
  expect(onComplete).toHaveBeenCalledTimes(2);
  const posted = onComplete.mock.calls[1][0];
  expect(posted).toMatchObject({
    contactName: "Login owner",
    contactPhone: "9876543210",
    shareDefault: { mode: "exact" },
    area: 1200,
  });
  for (const key of ["agentId", "privacy", "brokerage"])
    expect(posted).not.toHaveProperty(key);
});
it("shows brokerage only for agents and never renders native dropdowns", async () => {
  seed(1);
  const view = render(<PostFlow onExit={() => {}} onComplete={() => {}} />);
  expect(screen.queryByLabelText(/Brokerage/)).toBeNull();
  expect(view.container.querySelectorAll("select")).toHaveLength(0);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Basics", exact: true }).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Basics", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Agent", exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: "Continue", exact: true }),
  );
  expect(screen.getByLabelText(/Brokerage/)).toBeTruthy();
  expect(view.container.querySelectorAll("select")).toHaveLength(0);
});
it("agent-only privacy and pin lookup fill the actual returned village", async () => {
  seed(4, { seller: "Agent" });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          address: { village: "Pinned village", city: "Coimbatore" },
        }),
      }),
  );
  const view = render(<PostFlow onExit={() => {}} onComplete={() => {}} />);
  expect(
    screen.getByRole("heading", { name: "Location privacy" }),
  ).toBeTruthy();
  expect(screen.queryByLabelText("Latitude")).toBeNull();
  expect(screen.queryByLabelText("Longitude")).toBeNull();
  fireEvent.click(
    await screen.findByRole("button", { name: "Choose property pin" }),
  );
  expect(
    screen.getByRole("button", { name: "Review listing", exact: true })
      .disabled,
  ).toBe(true);
  await waitFor(
    () =>
      expect(screen.getByLabelText("Locality / village").value).toBe(
        "Pinned village",
      ),
    { timeout: 2500 },
  );
  expect(
    screen.getByRole("button", { name: "Review listing", exact: true })
      .disabled,
  ).toBe(false);
  view.unmount();
  seed(4);
  render(<PostFlow onExit={() => {}} onComplete={() => {}} />);
  expect(
    screen.queryByRole("heading", { name: "Location privacy" }),
  ).toBeNull();
  expect(
    screen.getByText(/exact property location will be visible/),
  ).toBeTruthy();
});
it("villa registration remains optional and bedrooms survive the new details step", async () => {
  seed(2, { type: "Villa", intent: "SELL", reraNumber: "" });
  render(<PostFlow onExit={() => {}} onComplete={() => {}} />);
  expect(screen.getByLabelText(/Bedrooms/).value).toBe("2");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue", exact: true }).disabled,
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Continue", exact: true }),
  );
  expect(
    screen.getByRole("heading", { name: "Help people picture the place" }),
  ).toBeTruthy();
});
