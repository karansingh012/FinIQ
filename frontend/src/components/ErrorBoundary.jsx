import React from "react";
import { translate } from "../lib/i18n";
export default class ErrorBoundary extends React.Component {
  state = {
    failed: false,
  };
  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }
  render() {
    const t = (text) =>
      translate(text, localStorage.getItem("finiq-language") || "en");
    if (this.state.failed)
      return (
        <main className="empty">
          <h1>{t("Something interrupted this page.")}</h1>
          <p>
            {t("Your saved learning progress is safe. Reload to try again.")}
          </p>
          <button className="button" onClick={() => window.location.reload()}>
            {t("Reload FinIQ")}
          </button>
        </main>
      );
    return this.props.children;
  }
}
