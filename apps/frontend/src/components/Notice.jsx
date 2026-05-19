import React from "react";

export default function Notice({ message, error }) {
  if (!message && !error) return null;

  return (
    <section className={`notice ${error ? "notice-error" : "notice-success"}`}>
      {error || message}
    </section>
  );
}
