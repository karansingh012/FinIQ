import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useApp } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { Button, Field } from "../components/ui";
export default function Auth({ mode = "login" }) {
  const { t, signIn, lang } = useApp();
  const navigate = useNavigate(),
    location = useLocation();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      language: lang,
    },
  });
  useEffect(() => {
    setValue("language", lang);
  }, [lang, setValue]);
  const signup = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  const title = signup
    ? "Your next chapter starts here."
    : forgot
      ? "Forgot password?"
      : reset
        ? "Reset password"
        : "Welcome back";
  const required = "Please complete this field.";
  async function submit(data) {
    setError("");
    try {
      if (forgot) {
        setSuccess(
          (await api.post("/auth/forgot-password", data)).data.message,
        );
        return;
      }
      if (reset) {
        await api.post("/auth/reset-password", {
          token: params.get("token") || "",
          password: data.password,
        });
        setSuccess("Password reset. You can now sign in.");
        return;
      }
      const result = await api.post(
        `/auth/${signup ? "register" : "login"}`,
        data,
      );
      signIn(result.data);
      navigate(location.state?.from || "/dashboard", {
        replace: true,
      });
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <section className={`auth-page ${signup ? "register-page" : ""}`}>
      <aside className="auth-aside">
        <div className="eyebrow">{t("A LITTLE KNOWLEDGE GOES A LONG WAY")}</div>
        <h2>
          {t("Build a future")}
          <br />
          {t("you understand.")}
        </h2>
        <p>
          {t("Everyday financial learning.")}
          <br />
          {t("A path that grows with you.")}
        </p>
        <div className="auth-decoration">
          <ShieldCheck size={70} />
          <span>{t("Learn. Understand. Grow.")}</span>
        </div>
        <small>
          {t("Designed for curiosity.")}
          <br />
          {t("No finance background required.")}
        </small>
      </aside>
      <div className="auth-form">
        <div className="eyebrow">{t("WELCOME TO FINIQ")}</div>
        <h1>{t(title)}</h1>
        <p>
          {t(
            signup
              ? "A few details help us make your learning more relevant."
              : forgot
                ? "Enter your account email to request a secure reset link."
                : reset
                  ? "Choose a new password with at least 10 characters."
                  : "Pick up where you left off.",
          )}
        </p>
        {success ? (
          <div className="success-panel" role="status">
            <p>{t(success)}</p>
            <Link to="/login" className="button">
              {t("Sign in")}
            </Link>
          </div>
        ) : (
          <form
            onInvalid={(e) =>
              e.target.setCustomValidity(t("Please check this field."))
            }
            onInput={(e) => e.target.setCustomValidity?.("")}
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            {error && (
              <div className="alert error" role="alert">
                {t(error)}
              </div>
            )}
            <div className={signup ? "form-grid" : ""}>
              {signup && (
                <Field label={t("Full name")} error={errors.name?.message}>
                  <input
                    autoComplete="name"
                    {...register("name", {
                      required,
                      maxLength: 120,
                    })}
                  />
                </Field>
              )}
              {!reset && (
                <Field label={t("Email")} error={errors.email?.message}>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email", {
                      required,
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email.",
                      },
                    })}
                  />
                </Field>
              )}
              {!forgot && (
                <Field
                  label={t(reset ? "New password" : "Password")}
                  error={errors.password?.message}
                >
                  <div className="password-field">
                    <input
                      type={visible ? "text" : "password"}
                      autoComplete={
                        signup || reset ? "new-password" : "current-password"
                      }
                      {...register("password", {
                        required,
                        minLength:
                          signup || reset
                            ? {
                                value: 10,
                                message: "Use at least 10 characters.",
                              }
                            : undefined,
                        maxLength: 72,
                      })}
                    />
                    <button
                      type="button"
                      aria-label={t(
                        visible ? "Hide password" : "Show password",
                      )}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
              )}
              {signup && (
                <>
                  <Field
                    label={t("Confirm password")}
                    error={errors.confirm?.message}
                  >
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register("confirm", {
                        required,
                        validate: (v) =>
                          v === watch("password") || "Passwords must match.",
                      })}
                    />
                  </Field>
                  <Field label={t("Preferred language")}>
                    <select {...register("language")}>
                      <option value="en">{t("English")}</option>
                      <option value="hi">{t("Hindi")}</option>
                    </select>
                  </Field>
                  <Field
                    label={t("Occupation")}
                    error={errors.occupation?.message}
                  >
                    <select
                      {...register("occupation", {
                        required,
                      })}
                    >
                      <option value="">{t("Select\u2026")}</option>
                      {[
                        "Student",
                        "Salaried professional",
                        "Self-employed",
                        "Educator",
                        "Farmer",
                        "Other",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {t(v)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Region")} error={errors.region?.message}>
                    <input
                      placeholder={t("State / region")}
                      {...register("region", {
                        required,
                        maxLength: 120,
                      })}
                    />
                  </Field>
                  <Field
                    label={t("Education")}
                    error={errors.education?.message}
                  >
                    <select
                      {...register("education", {
                        required,
                      })}
                    >
                      <option value="">{t("Select\u2026")}</option>
                      {[
                        "School",
                        "Undergraduate",
                        "Graduate",
                        "Postgraduate",
                        "Other",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {t(v)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Income bracket (optional)")}>
                    <select {...register("incomeBracket")}>
                      <option value="">{t("Prefer not to say")}</option>
                      <option value={"No regular income"}>
                        {t("No regular income")}
                      </option>
                      <option value={"Below \u20B925,000 / month"}>
                        {t("Below \u20B925,000 / month")}
                      </option>
                      <option value={"\u20B925,000\u2013\u20B975,000 / month"}>
                        {t("\u20B925,000\u2013\u20B975,000 / month")}
                      </option>
                      <option value={"Above \u20B975,000 / month"}>
                        {t("Above \u20B975,000 / month")}
                      </option>
                    </select>
                  </Field>
                </>
              )}
            </div>
            {signup && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  {...register("consent", {
                    required: "Please accept the terms.",
                  })}
                />
                <span>
                  {t("I agree to the privacy notice and terms.")} {t(" ")}
                  <Link to="/privacy">{t("Privacy")}</Link> ·{t(" ")}
                  <Link to="/terms">{t("Terms")}</Link>
                  {errors.consent && (
                    <small className="field-error">
                      {t(errors.consent.message)}
                    </small>
                  )}
                </span>
              </label>
            )}
            {mode === "login" && (
              <Link className="forgot-link" to="/forgot-password">
                {t("Forgot password?")}
              </Link>
            )}
            <Button className="w-full" busy={isSubmitting}>
              {t(
                signup
                  ? "Create account"
                  : forgot
                    ? "Send reset link"
                    : reset
                      ? "Reset password"
                      : "Sign in",
              )}{" "}
              {t(" ")}
              <ArrowRight size={17} />
            </Button>
          </form>
        )}
        <div className="auth-switch">
          {signup ? (
            <>
              {t("Already learning with us?")}
              <Link to="/login">{t("Sign in")}</Link>
            </>
          ) : (
            <Link to="/register">
              {t("New to FinIQ?")} {t("Create account")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
