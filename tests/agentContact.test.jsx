// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AgentHeader from "../src/components/agent/AgentHeader";
import { agents } from "../src/lib/agents";

afterEach(cleanup);

it("shows a contact number on every sample agent profile", () => {
  for (const agent of agents) {
    const view = render(
      <AgentHeader agent={agent} count={1} onShare={() => {}} />,
    );
    expect(screen.getByText("Contact number")).toBeTruthy();
    expect(screen.getByText(agent.whatsapp)).toBeTruthy();
    view.unmount();
  }
});

it("keeps a sample contact number on this device", () => {
  const toast = vi.fn();
  window.addEventListener("centometer-toast", toast);
  render(<AgentHeader agent={agents[0]} count={1} onShare={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Contact number/ }));
  expect(toast.mock.calls[0][0].detail).toContain("98xxxxxx01");
  window.removeEventListener("centometer-toast", toast);
});
