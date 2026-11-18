// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LoginPage from "../src/components/LoginPage";

afterEach(cleanup);

it("asks for a valid email and password before logging in", () => {
  const onSignIn = vi.fn();
  render(<LoginPage onSignIn={onSignIn} />);
  expect(screen.getByRole("img", { name: "CentoMeter" }).getAttribute("src")).toBe(
    "/centometer-login-logo.jpg",
  );
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(screen.getByRole("alert").textContent).toMatch(/valid email/i);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "harish@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "short" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(screen.getByRole("alert").textContent).toMatch(/8 characters/i);
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "centometer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(onSignIn).toHaveBeenCalledWith({
    name: "Harish",
    email: "harish@example.com",
    phone: "",
    role: "user",
  });
});

it("can log in as an agent", () => {
  const onSignIn = vi.fn();
  render(<LoginPage onSignIn={onSignIn} />);
  fireEvent.click(screen.getByRole("tab", { name: "Agent" }));
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "agent@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "centometer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(onSignIn).toHaveBeenCalledWith({
    name: "Agent",
    email: "agent@example.com",
    phone: "",
    role: "agent",
  });
});

it("keeps Google sign-in offline and can create a profile", () => {
  const onSignIn = vi.fn();
  render(<LoginPage onSignIn={onSignIn} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  expect(screen.getByText(/isn’t connected/i)).toBeTruthy();
  expect(onSignIn).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
  expect(screen.getByRole("heading", { name: "Sign up" })).toBeTruthy();
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
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
  expect(screen.getByRole("alert").textContent).toMatch(/don’t match/i);
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "centometer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
  expect(onSignIn).toHaveBeenLastCalledWith({
    name: "Meera Nair",
    email: "meera@example.com",
    phone: "",
    role: "user",
  });
});
