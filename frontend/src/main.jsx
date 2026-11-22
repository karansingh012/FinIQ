import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "./lib/context";
import "./styles.css";
document.documentElement.dataset.theme = localStorage.getItem("finiq-theme") || "light";
document.documentElement.lang = localStorage.getItem("finiq-language") || "en";
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </ErrorBoundary>,
);
