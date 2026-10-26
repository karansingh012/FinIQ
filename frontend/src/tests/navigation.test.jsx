import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
vi.mock("../lib/context", () => ({
  useApp: () => ({
    t: (s) => s,
    user: null,
    ready: true,
    lang: "en",
    language: vi.fn(),
  }),
}));
it("navigates without returning the browser scroll promise as an effect cleanup", () => {
  const scroll = vi
    .spyOn(window, "scrollTo")
    .mockReturnValue(Promise.resolve());
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getAllByRole("link", { name: "About", exact: true })[0],
  );
  expect(
    screen.getByRole("heading", { name: "Understanding opens possibilities." }),
  ).toBeInTheDocument();
  scroll.mockRestore();
});
