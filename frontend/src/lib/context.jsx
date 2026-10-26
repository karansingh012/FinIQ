import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, errorMessage } from "./api";
import { hi } from "./translations";
const Context = createContext();
export function Provider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [lang, setLang] = useState(localStorage.getItem("finiq-language") || "en"),
    [notice, setNotice] = useState(null);
  const t = useCallback(
    (text) => (lang === "hi" ? hi[text] || text : text),
    [lang],
  );
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("finiq-language", lang);
  }, [lang]);
  useEffect(() => {
    if (sessionStorage.getItem("finiq-token"))
      api
        .get("/me")
        .then((r) => {
          setUser(r.data.user);
          setLang(r.data.user.language);
        })
        .catch(() => sessionStorage.removeItem("finiq-token"))
        .finally(() => setReady(true));
    else setReady(true);
    const expired = () => {
      setUser(null);
      setNotice({
        message: "Your session expired. Please sign in again.",
        kind: "error",
      });
    };
    window.addEventListener("finiq-expired", expired);
    return () => window.removeEventListener("finiq-expired", expired);
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  function signIn(data) {
    sessionStorage.setItem("finiq-token", data.token);
    setUser(data.user);
    setLang(data.user.language);
  }
  async function signOut() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // An expired or revoked token already has no server session to revoke.
      if (e.response?.status !== 401) {
        setNotice({ message: errorMessage(e), kind: "error" });
        return;
      }
    }
    sessionStorage.removeItem("finiq-token");
    setUser(null);
  }
  async function language(value) {
    setLang(value);
    if (user) {
      try {
        const p = (await api.get("/me")).data;
        const saved = (
          await api.put("/me", {
            ...p.user,
            preferences: p.learning.preferences,
            weeklyGoal: p.learning.weekly_goal,
            language: value,
          })
        ).data;
        setUser(saved.user);
      } catch (e) {
        setNotice({ message: errorMessage(e), kind: "error" });
      }
    }
  }
  const notify = (message, kind = "success") => setNotice({ message, kind });
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        ready,
        lang,
        t,
        language,
        signIn,
        signOut,
        notify,
      }}
    >
      {children}
      {notice && (
        <div className={`toast ${notice.kind}`} role="status">
          {t(notice.message)}
          <button aria-label={t("Close")} onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function useApi(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get(path)
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return {
    data,
    error,
    loading,
    reload: () => setVersion((v) => v + 1),
    setData,
  };
}
