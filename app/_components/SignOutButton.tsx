"use client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="text-sm text-accent underline underline-offset-2"
      onClick={() => {
        fetch("/api/session", { method: "DELETE" }).then(() => location.reload());
      }}
    >
      Sign out
    </button>
  );
}
