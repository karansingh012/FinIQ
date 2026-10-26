import React, { useState } from "react";
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
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { language: lang } });
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
  const required = t("Please complete this field.");
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
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <section className={`auth-page ${signup ? "register-page" : ""}`}>
      <aside className="auth-aside">
        <div className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</div>
        <h2>
          Build a future
          <br />
          you understand.
        </h2>
        <p>
          Everyday financial learning.
          <br />A path that grows with you.
        </p>
        <div className="auth-decoration">
          <ShieldCheck size={70} />
          <span>Learn. Understand. Grow.</span>
        </div>
        <small>
          Designed for curiosity.
          <br />
          No finance background required.
        </small>
      </aside>
      <div className="auth-form">
        <div className="eyebrow">WELCOME TO FINIQ</div>
        <h1>{t(title)}</h1>
        <p>
          {signup
            ? "A few details help us make your learning more relevant."
            : forgot
              ? "Enter your account email to request a secure reset link."
              : reset
                ? "Choose a new password with at least 10 characters."
                : "Pick up where you left off."}
        </p>
        {success ? (
          <div className="success-panel" role="status">
            <p>{success}</p>
            <Link to="/login" className="button">
              {t("Sign in")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submit)} noValidate>
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
                    {...register("name", { required, maxLength: 120 })}
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
                        message: t("Enter a valid email."),
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
                                message: t("Use at least 10 characters."),
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
                          v === watch("password") || t("Passwords must match."),
                      })}
                    />
                  </Field>
                  <Field label={t("Preferred language")}>
                    <select {...register("language")}>
                      <option value="en">English</option>
                      <option value="hi">हिन्दी</option>
                    </select>
                  </Field>
                  <Field
                    label={t("Occupation")}
                    error={errors.occupation?.message}
                  >
                    <select {...register("occupation", { required })}>
                      <option value="">Select…</option>
                      {[
                        "Student",
                        "Salaried professional",
                        "Self-employed",
                        "Educator",
                        "Farmer",
                        "Other",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Region")} error={errors.region?.message}>
                    <input
                      placeholder="State / region"
                      {...register("region", { required, maxLength: 120 })}
                    />
                  </Field>
                  <Field
                    label={t("Education")}
                    error={errors.education?.message}
                  >
                    <select {...register("education", { required })}>
                      <option value="">Select…</option>
                      {[
                        "School",
                        "Undergraduate",
                        "Graduate",
                        "Postgraduate",
                        "Other",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Income bracket (optional)")}>
                    <select {...register("incomeBracket")}>
                      <option value="">Prefer not to say</option>
                      <option>No regular income</option>
                      <option>Below ₹25,000 / month</option>
                      <option>₹25,000–₹75,000 / month</option>
                      <option>Above ₹75,000 / month</option>
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
                    required: t("Please accept the terms."),
                  })}
                />
                <span>
                  {t("I agree to the privacy notice and terms.")}{" "}
                  <Link to="/privacy">{t("Privacy")}</Link> ·{" "}
                  <Link to="/terms">{t("Terms")}</Link>
                  {errors.consent && (
                    <small className="field-error">
                      {errors.consent.message}
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
              <ArrowRight size={17} />
            </Button>
          </form>
        )}
        <div className="auth-switch">
          {signup ? (
            <>
              Already learning with us? <Link to="/login">{t("Sign in")}</Link>
            </>
          ) : (
            <Link to="/register">New to FinIQ? {t("Create account")}</Link>
          )}
        </div>
      </div>
    </section>
  );
}
