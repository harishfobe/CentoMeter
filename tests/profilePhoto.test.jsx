// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ProfilePhoto from "../src/components/ProfilePhoto";

afterEach(cleanup);

it("offers a photo for a profile that has none", () => {
  const onPhoto = vi.fn();
  render(<ProfilePhoto name="Aarav Sharma" photo="" onPhoto={onPhoto} />);
  expect(screen.getByText("AS")).toBeTruthy();
  const input = screen.getByLabelText("Add photo");
  expect(input.getAttribute("accept")).toBe("image/*");
  const file = new File(["photo"], "face.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(onPhoto).toHaveBeenCalledWith(file);
  expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
});

it("shows the current photo and can clear it", () => {
  const onPhoto = vi.fn();
  render(
    <ProfilePhoto
      name="Ananya Rao"
      photo="data:image/gif;base64,R0lGODlhAQABAAAAACw="
      onPhoto={onPhoto}
    />,
  );
  expect(screen.getByLabelText("Change photo")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Profile photo" }).getAttribute("src")).toContain(
    "data:image",
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
  expect(onPhoto).toHaveBeenCalledWith(null);
});
