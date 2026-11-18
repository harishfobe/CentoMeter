// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import AgentHeader from "../src/components/agent/AgentHeader";
import { agents } from "../src/lib/agents";

afterEach(cleanup);

it("puts Contact to the left of WhatsApp", () => {
  const view = render(
    <AgentHeader agent={agents[0]} count={1} onShare={() => {}} />,
  );
  const row = view.container.querySelector(".action-row");
  const labels = [...row.children].map((node) => node.textContent.trim());
  expect(labels[0]).toMatch(/Contact/);
  expect(labels[1]).toBe("WhatsApp");
  expect(screen.queryByText("Message on WhatsApp")).toBeNull();
});
