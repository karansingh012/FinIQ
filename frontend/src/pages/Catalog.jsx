import { catalogueQuery } from "../lib/i18n";
import React, { useState, useEffect } from "react";
import { useApp, useApi } from "../lib/context";
import {
  Heading,
  State,
  LessonCard,
  SchemeCard,
  Empty,
  Pager,
} from "../components/ui";
import { Search, SlidersHorizontal } from "lucide-react";
export default function Catalog({ schemes = false }) {
  const { t } = useApp();
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [region, setRegion] = useState(""),
    [beneficiary, setBeneficiary] = useState(""),
    [page, setPage] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(q);
      setPage(0);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);
  const params = new URLSearchParams({
    q: catalogueQuery(query),
    [schemes ? "category" : "topic"]: category,
    difficulty,
    region,
    beneficiary: catalogueQuery(beneficiary),
    page,
    size: 9,
  });
  const resource = useApi(`/${schemes ? "schemes" : "lessons"}?${params}`),
    topics = useApi(schemes ? "/schemes/filters" : "/topics");
  function filter(set, v) {
    set(v);
    setPage(0);
  }
  return (
    <div className="catalog-page">
      <Heading
        eyebrow={t(schemes ? "THE POLICY NAVIGATOR" : "YOUR LEARNING LIBRARY")}
        title={t(schemes ? "Government schemes" : "My learning")}
        description={t(
          schemes
            ? "Discover what is relevant. Understand what to verify. Connect with official information."
            : "Practical knowledge for everyday decisions. One short lesson at a time.",
        )}
      />
      {schemes && (
        <div className="info-banner">
          {t(
            "Sourced demonstration catalogue \xB7 FinIQ does not determine eligibility. Verify current rules with the official provider.",
          )}
        </div>
      )}
      <div className="filter-bar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label={t(schemes ? "Search schemes" : "Search lessons")}
            placeholder={t(schemes ? "Search schemes" : "Search lessons")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <SlidersHorizontal size={18} className="filter-icon" />
        <select
          aria-label={t(schemes ? "All categories" : "All topics")}
          value={category}
          onChange={(e) => filter(setCategory, e.target.value)}
        >
          <option value="">
            {t(schemes ? "All categories" : "All topics")}
          </option>
          {(schemes
            ? [
                ...new Set([
                  ...(topics.data?.categories || []),
                  "Pensions",
                  "Health insurance",
                  "Education",
                  "Savings",
                  "Women and child welfare",
                  "Subsidies",
                  "Agriculture",
                  "Taxation",
                  "Social welfare",
                ]),
              ]
            : (topics.data || []).map((v) => v.name)
          ).map((v) => (
            <option key={v} value={v}>
              {t(v)}
            </option>
          ))}
        </select>
        {schemes ? (
          <>
            <select
              aria-label={t("Region")}
              value={region}
              onChange={(e) => filter(setRegion, e.target.value)}
            >
              <option value="">{t("All regions")}</option>
              {(topics.data?.regions || []).map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
            <input
              aria-label={t("Beneficiary group")}
              placeholder={t("Beneficiary group")}
              value={beneficiary}
              onChange={(e) => filter(setBeneficiary, e.target.value)}
            />
          </>
        ) : (
          <select
            aria-label={t("All levels")}
            value={difficulty}
            onChange={(e) => filter(setDifficulty, e.target.value)}
          >
            <option value="">{t("All levels")}</option>
            {["Beginner", "Intermediate", "Advanced"].map((v) => (
              <option value={v} key={v}>
                {t(v)}
              </option>
            ))}
          </select>
        )}
      </div>
      <State resource={resource}>
        {(data) => (
          <>
            <div className="list-summary">
              {t(data.total)} {t(" ")}
              {t(
                schemes
                  ? "schemes to explore"
                  : "lessons to build your confidence",
              )}
              <span>{t("Made for everyday learning")}</span>
            </div>
            {data.items.length ? (
              <div className="grid-cards">
                {data.items.map((item) =>
                  schemes ? (
                    <SchemeCard key={item.id} scheme={item} />
                  ) : (
                    <LessonCard key={item.id} lesson={item} />
                  ),
                )}
              </div>
            ) : (
              <Empty />
            )}
            <Pager data={data} page={page} setPage={setPage} />
          </>
        )}
      </State>
    </div>
  );
}
