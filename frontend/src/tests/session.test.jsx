import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider, useApp } from "../lib/context";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  errorMessage: () => "Request failed",
}));

function Session() {
  const { user, ready, signOut } = useApp();
  return <><span>{ready ? user?.name || "Signed out" : "Loading"}</span><button onClick={signOut}>Sign out</button></>;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("finiq-token", "expired-test-token");
  api.get.mockResolvedValue({ data: { user: { name: "Test learner", language: "en" } } });
});

it("clears local authentication when logout reports an expired token", async () => {
  api.post.mockRejectedValue({ response: { status: 401 } });
  render(<Provider><Session /></Provider>);
  await screen.findByText("Test learner");
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByText("Signed out");
  expect(sessionStorage.getItem("finiq-token")).toBeNull();
});

it("does not claim server logout succeeded during a network failure", async () => {
  api.post.mockRejectedValue(new Error("Offline"));
  render(<Provider><Session /></Provider>);
  await screen.findByText("Test learner");
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/auth/logout"));
  expect(screen.getByText("Test learner")).toBeInTheDocument();
  expect(sessionStorage.getItem("finiq-token")).toBe("expired-test-token");
});
