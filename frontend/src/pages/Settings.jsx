import { catalogueQuery, canonicalValue } from "../lib/i18n";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { Heading, State, Field, Button } from "../components/ui";
function SettingsForm({ data }) {
  const { t, lang, setUser, language, notify } = useApp();
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      ...data.user,
      weeklyGoal: data.learning.weekly_goal,
      preferences: data.learning.preferences,
    },
  });
  useEffect(() => {
    setValue("language", lang);
    for (const field of [
      "occupation",
      "region",
      "education",
      "incomeBracket",
      "preferences",
    ]) {
      const original = canonicalValue(getValues(field) || "");
      setValue(field, t(original));
    }
  }, [lang, setValue, getValues, t]);
  async function submit(values) {
    try {
      const r = await api.put("/me", {
        ...values,
        occupation: canonicalValue(values.occupation),
        education: canonicalValue(values.education),
        region: canonicalValue(values.region),
        incomeBracket: canonicalValue(values.incomeBracket),
        preferences: catalogueQuery(values.preferences || ""),
        weeklyGoal: Number(values.weeklyGoal),
      });
      setUser(r.data.user);
      await language(values.language);
      notify("Changes saved.");
    } catch (e) {
      notify(errorMessage(e), "error");
    }
  }
  return (
    <form
      onInvalid={(e) =>
        e.target.setCustomValidity(t("Please check this field."))
      }
      onInput={(e) => e.target.setCustomValidity?.("")}
      className="card form-card"
      onSubmit={handleSubmit(submit)}
    >
      <div className="form-grid">
        {[
          ["name", "Full name"],
          ["occupation", "Occupation"],
          ["region", "Region"],
          ["education", "Education"],
          ["incomeBracket", "Income bracket (optional)"],
        ].map(([name, label]) => (
          <Field key={name} label={t(label)} error={errors[name]?.message}>
            <input
              {...register(name, {
                required:
                  name !== "incomeBracket"
                    ? "Please complete this field."
                    : false,
                maxLength: name === "incomeBracket" ? 80 : 100,
              })}
            />
          </Field>
        ))}
        <Field label={t("Preferred language")}>
          <select {...register("language")}>
            <option value="en">{t("English")}</option>
            <option value="hi">{t("Hindi")}</option>
          </select>
        </Field>
        <Field label={t("Weekly lesson goal")}>
          <input
            type="number"
            min={1}
            max={20}
            {...register("weeklyGoal", {
              required: true,
              min: 1,
              max: 20,
            })}
          />
        </Field>
        <Field label={t("Topic preferences")}>
          <input
            {...register("preferences", {
              maxLength: 500,
            })}
            placeholder={t("Savings, Banking, Insurance…")}
          />
        </Field>
      </div>
      <p className="muted text-sm mb-6">
        {t("Email:")} {t(data.user.email)}{" "}
        {t(". Your role and knowledge level are managed by the server.")}
      </p>
      <Button busy={isSubmitting}>{t("Save changes")}</Button>
    </form>
  );
}
export default function Settings() {
  const { t } = useApp();
  const r = useApi("/me");
  return (
    <div className="settings-page">
      <Heading
        title={t("Your account")}
        description={t("Make your learning experience feel more like you.")}
      />
      <State resource={r}>{(d) => <SettingsForm data={d} />}</State>
    </div>
  );
}
