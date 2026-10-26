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
            <span className="status-dot" /> FINANCIAL KNOWLEDGE. EVERYDAY
            CONFIDENCE.
          </div>
          <h1>
            Your money.
            <br />
            Your future.
            <br />
            <em>A little clearer.</em>
          </h1>
          <p>
            Understand the everyday things that make a lifelong difference.
            Build financial confidence, explore government schemes, and learn at
            your own pace.
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
              <Check size={16} /> Short, practical lessons
            </span>
            <span>
              <Languages size={16} /> English & हिन्दी
            </span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="An illustrative learning journey"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="visual-tag">
            <span className="status-dot" /> A SMARTER START
          </div>
          <div className="illustration-card">
            <div className="flex justify-between items-center">
              <span className="icon-tile">
                <BookOpen />
              </span>
              <Badge>YOUR LEARNING PATH</Badge>
            </div>
            <h2>
              Small steps.
              <br />
              Stronger foundations.
            </h2>
            <p>From your first budget to your future plans.</p>
            <div className="path-step">
              <span>01</span>
              <div>
                <strong>Know where you stand</strong>
                <small>A short knowledge check</small>
              </div>
              <Check size={17} />
            </div>
            <div className="path-step active">
              <span>02</span>
              <div>
                <strong>Make it make sense</strong>
                <small>Lessons that meet you where you are</small>
              </div>
              <ArrowRight size={17} />
            </div>
            <div className="path-step">
              <span>03</span>
              <div>
                <strong>Put knowledge into practice</strong>
                <small>Build everyday confidence</small>
              </div>
            </div>
          </div>
          <div className="floating-card">
            <ShieldCheck size={24} />
            <span>
              <strong>Clarity you can build on</strong>
              <small>Official sources. Simple explanations.</small>
            </span>
          </div>
          <div className="visual-caption">
            A preview of the FinIQ learning experience
          </div>
        </div>
      </section>
      <section className="principles-strip">
        <span>BUILT AROUND REAL LIFE</span>
        {[
          "Banking & savings",
          "Budgeting & planning",
          "Insurance & pensions",
          "Digital safety",
        ].map((x) => (
          <div key={x}>
            <span className="small-diamond" />
            {x}
          </div>
        ))}
      </section>
      <section className="public-section">
        <div className="section-title">
          <div className="eyebrow">LESS OVERWHELM. MORE UNDERSTANDING.</div>
          <h2>
            Everything connects.
            <br />
            So should your learning.
          </h2>
          <p>
            One thoughtful space to understand financial concepts and find your
            way through policy information.
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
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight size={21} />
            </Link>
          ))}
        </div>
      </section>
      <section className="how-section public-section">
        <div>
          <div className="eyebrow">A PATH THAT STARTS WITH YOU</div>
          <h2>
            Not sure where to begin?
            <br />
            That’s a good place to start.
          </h2>
          <p>You do not need a finance background. Just a little curiosity.</p>
          <Link className="text-link" to="/register">
            Find your starting point <ArrowRight size={17} />
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
              <span>{n}</span>
              <section>
                <h3>{title}</h3>
                <p>{text}</p>
              </section>
            </div>
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div className="eyebrow">KNOWLEDGE FOR THE EVERYDAY</div>
          <h2>Make sense of what matters.</h2>
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
              <span>0{i + 1}</span>
              <strong>{s}</strong>
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
          <div className="eyebrow">THE POLICY NAVIGATOR</div>
          <h2>A clearer route to official information.</h2>
          <p>
            Explore sourced demonstration records for PPF, NPS and more. Always
            confirm current conditions with the official provider.
          </p>
        </div>
        <Link className="button secondary" to="/schemes">
          {t("Explore schemes")} <ArrowRight size={17} />
        </Link>
      </section>
      <section className="public-section faq">
        <div>
          <div className="eyebrow">A FEW THINGS TO KNOW</div>
          <h2>
            Good questions.
            <br />
            Clear answers.
          </h2>
          <p>
            FinIQ is an academic project built for accessible learning. We do
            not claim measured social impact or publish invented learner
            statistics.
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
              "Navigation, forms and core dashboard controls support Hindi. Source material remains in its original language to preserve policy meaning.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="closing-cta">
        <div className="eyebrow">YOUR NEXT STEP CAN BE A SMALL ONE</div>
        <h2>{t("Financial clarity, one lesson at a time.")}</h2>
        <Link className="button" to="/register">
          {t("Start learning")} <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function About() {
  return (
    <div className="public-content">
      <Heading
        eyebrow="THE FINIQ MISSION"
        title="Understanding opens possibilities."
        description="Making financial & policy literacy accessible to everyone."
      />
      <div className="article card">
        <h2>Why FinIQ exists</h2>
        <p>
          Everyday financial decisions often come with unfamiliar words and
          scattered information. Government policy can be even harder to
          navigate. FinIQ brings practical learning, sourced scheme discovery
          and progress tracking into one accessible platform.
        </p>
        <h2>A learning journey that adapts</h2>
        <p>
          A short assessment identifies a starting point. Transparent
          recommendation rules suggest relevant lessons. Learners can review
          results, revisit difficult topics and build a consistent habit.
          English and Hindi interfaces support access without altering official
          policy details.
        </p>
        <h2>Built for learners and educators</h2>
        <p>
          Students, working professionals and citizens can learn independently.
          Authorized institutional administrators can understand participation
          within their own institution and use clearly labelled support
          indicators to offer help.
        </p>
        <h2>Honest about its limits</h2>
        <p>
          This academic project uses deterministic classification and engagement
          baselines because no reliable labelled training dataset was supplied.
          Policy search retrieves source passages. It does not impersonate an
          official authority or determine eligibility.
        </p>
      </div>
    </div>
  );
}
export function Legal({ privacy = false }) {
  return (
    <div className="public-content">
      <Heading title={privacy ? "Privacy notice" : "Terms of use"} />
      <div className="article card">
        {privacy ? (
          <>
            <h2>Your learning data</h2>
            <p>
              FinIQ stores your account details, profile preferences, assessment
              responses, lesson activity, saved resources and question history.
              Passwords are hashed. Optional income information is not required
              to learn and is not used to classify ability.
            </p>
            <h2>Who can access it</h2>
            <p>
              You can access your own learning history. Platform administrators
              manage the service; institutional administrators receive analytics
              only for learners assigned to their institutions. Contact
              submissions are visible to platform administrators.
            </p>
            <h2>Browser storage</h2>
            <p>
              Your access token is kept in session storage and expires after one
              hour. The selected interface language is saved in local storage.
              Sign out to revoke your current tokens.
            </p>
            <h2>Data requests</h2>
            <p>
              Use the contact form to request a correction or account-data
              deletion. An administrator must review and process that request.
              This project does not automatically verify identity documents; do
              not send them.
            </p>
          </>
        ) : (
          <>
            <h2>Educational purpose</h2>
            <p>
              FinIQ provides financial education and policy discovery. It does
              not provide personalized financial, tax or legal advice, accept
              investments or guarantee scheme eligibility.
            </p>
            <h2>Verify official details</h2>
            <p>
              Demonstration scheme records may omit or become outdated on
              important rules. Check the linked official source before applying
              or making a financial decision.
            </p>
            <h2>Responsible use</h2>
            <p>
              Keep your credentials private. Do not submit another person’s
              sensitive information. Administrators must use engagement
              indicators to offer support, not to make consequential decisions
              about individuals.
            </p>
          </>
        )}
        <Link className="text-link" to="/contact">
          Contact the project team <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
