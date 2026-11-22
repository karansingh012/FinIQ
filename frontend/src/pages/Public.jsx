import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Landmark,
  ShieldCheck,
  Target,
  ChartNoAxesCombined,
  Check,
  Languages,
} from "lucide-react";
import { useApp } from "../lib/context";
import { Badge, Heading } from "../components/ui";
export function Landing() {
  const { t } = useApp();
  return (
    <>
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            {t("FINANCIAL KNOWLEDGE. EVERYDAY CONFIDENCE.")}
          </div>
          <h1>
            {t("Your money.")}
            <br />
            {t("Your future.")}
            <br />
            <em>{t("A little clearer.")}</em>
          </h1>
          <p>
            {t(
              "Understand the everyday things that make a lifelong difference. Build financial confidence, explore government schemes, and learn at your own pace.",
            )}
          </p>
          <div className="hero-actions">
            <Link className="button" to="/register">
              {t("Start learning")} <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" to="/schemes">
              {t("Explore schemes")}
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Check size={16} />
              {t("Short, practical lessons")}
            </span>
            <span>
              <Languages size={16} />
              {t("English & Hindi")}
            </span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label={t("An illustrative learning journey")}
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="visual-tag">
            <span className="status-dot" />
            {t("A SMARTER START")}
          </div>
          <div className="illustration-card">
            <div className="flex justify-between items-center">
              <span className="icon-tile">
                <BookOpen />
              </span>
              <Badge>{t("YOUR LEARNING PATH")}</Badge>
            </div>
            <h2>
              {t("Small steps.")}
              <br />
              {t("Stronger foundations.")}
            </h2>
            <p>{t("From your first budget to your future plans.")}</p>
            <div className="path-step">
              <span>01</span>
              <div>
                <strong>{t("Know where you stand")}</strong>
                <small>{t("A short knowledge check")}</small>
              </div>
              <Check size={17} />
            </div>
            <div className="path-step active">
              <span>02</span>
              <div>
                <strong>{t("Make it make sense")}</strong>
                <small>{t("Lessons that meet you where you are")}</small>
              </div>
              <ArrowRight size={17} />
            </div>
            <div className="path-step">
              <span>03</span>
              <div>
                <strong>{t("Put knowledge into practice")}</strong>
                <small>{t("Build everyday confidence")}</small>
              </div>
            </div>
          </div>
          <div className="floating-card">
            <ShieldCheck size={24} />
            <span>
              <strong>{t("Clarity you can build on")}</strong>
              <small>{t("Official sources. Simple explanations.")}</small>
            </span>
          </div>
          <div className="visual-caption">
            {t("A preview of the FinIQ learning experience")}
          </div>
        </div>
      </section>
      <section className="principles-strip">
        <span>{t("BUILT AROUND REAL LIFE")}</span>
        {[
          "Banking & savings",
          "Budgeting & planning",
          "Insurance & pensions",
          "Digital safety",
        ].map((x) => (
          <div key={x}>
            <span className="small-diamond" />
            {t(x)}
          </div>
        ))}
      </section>
      <section className="public-section">
        <div className="section-title">
          <div className="eyebrow">
            {t("LESS OVERWHELM. MORE UNDERSTANDING.")}
          </div>
          <h2>
            {t("Everything connects.")}
            <br />
            {t("So should your learning.")}
          </h2>
          <p>
            {t(
              "One thoughtful space to understand financial concepts and find your way through policy information.",
            )}
          </p>
        </div>
        <div className="grid-cards">
          {[
            [
              BookOpen,
              "Learn the essentials",
              "Clear lessons, relatable examples and knowledge checks that turn complex ideas into useful understanding.",
              "/lessons",
            ],
            [
              Landmark,
              "Find your way through schemes",
              "Discover government programmes, understand what to verify and go directly to official information.",
              "/schemes",
            ],
            [
              Target,
              "Follow your own path",
              "Start with a knowledge check and get suggestions based on your learning, preferences and progress.",
              "/register",
            ],
          ].map(([Icon, title, text, url]) => (
            <Link to={url} className="feature-card" key={title}>
              <span className="icon-tile">
                <Icon />
              </span>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
              <ArrowUpRight size={21} />
            </Link>
          ))}
        </div>
      </section>
      <section className="how-section public-section">
        <div>
          <div className="eyebrow">{t("A PATH THAT STARTS WITH YOU")}</div>
          <h2>
            {t("Not sure where to begin?")}
            <br />
            {t("That\u2019s a good place to start.")}
          </h2>
          <p>
            {t(
              "You do not need a finance background. Just a little curiosity.",
            )}
          </p>
          <Link className="text-link" to="/register">
            {t("Find your starting point")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="how-steps">
          {[
            [
              "01",
              "Discover your starting point",
              "Answer a short assessment across everyday financial topics.",
            ],
            [
              "02",
              "Learn a little, regularly",
              "Get a suggested path. Explore the topics that matter to you.",
            ],
            [
              "03",
              "See yourself move forward",
              "Track completed lessons, review quiz results and build a habit.",
            ],
          ].map(([n, title, text]) => (
            <div key={n}>
              <span>{t(n)}</span>
              <section>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </section>
            </div>
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div className="eyebrow">{t("KNOWLEDGE FOR THE EVERYDAY")}</div>
          <h2>{t("Make sense of what matters.")}</h2>
        </div>
        <div className="topic-grid">
          {[
            "Your first budget",
            "Banking fundamentals",
            "Saving for the unexpected",
            "Insurance essentials",
            "Retirement planning",
            "Staying safe online",
          ].map((s, i) => (
            <Link key={s} to="/lessons">
              <span>0{t(i + 1)}</span>
              <strong>{t(s)}</strong>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="policy-banner">
        <div className="icon-tile">
          <Landmark size={30} />
        </div>
        <div>
          <div className="eyebrow">{t("THE POLICY NAVIGATOR")}</div>
          <h2>{t("A clearer route to official information.")}</h2>
          <p>
            {t(
              "Explore sourced demonstration records for PPF, NPS and more. Always confirm current conditions with the official provider.",
            )}
          </p>
        </div>
        <Link className="button secondary" to="/schemes">
          {t("Explore schemes")} <ArrowRight size={17} />
        </Link>
      </section>
      <section className="public-section faq">
        <div>
          <div className="eyebrow">{t("A FEW THINGS TO KNOW")}</div>
          <h2>
            {t("Good questions.")}
            <br />
            {t("Clear answers.")}
          </h2>
          <p>
            {t(
              "FinIQ is an academic project built for accessible learning. We do not claim measured social impact or publish invented learner statistics.",
            )}
          </p>
        </div>
        <div>
          {[
            [
              "Do I need to know about finance?",
              "No. Begin with everyday topics or take the knowledge check to find a useful starting point.",
            ],
            [
              "Does FinIQ decide my scheme eligibility?",
              "No. Scheme discovery is educational. Official providers determine eligibility using current rules and your circumstances.",
            ],
            [
              "How are lessons personalized?",
              "Transparent baseline rules use knowledge-check results, topic preferences and completed lessons. No trained-model accuracy is claimed.",
            ],
            [
              "Can I learn in Hindi?",
              "Pages, forms, lessons, quizzes and scheme summaries are available in Hindi. Check current rules at external official sources before applying.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{t(q)}</summary>
              <p>{t(a)}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="closing-cta">
        <div className="eyebrow">{t("YOUR NEXT STEP CAN BE A SMALL ONE")}</div>
        <h2>{t("Financial clarity, one lesson at a time.")}</h2>
        <Link className="button" to="/register">
          {t("Start learning")} <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function About() {
  const { t } = useApp();
  return (
    <div className="public-content">
      <Heading
        eyebrow={t("THE FINIQ MISSION")}
        title={t("Understanding opens possibilities.")}
        description={t(
          "Making financial & policy literacy accessible to everyone.",
        )}
      />
      <div className="article card">
        <h2>{t("Why FinIQ exists")}</h2>
        <p>
          {t(
            "Everyday financial decisions often come with unfamiliar words and scattered information. Government policy can be even harder to navigate. FinIQ brings practical learning, sourced scheme discovery and progress tracking into one accessible platform.",
          )}
        </p>
        <h2>{t("A learning journey that adapts")}</h2>
        <p>
          {t(
            "A short assessment identifies a starting point. Transparent recommendation rules suggest relevant lessons. Learners can review results, revisit difficult topics and build a consistent habit. English and Hindi interfaces support access without altering official policy details.",
          )}
        </p>
        <h2>{t("Built for learners and educators")}</h2>
        <p>
          {t(
            "Students, working professionals and citizens can learn independently. Authorized institutional administrators can understand participation within their own institution and use clearly labelled support indicators to offer help.",
          )}
        </p>
        <h2>{t("Honest about its limits")}</h2>
        <p>
          {t(
            "This academic project uses deterministic classification and engagement baselines because no reliable labelled training dataset was supplied. Policy search retrieves source passages. It does not impersonate an official authority or determine eligibility.",
          )}
        </p>
      </div>
    </div>
  );
}
export function Legal({ privacy = false }) {
  const { t } = useApp();
  return (
    <div className="public-content">
      <Heading title={t(privacy ? "Privacy notice" : "Terms of use")} />
      <div className="article card">
        {t(
          privacy ? (
            <>
              <h2>{t("Your learning data")}</h2>
              <p>
                {t(
                  "FinIQ stores your account details, profile preferences, assessment responses, lesson activity, saved resources and question history. Passwords are hashed. Optional income information is not required to learn and is not used to classify ability.",
                )}
              </p>
              <h2>{t("Who can access it")}</h2>
              <p>
                {t(
                  "You can access your own learning history. Platform administrators manage the service; institutional administrators receive analytics only for learners assigned to their institutions. Contact submissions are visible to platform administrators.",
                )}
              </p>
              <h2>{t("Browser storage")}</h2>
              <p>
                {t(
                  "Your access token is kept in session storage and expires after one hour. The selected interface language and theme are saved in local storage. Sign out to revoke your current tokens.",
                )}
              </p>
              <h2>{t("Data requests")}</h2>
              <p>
                {t(
                  "Use the contact form to request a correction or account-data deletion. An administrator must review and process that request. This project does not automatically verify identity documents; do not send them.",
                )}
              </p>
            </>
          ) : (
            <>
              <h2>{t("Educational purpose")}</h2>
              <p>
                {t(
                  "FinIQ provides financial education and policy discovery. It does not provide personalized financial, tax or legal advice, accept investments or guarantee scheme eligibility.",
                )}
              </p>
              <h2>{t("Verify official details")}</h2>
              <p>
                {t(
                  "Demonstration scheme records may omit or become outdated on important rules. Check the linked official source before applying or making a financial decision.",
                )}
              </p>
              <h2>{t("Responsible use")}</h2>
              <p>
                {t(
                  "Keep your credentials private. Do not submit another person\u2019s sensitive information. Administrators must use engagement indicators to offer support, not to make consequential decisions about individuals.",
                )}
              </p>
            </>
          ),
        )}
        <Link className="text-link" to="/contact">
          {t("Contact the project team")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
