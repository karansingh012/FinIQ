import React from "react";
import { useApi, useApp } from "../lib/context";
import {
  Heading,
  State,
  LessonCard,
  SchemeCard,
  Empty,
  Button,
} from "../components/ui";
import { api, errorMessage } from "../lib/api";
export default function Saved() {
  const r = useApi("/bookmarks");
  const { t, notify } = useApp();
  async function remove(type, id) {
    try {
      await api.delete(`/${type}/${id}/bookmark`);
      r.reload();
    } catch (e) {
      notify(errorMessage(e), "error");
    }
  }
  return (
    <>
      <Heading
        title={t("Saved resources")}
        description={t("Your personal shelf of useful ideas and information.")}
      />
      <State resource={r}>
        {(d) => (
          <>
            {!d.lessons.length && !d.schemes.length && (
              <Empty
                title={t("No saved resources")}
                message={t("Save lessons and schemes to find them here.")}
              />
            )}
            {[
              ["lessons", d.lessons],
              ["schemes", d.schemes],
            ].map(
              ([type, items]) =>
                items.length > 0 && (
                  <section className="mb-8" key={type}>
                    <h2 className="section-heading">
                      {t(
                        type === "lessons"
                          ? "My learning"
                          : "Government schemes",
                      )}
                    </h2>
                    <div className="grid-cards">
                      {items.map((item) => (
                        <div key={item.id}>
                          {type === "lessons" ? (
                            <LessonCard lesson={item} />
                          ) : (
                            <SchemeCard scheme={item} />
                          )}
                          <Button
                            variant="ghost small"
                            onClick={() => remove(type, item.id)}
                          >
                            {t("Remove")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                ),
            )}
          </>
        )}
      </State>
    </>
  );
}
