import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useApp } from "./lib/context";
import {
  PublicLayout,
  AppLayout,
  Protected,
  Language,
} from "./components/Layout";
import { Landing, About, Legal } from "./pages/Public";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Detail from "./pages/Detail";
import Assessment, { Results } from "./pages/Assessment";
import Progress from "./pages/Progress";
import Saved from "./pages/Saved";
import Ask from "./pages/Ask";
import Settings from "./pages/Settings";
import Admin, { Institution } from "./pages/Admin";
function ScrollTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function DetailLayout() {
  const { user } = useApp();
  return user ? <AppLayout /> : <PublicLayout />;
}
export default function App() {
  const { t } = useApp();
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Legal privacy />} />
          <Route path="terms" element={<Legal />} />
          <Route path="login" element={<Auth key="login" />} />
          <Route
            path="register"
            element={<Auth key="register" mode="register" />}
          />
          <Route
            path="forgot-password"
            element={<Auth key="forgot" mode="forgot" />}
          />
          <Route
            path="reset-password"
            element={<Auth key="reset" mode="reset" />}
          />
          <Route path="lessons" element={<Catalog />} />
          <Route path="schemes" element={<Catalog schemes />} />
        </Route>
        <Route element={<DetailLayout />}>
          <Route path="lessons/:id" element={<Detail />} />
          <Route path="schemes/:id" element={<Detail scheme />} />
        </Route>
        <Route element={<Protected />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="learn" element={<Catalog />} />
            <Route path="explore" element={<Catalog schemes />} />
            <Route path="assessment" element={<Assessment />} />
            <Route path="assessment/:id" element={<Assessment />} />
            <Route path="results/:id" element={<Results />} />
            <Route path="progress" element={<Progress />} />
            <Route path="saved" element={<Saved />} />
            <Route path="ask" element={<Ask />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin"
              element={
                <Protected admin>
                  <Admin />
                </Protected>
              }
            />
            <Route
              path="institution"
              element={
                <Protected institution>
                  <Institution />
                </Protected>
              }
            />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="empty">
              <Language />
              <h1>{t("Page not found")}</h1>
              <Link to="/" className="button">
                {t("Back to FinIQ")}
              </Link>
            </div>
          }
        />
      </Routes>
    </>
  );
}
