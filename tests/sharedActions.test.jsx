// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import ErrorBoundary from "../src/ErrorBoundary";
import CopyButton from "../src/components/CopyButton";
import WhatsAppLink from "../src/components/WhatsAppLink";
import AgentDashboard from "../src/pages/AgentDashboard";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("reports clipboard rejection and restores the enabled button", async () => {
  vi.stubGlobal("navigator", {
    clipboard: { writeText: vi.fn().mockRejectedValue(Error("denied")) },
  });
  const result = vi.fn();
  render(<CopyButton value="RERA-123" onResult={result} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  await waitFor(() => expect(result).toHaveBeenCalledWith(false));
  expect(screen.getByRole("button", { name: "Copy" }).disabled).toBe(false);
});
it("ignores clipboard completion after its target changed", async () => {
  let resolve;
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: () =>
        new Promise((r) => {
          resolve = r;
        }),
    },
  });
  const result = vi.fn();
  const view = render(<CopyButton value="old" onResult={result} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  view.rerender(<CopyButton value="new" onResult={result} />);
  await act(async () => resolve());
  expect(result).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Copy" }).disabled).toBe(false);
});
it("keeps intentional demo WhatsApp numbers local and visible to the user", () => {
  const toast = vi.fn();
  window.addEventListener("centometer-toast", toast);
  render(
    <WhatsAppLink number="98xxxxxx01" message="Hello">
      WhatsApp
    </WhatsAppLink>,
  );
  const allowed = fireEvent.click(
    screen.getByRole("link", { name: "WhatsApp" }),
  );
  expect(allowed).toBe(false);
  expect(toast.mock.calls[0][0].detail).toContain("98xxxxxx01");
  window.removeEventListener("centometer-toast", toast);
});
it("shows a usable manual-copy fallback in the dashboard", async () => {
  vi.stubGlobal("navigator", {
    clipboard: { writeText: vi.fn().mockRejectedValue(Error("blocked")) },
  });
  render(<AgentDashboard onNavigate={() => {}} onPost={() => {}} />);
  fireEvent.click(screen.getByRole("tab", { name: "Link & insights" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy my link" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("Copy failed."),
  );
  expect(screen.getByRole("status").textContent).toContain("#agent/ananya.rao");
});
it("the dashboard provides a back action", () => {
  const navigate = vi.fn();
  render(<AgentDashboard onNavigate={navigate} onPost={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Back to profile/ }));
  expect(navigate).toHaveBeenCalledWith("profile");
});

it("keeps ErrorBoundary recovery keyboard accessible through the shared empty state", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  history.replaceState(null, "", "#broken");
  function BrokenRoute() {
    if (location.hash !== "#home") throw Error("route failed");
    return <h1>Exploring</h1>;
  }
  render(
    <ErrorBoundary>
      <BrokenRoute />
    </ErrorBoundary>,
  );
  expect(screen.getByRole("alert")).toBeTruthy();
  const recover = screen.getByRole("button", { name: "Go home" });
  expect(recover.className).toBe("primary");
  fireEvent.click(recover);
  expect(screen.getByRole("heading", { name: "Exploring" })).toBeTruthy();
});
