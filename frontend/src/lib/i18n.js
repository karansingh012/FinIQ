import { hi } from "./translations";
import ui from "./ui-hi.json";
import content from "./content-hi.json";
export const hindi = { ...hi, ...ui, ...content };
const english = Object.fromEntries(
  Object.entries(hindi).map(([en, value]) => [value, en]),
);
const normalize = (value) => value.replace(/\s+/g, " ").trim();
const normalized = Object.fromEntries(
  Object.entries(hindi).map(([en, value]) => [normalize(en), value]),
);
const numerals = (value) =>
  String(value).replace(/[0-9]/g, (n) => "०१२३४५६७८९"[n]);
const patterns = [
  [/^of (\d+) in the library$/, (n) => `पाठ सूची के ${n} में से`],
  [/^(\d+) knowledge checks completed$/, (n) => `${n} ज्ञान जाँच पूरी हुईं`],
  [/^Last (\d+) days$/, (n) => `पिछले ${n} दिन`],
  [/^Question (\d+)$/, (n) => `प्रश्न ${n}`],
  [/^Edit (\d+)$/, (n) => `संपादित करें ${n}`],
  [/^Delete (\d+)$/, (n) => `हटाएँ ${n}`],
  [/^record #(\d+)$/, (n) => `अभिलेख क्रमांक ${n}`],
  [
    /^Enter valid text for (.+)$/,
    (field) =>
      `${translate(field.replaceAll("_", " "), "hi")} के लिए सही पाठ लिखें`,
  ],
  [/^(.+) overview$/, (title) => `${translate(title, "hi")} का परिचय`],
  [
    /^Practical foundations in (.+)$/,
    (topic) =>
      `${translate(topic[0].toUpperCase() + topic.slice(1), "hi")} की व्यावहारिक बुनियाद`,
  ],
];
export function translate(value, lang = "en") {
  if (Array.isArray(value)) return value.map((item) => translate(item, lang));
  if (typeof value !== "string") return value;
  if (lang !== "hi") return english[value] || value;
  if (hindi[value]) return hindi[value];
  const clean = normalize(value);
  if (normalized[clean]) return normalized[clean];
  for (const [pattern, render] of patterns) {
    const match = clean.match(pattern);
    if (match) return numerals(render(...match.slice(1)));
  }
  // Translate composed source passages and titles without changing their stored values.
  if (value.includes("\n\n"))
    return value
      .split("\n\n")
      .map((part) => translate(part, lang))
      .join("\n\n");
  if (value.includes(" · "))
    return value
      .split(" · ")
      .map((part) => translate(part, lang))
      .join(" · ");
  if (!/[A-Za-z]/.test(value)) return value;
  return value; // Names, emails, URLs and user-authored text are preserved verbatim.
}
export const localeFor = (lang) =>
  lang === "hi" ? "hi-IN-u-nu-deva" : "en-IN";

// Convert known translated catalogue queries back to canonical search terms only.
// Stored selections, IDs, URLs and editable user data are never translated in place.
export function catalogueQuery(value) {
  if (english[value]) return english[value];
  const terms = {
    बजट: "budget",
    बैंकिंग: "banking",
    बचत: "saving",
    बीमा: "insurance",
    पेंशन: "pension",
    सेवानिवृत्ति: "retirement",
    कर: "tax",
    डिजिटल: "digital",
    सुरक्षा: "safety",
    धोखाधड़ी: "scam",
    योजना: "scheme",
    "लोक भविष्य निधि": "PPF",
    "राष्ट्रीय पेंशन प्रणाली": "NPS",
    सुकन्या: "Sukanya",
  };
  return Object.keys(terms)
    .sort((a, b) => b.length - a.length)
    .reduce((text, term) => text.replaceAll(term, terms[term]), value);
}
export const canonicalValue = (value) => english[value] || value;
