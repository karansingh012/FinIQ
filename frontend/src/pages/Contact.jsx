import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useApp } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { Heading, Button, Field } from "../components/ui";
export default function Contact() {
  const { t } = useApp();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const [message, setMessage] = useState(null);
  async function submit(data) {
    try {
      const r = await api.post("/contact", data);
      setMessage({
        text: r.data.message,
        ok: true,
      });
      reset();
    } catch (e) {
      setMessage({
        text: errorMessage(e),
        ok: false,
      });
    }
  }
  return (
    <div className="public-content narrow">
      <Heading
        eyebrow={t("WE’RE HERE TO HELP")}
        title={t("Contact")}
        description={t(
          "Questions, feedback or a data request? Send a message to the project team.",
        )}
      />
      <form
        onInvalid={(e) =>
          e.target.setCustomValidity(t("Please check this field."))
        }
        onInput={(e) => e.target.setCustomValidity?.("")}
        className="card form-card"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        {message && (
          <div
            role="status"
            className={`alert ${message.ok ? "success" : "error"}`}
          >
            {t(message.text)}
          </div>
        )}
        {[
          ["name", "Full name"],
          ["email", "Email"],
          ["message", "Message"],
        ].map(([name, label]) => (
          <Field key={name} label={t(label)} error={errors[name]?.message}>
            {name === "message" ? (
              <textarea
                rows={6}
                {...register(name, {
                  required: "Please complete this field.",
                  minLength: {
                    value: 10,
                    message: "Please write at least 10 characters.",
                  },
                  maxLength: 5000,
                })}
              />
            ) : (
              <input
                type={name === "email" ? "email" : "text"}
                {...register(name, {
                  required: "Please complete this field.",
                  pattern:
                    name === "email"
                      ? {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email.",
                        }
                      : undefined,
                  maxLength: 254,
                })}
              />
            )}
          </Field>
        ))}
        <Button busy={isSubmitting}>{t("Send message")}</Button>
        <p className="muted text-sm">
          {t(
            "Messages are stored securely for administrator review. Please do not include financial account numbers or identity documents.",
          )}
        </p>
      </form>
    </div>
  );
}
