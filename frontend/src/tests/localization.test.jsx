import React from "react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "../lib/context";
import App from "../App";
import { translate, catalogueQuery, hindi } from "../lib/i18n";
import fixture from "./fixtures/catalogue.json";
import { api } from "../lib/api";
vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  errorMessage: (e) => e.message,
}));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: () => <div />,
  BarChart: () => <div />,
  Area: () => null,
  Bar: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));
const user = {
  id: 1,
  name: "सीमा",
  email: "learner@example.test",
  language: "en",
  role: "PLATFORM_ADMIN",
  knowledgeLevel: "Beginner",
  occupation: "Student",
  region: "All India",
  education: "Graduate",
};
const profile = { user, learning: { preferences: "Savings", weekly_goal: 3 } };
const metadata = {
  lessons: {
    create: true,
    fields: [
      "title",
      "description",
      "topic_id",
      "difficulty",
      "duration",
      "objectives",
      "content",
      "example",
      "takeaways",
      "source_url",
    ],
  },
};
const analytics = {
  scope: "All platform learners",
  learners: 1,
  activeLearners: 1,
  completions: 1,
  averageScore: 50,
  completionRate: 7.7,
  engagement: [],
  topics: [],
  regions: [{ name: "All India", learners: 1 }],
  occupations: [{ name: "Student", learners: 1 }],
  risks: [
    {
      user_id: 1,
      risk_score: 10,
      category: "Low",
      method: "engagement-heuristic-v1",
      created_at: "2026-11-22T00:00:00Z",
    },
  ],
};
function response(url) {
  const path = url.split("?")[0];
  if (path === "/me") return profile;
  if (path === "/admin/metadata") return metadata;
  if (path.startsWith("/admin/resources/"))
    return { items: [fixture["/lessons/1"]], total: 1, size: 20 };
  if (path.includes("/analytics")) return analytics;
  if (path === "/lessons") return fixture["/lessons?size=100"];
  if (path === "/schemes") return fixture["/schemes?size=100"];
  if (path === "/bookmarks")
    return {
      lessons: [fixture["/lessons/1"]],
      schemes: [fixture["/schemes/1"]],
    };
  if (path === "/search/history")
    return [
      {
        id: 1,
        question: "बचत",
        created_at: "2026-11-22T00:00:00Z",
        ...fixture["/search"],
      },
    ];
  return fixture[path] ?? {};
}
function mount(path, lang = "hi", theme = "dark", signedIn = true) {
  localStorage.setItem("finiq-language", lang);
  localStorage.setItem("finiq-theme", theme);
  if (signedIn) sessionStorage.setItem("finiq-token", "test-only");
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Provider>
        <App />
      </Provider>
    </MemoryRouter>,
  );
}
function assertHindi() {
  const text = document.body.textContent
    .replaceAll("FinIQ", "")
    .replaceAll("learner@example.test", "")
    .replace(/https:\/\/[^\s]+/g, "");
  const labels = [
    ...document.querySelectorAll("[aria-label],[placeholder],[title]"),
  ]
    .flatMap((e) =>
      ["aria-label", "placeholder", "title"].map(
        (a) => e.getAttribute(a) || "",
      ),
    )
    .join(" ")
    .replaceAll("FinIQ", "")
    .replace(/https:\/\/[^\s]+/g, "");
  expect(text.match(/[a-zA-Z][a-zA-Z _’-]*/g) || []).toEqual([]);
  expect(labels.match(/[a-zA-Z][a-zA-Z _’-]*/g) || []).toEqual([]);
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  api.get.mockImplementation(async (url) => ({ data: response(url) }));
  api.post.mockResolvedValue({ data: {} });
  api.put.mockImplementation(async () => ({ data: profile }));
});
afterEach(cleanup);
describe("Hindi coverage across the existing experience", () => {
  const routes = [
    "/",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
    "/register",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/lessons",
    "/schemes",
    "/dashboard",
    "/learn",
    "/explore",
    "/assessment",
    "/results/1",
    "/progress",
    "/saved",
    "/ask",
    "/settings",
    "/admin",
    "/institution",
    "/missing-page",
    ...Array.from({ length: 13 }, (_, i) => `/lessons/${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `/schemes/${i + 1}`),
  ];
  for (const path of routes)
    for (const theme of ["light", "dark"])
      it(`${path} in Hindi / ${theme}`, async () => {
        mount(path, "hi", theme);
        await waitFor(() => expect(api.get).toHaveBeenCalledWith("/me"));
        await waitFor(() =>
          expect(document.querySelector(".skeleton-group")).toBeNull(),
        );
        await waitFor(() => assertHindi());
        expect(document.documentElement.dataset.theme).toBe(theme);
      });
  for (const path of routes)
    for (const theme of ["light", "dark"])
      it(`${path} switches back to English / ${theme}`, async () => {
        mount(path, "hi", theme);
        await waitFor(() =>
          expect(document.querySelector(".skeleton-group")).toBeNull(),
        );
        await waitFor(() =>
          expect(
            document.querySelector(".app-shell") ||
              document.querySelector(".public-header") ||
              document.querySelector(".empty"),
          ).not.toBeNull(),
        );
        fireEvent.change(
          screen.getByRole("combobox", { name: "भाषा", exact: true }),
          { target: { value: "en" } },
        );
        await waitFor(() => expect(document.documentElement.lang).toBe("en"));
        const text = document.body.textContent
          .replaceAll("सीमा", "").replaceAll("स", "")
          .replaceAll("बचत", "");
        expect(text.match(/[\u0900-\u097f]+/g) || []).toEqual([]);
        expect(document.documentElement.dataset.theme).toBe(theme);
      });
  it("translates every quiz prompt, answer, explanation and seeded content field", () => {
    const keys = [
      "title",
      "description",
      "content",
      "objectives",
      "example",
      "takeaways",
      "prompt",
      "label",
      "explanation",
      "summary",
      "eligibility",
      "benefits",
      "documents",
      "procedure",
      "faq",
      "topic",
      "category",
      "beneficiaries",
      "verification",
      "reason",
      "method",
    ];
    let missing = [];
    function walk(v) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        Object.entries(v).forEach(([k, val]) => {
          if (
            typeof val === "string" &&
            keys.includes(k) &&
            /[A-Za-z]/.test(translate(val, "hi").replaceAll("FinIQ", ""))
          )
            missing.push(val);
          else if (typeof val === "object") walk(val);
        });
    }
    walk(fixture);
    expect([...new Set(missing)]).toEqual([]);
  });
  it("switches language and theme independently without losing form data or reloading", async () => {
    mount("/contact", "en", "light", false);
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "सीमा" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findAllByRole("alert");
    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "hi" },
    });
    assertHindi();
    expect(screen.getByLabelText("पूरा नाम").value).toBe("सीमा");
    fireEvent.click(
      screen.getByRole("button", { name: "गहरा रंग-रूप अपनाएँ" }),
    );
    expect(localStorage.getItem("finiq-theme")).toBe("dark");
    fireEvent.change(screen.getByRole("combobox", { name: "भाषा" }), {
      target: { value: "en" },
    });
    expect(
      screen.getAllByText("Please complete this field.").length,
    ).toBeGreaterThan(0);
    expect(document.documentElement.dataset.theme).toBe("dark");
    cleanup();
    mount("/about", "en", localStorage.getItem("finiq-theme"), false);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
  it("preserves canonical filter values and translates Hindi searches", async () => {
    mount("/schemes");
    await screen.findByRole("option", { name: "बचत" });
    expect(screen.getByRole("option", { name: "बचत" }).value).toBe("Savings");
    expect(catalogueQuery("बचत")).toBe("Savings");
    fireEvent.change(screen.getByRole("combobox", { name: "सभी श्रेणियाँ" }), {
      target: { value: "Savings" },
    });
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("category=Savings"),
      ),
    );
  });
  it("translates admin edit and removal dialogs", async () => {
    mount("/admin");
    await screen.findByRole("button", { name: "संपादित करें १" });
    fireEvent.click(screen.getByRole("button", { name: "संपादित करें १" }));
    await screen.findByRole("button", { name: "बदलाव सहेजें" });
    assertHindi();
    expect(screen.getByLabelText("शीर्षक").value).toBe(
      "आपके लिए सही बजट बनाएँ",
    );
    fireEvent.click(screen.getByRole("button", { name: "बदलाव सहेजें" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        "/admin/resources/lessons/1",
        expect.objectContaining({ title: "Build a budget that works for you" }),
      ),
    );
  });
});
