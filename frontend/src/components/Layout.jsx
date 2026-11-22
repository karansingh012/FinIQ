import React, { useState } from "react";
import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Landmark,
  MessageSquare,
  ChartNoAxesCombined,
  Bookmark,
  Settings,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  ShieldCheck,
  Users,
  X,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useApp } from "../lib/context";
import { Logo } from "./ui";
export function Language() {
  const { lang, language, t, theme, setTheme } = useApp();
  return (
    <div className="display-controls">
      <button
        type="button"
        className="icon-button theme-toggle"
        aria-label={t(
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        )}
        title={t(
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        )}
        aria-pressed={theme === "dark"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <label className="language">
        <Globe size={16} />
        <select
          aria-label={t("Language")}
          value={lang}
          onChange={(e) => language(e.target.value)}
        >
          <option value="en">{t("English")}</option>
          <option value="hi">{t("Hindi")}</option>
        </select>
      </label>
    </div>
  );
}
export function PublicLayout() {
  const { t, user } = useApp();
  return (
    <>
      <header className="public-header">
        <Logo />
        <nav>
          <Link to="/lessons">{t("My learning")}</Link>
          <Link to="/schemes">{t("Government schemes")}</Link>
          <Link to="/about">{t("About")}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Language />
          <Link className="button small" to={user ? "/dashboard" : "/login"}>
            {t(user ? "Dashboard" : "Sign in")}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <div>
          <Logo />
          <p>
            {t("Making financial & policy literacy")}
            <br />
            {t("accessible to everyone.")}
          </p>
        </div>
        <div>
          <h4>{t("Explore")}</h4>
          <Link to="/lessons">{t("My learning")}</Link>
          <Link to="/schemes">{t("Government schemes")}</Link>
          <Link to="/about">{t("About")}</Link>
        </div>
        <div>
          <h4>{t("Support")}</h4>
          <Link to="/contact">{t("Contact")}</Link>
          <Link to="/privacy">{t("Privacy")}</Link>
          <Link to="/terms">{t("Terms")}</Link>
        </div>
        <div className="footer-note">
          {t("An academic financial education project.")}
          <br />
          {t("Learn thoughtfully. Verify with official sources.")}
          <br />
          <span>© {t(new Date().getFullYear())} FinIQ</span>
        </div>
      </footer>
    </>
  );
}
export function Protected({ admin = false, institution = false, children }) {
  const { ready, user, t } = useApp();
  const location = useLocation();
  if (!ready) return <div className="empty">{t("Loading\u2026")}</div>;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  if (
    (admin && user.role !== "PLATFORM_ADMIN") ||
    (institution &&
      !["PLATFORM_ADMIN", "INSTITUTION_ADMIN"].includes(user.role))
  )
    return <Navigate to="/dashboard" replace />;
  return children || <Outlet />;
}
export function AppLayout() {
  const { t, user, signOut } = useApp();
  const [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(false);
  const nav = [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/learn", "My learning", BookOpen],
    ["/assessment", "Knowledge check", ClipboardCheck],
    ["/explore", "Government schemes", Landmark],
    ["/ask", "Ask FinIQ", MessageSquare],
    ["/progress", "My progress", ChartNoAxesCombined],
    ["/saved", "Saved resources", Bookmark],
  ];
  if (user?.role === "PLATFORM_ADMIN")
    nav.push(["/admin", "Administration", ShieldCheck]);
  if (["PLATFORM_ADMIN", "INSTITUTION_ADMIN"].includes(user?.role))
    nav.push(["/institution", "Institution analytics", Users]);
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="side-logo">
          <Logo />
          <button
            className="mobile-close icon-button"
            aria-label={t("Close")}
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">{t("YOUR LEARNING SPACE")}</div>
        <nav>
          {nav.map(([url, label, Icon]) => (
            <NavLink
              key={url}
              to={url}
              onClick={() => setMobile(false)}
              title={t(label)}
            >
              <Icon size={19} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="side-tip">
            <span>{t("ONE SMALL STEP, EVERY DAY")}</span>
            <p>{t("A little learning. A lot more confidence.")}</p>
            <Link to="/learn">
              {t("Explore learning")} <ArrowUpRight size={15} />
            </Link>
          </div>
          <NavLink to="/settings">
            <Settings size={18} />
            <span>{t("Settings")}</span>
          </NavLink>
          <Link to="/contact">
            <MessageSquare size={18} />
            <span>{t("Help & contact")}</span>
          </Link>
          <button onClick={signOut}>
            <LogOut size={18} />
            <span>{t("Sign out")}</span>
          </button>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>{t("Collapse sidebar")}</span>
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label={t("Close")}
          onClick={() => setMobile(false)}
        />
      )}
      <div className="app-main">
        <header className="app-header">
          <button
            className="mobile-menu icon-button"
            aria-label={t("Open menu")}
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div className="header-crumb">
            {t("Your space")}
            <span>/</span> <strong>FinIQ</strong>
          </div>
          <div className="flex items-center gap-5">
            <Language />
            <Link to="/settings" className="profile-chip">
              <span className="avatar">
                {t(user?.name?.slice(0, 1).toUpperCase())}
              </span>
              <span>
                <strong>{t(user?.name)}</strong>
                <small>{t(user?.knowledgeLevel || "Unassessed")}</small>
              </span>
            </Link>
          </div>
        </header>
        <main className="workspace">
          <Outlet />
        </main>
        <div className="workspace-footer">
          {t("FinIQ \xB7 A clearer path to financial confidence")} {t(" ")}
          <span>
            {t("Educational use \xB7 Verify policy details at source")}
          </span>
        </div>
      </div>
    </div>
  );
}
