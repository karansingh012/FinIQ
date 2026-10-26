import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "../pages/Auth";
import Assessment from "../pages/Assessment";
import { Protected } from "../components/Layout";
import { hi } from "../lib/translations";
const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  signIn: vi.fn(),
  notify: vi.fn(),
  setUser: vi.fn(),
  user: null,
}));
vi.mock("../lib/api", () => ({
  api: { post: mocks.post, get: mocks.get },
  errorMessage: (e) => e.message,
}));
vi.mock("../lib/context", () => ({
  useApp: () => ({
    t: (s) => s,
    lang: "en",
    signIn: mocks.signIn,
    notify: mocks.notify,
    setUser: mocks.setUser,
    ready: true,
    user: mocks.user,
  }),
  useApi: () => ({
    loading: false,
    error: null,
    data: {
      title: "Test assessment",
      questions: [
        {
          id: 1,
          prompt: "Where should emergency funds be?",
          topic: "Savings",
          options: [
            { id: 10, label: "Accessible" },
            { id: 11, label: "Locked away" },
          ],
        },
        {
          id: 2,
          prompt: "Should you share an OTP?",
          topic: "Safety",
          options: [
            { id: 20, label: "No" },
            { id: 21, label: "Yes" },
          ],
        },
      ],
    },
  }),
}));
function mount(component) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = null;
});
describe("authentication forms", () => {
  it("rejects blank login before contacting the backend", async () => {
    mount(<Auth />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findAllByText("Please complete this field."),
    ).toHaveLength(2);
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it("logs in only after a real successful API response", async () => {
    const data = { token: "test-token", user: { id: 1 } };
    mocks.post.mockResolvedValue({ data });
    mount(<Auth />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "example-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith(data));
    expect(mocks.post).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ email: "learner@example.test" }),
    );
  });
  it("shows API errors without pretending login succeeded", async () => {
    mocks.post.mockRejectedValue(new Error("Email or password is incorrect."));
    mount(<Auth />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("rejects mismatched registration passwords", async () => {
    mount(<Auth mode="register" />);
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
      target: { value: "long-enough-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByText("Passwords must match."),
    ).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
it("retains answers when navigating and sends IDs rather than a client score", async () => {
  mocks.post.mockResolvedValue({ data: { id: 99 } });
  mocks.get.mockResolvedValue({ data: { user: { id: 1 } } });
  mount(<Assessment />);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/Accessible/));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByLabelText(/No/));
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByLabelText(/Accessible/)).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
  await waitFor(() =>
    expect(mocks.post).toHaveBeenCalledWith("/assessments/1/submit", {
      answers: { 1: 10, 2: 20 },
    }),
  );
});
it("does not render protected administrative content for learners", () => {
  mocks.user = { role: "LEARNER" };
  mount(
    <Protected admin>
      <div>Secret administration</div>
    </Protected>,
  );
  expect(screen.queryByText("Secret administration")).not.toBeInTheDocument();
});
it("has Hindi navigation and essential form translations", () => {
  for (const key of [
    "Dashboard",
    "Government schemes",
    "Email",
    "Password",
    "Submit answers",
    "My progress",
    "Please complete this field.",
  ])
    expect(hi[key]).toMatch(/[\u0900-\u097f]/);
});
