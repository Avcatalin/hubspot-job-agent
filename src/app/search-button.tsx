"use client";

import { useFormStatus } from "react-dom";

export function SearchButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button"
      disabled={pending || disabled}
      title={disabled ? "Configure Supabase before searching" : undefined}
      type="submit"
    >
      {pending ? "Searching…" : "Search now"}
    </button>
  );
}
