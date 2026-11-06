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
import PostFlow from "../src/PostFlow";
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  io.restorePhotos.mockResolvedValue({ photos: [] });
  io.persistDraft.mockResolvedValue({ ok: true, photosSaved: true });
  io.removeDraft.mockResolvedValue(true);
});
afterEach(() => cleanup());
it("releases draft loading after restore rejection and shows the failure", async () => {
  io.restorePhotos.mockRejectedValueOnce(Error("blocked"));
  render(<PostFlow city="Coimbatore" onExit={() => {}} onComplete={() => {}} />);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toMatch(
      /could not be restored/,
    ),
  );
  expect(
    screen.getByRole("button", { name: "Save draft & exit" }).disabled,
  ).toBe(false);
});
it("the back action saves a draft and stays in the editor if the write fails", async () => {
  io.persistDraft.mockRejectedValueOnce(Error("blocked"));
  const exit = vi.fn();
  render(<PostFlow city="Coimbatore" onExit={exit} onComplete={() => {}} />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Back to exploring" }).disabled,
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Fill with sample data" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Back to exploring" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toMatch(/before leaving/),
  );
  expect(exit).not.toHaveBeenCalled();
  expect(io.persistDraft).toHaveBeenCalled();
});
