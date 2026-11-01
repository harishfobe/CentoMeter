// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import AgentProfile from "../src/pages/AgentProfile";
import AgentDashboard from "../src/pages/AgentDashboard";
import { AgentRequests } from "../src/components/agent/AgentActivity";
import ListingDetailSheet from "../src/components/agent/ListingDetailSheet";
import { Modal } from "../src/App";
import { agents, listings } from "../src/lib/agents";
import { snapshot, updateStore, recordEvent } from "../src/lib/agentStore";
const agent = agents[0];
const property = listings.find(
  (p) => p.agentId === agent.id && p.mode === "BUY" && p.status === "available",
);
const route = "agent/" + agent.handle + "?mode=BUY";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup() {
  history.replaceState({ sentinel: 42 }, "", "/#" + route);
  window.scrollTo = vi.fn();
  render(
    <AgentProfile
      route={route}
      onNavigate={() => {}}
      Modal={Modal}
      Detail={ListingDetailSheet}
    />,
  );
}
it("replaces profile filters without scrolling or dispatching hash changes", async () => {
  setup();
  const hash = vi.fn();
  window.addEventListener("hashchange", hash);
  fireEvent.change(screen.getByLabelText("Sort listings"), {
    target: { value: "low" },
  });
  await waitFor(() => expect(location.hash).toContain("sort=low"));
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(hash).not.toHaveBeenCalled();
  expect(history.state.sentinel).toBe(42);
  window.removeEventListener("hashchange", hash);
});
for (const method of ["X", "Escape", "Back"])
  it(
    "closes a listing with " +
      method +
      " using one history entry and preserves scroll",
    async () => {
      setup();
      const before = location.hash;
      Object.defineProperty(window, "scrollY", {
        value: 640,
        configurable: true,
      });
      fireEvent.click(screen.getByText(property.title).closest("button"));
      await screen.findByRole("dialog", { name: property.title });
      expect(location.hash).toContain("l=" + property.id);
      const back = vi.spyOn(history, "back");
      if (method === "X")
        fireEvent.click(screen.getByLabelText("Close dialog"));
      else if (method === "Escape")
        fireEvent.keyDown(document, { key: "Escape" });
      else act(() => history.back());
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(back).toHaveBeenCalledTimes(1);
      expect(location.hash).toBe(before);
      expect(history.state.sentinel).toBe(42);
      expect(window.scrollY).toBe(640);
      expect(window.scrollTo).not.toHaveBeenCalled();
    },
  );
it("submits a validated visit, delivers it to dashboard, and shows the decision in Activity", async () => {
  history.replaceState({}, "", "/#agent/" + agent.handle);
  const toast = vi.fn();
  window.addEventListener("centometer-toast", toast);
  const view = render(
    <ListingDetailSheet
      p={property}
      agent={agent}
      Modal={Modal}
      onClose={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("Site visit"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Test buyer" },
  });
  fireEvent.change(screen.getByLabelText("Indian mobile"), {
    target: { value: "+91 90000 00000" },
  });
  fireEvent.click(screen.getByText("Save visit request"));
  expect(snapshot().visits[0].buyer.phone).toBe("9000000000");
  expect(toast).toHaveBeenCalled();
  view.unmount();
  render(<AgentDashboard onNavigate={() => {}} onPost={() => {}} />);
  expect(screen.getByText(/Site visit ·/)).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Requests (1)" })).toBeTruthy();
  fireEvent.click(screen.getByText("Accept"));
  cleanup();
  render(<AgentRequests onNavigate={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("accepted");
  window.removeEventListener("centometer-toast", toast);
});
it("counts a view once per agent session and renders custom listings immediately", () => {
  updateStore((s) => ({ ...s, events: [] }));
  recordEvent("views", "unique-test");
  recordEvent("views", "unique-test");
  expect(
    snapshot().events.filter((e) => e.agentId === "unique-test"),
  ).toHaveLength(1);
  setup();
  act(() =>
    updateStore((s) => ({
      ...s,
      customListings: [
        { ...property, id: "custom-test", title: "New custom home" },
      ],
    })),
  );
  expect(screen.getByText("New custom home")).toBeTruthy();
});
