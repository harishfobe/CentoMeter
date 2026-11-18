// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LoginPage from "../src/components/LoginPage";

afterEach(cleanup);

it("asks for a valid email and password before signing in", () => {
  const onSignIn = vi.fn();
  render(<LoginPage onBack={vi.fn()} onSignIn={onSignIn} onContinue={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByRole("alert").textContent).toMatch(/valid email/i);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "harish@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "short" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByRole("alert").textContent).toMatch(/8 characters/i);
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "centometer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(onSignIn).toHaveBeenCalledWith({
    name: "Harish",
    email: "harish@example.com",
    phone: "",
  });
});

it("signs in with the sample account and can start a new profile", () => {
  const onSignIn = vi.fn();
  render(<LoginPage onBack={vi.fn()} onSignIn={onSignIn} onContinue={vi.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Continue with the sample account" }),
  );
  expect(onSignIn).toHaveBeenCalledWith({
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "",
  });
  fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
  expect(screen.getByRole("heading", { name: "Start with CentoMeter." })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Meera Nair" } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "meera@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "centometer" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "different" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByRole("alert").textContent).toMatch(/don’t match/i);
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "centometer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(onSignIn).toHaveBeenLastCalledWith({
    name: "Meera Nair",
    email: "meera@example.com",
    phone: "",
  });
});
