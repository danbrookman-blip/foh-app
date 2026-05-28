export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("07") && digits.length === 11) return "+44" + digits.slice(1);
  if (digits.startsWith("44") && digits.length >= 12) return "+" + digits;
  return digits.length >= 7 ? digits : null;
}

export function normaliseEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  return /.+@.+\..+/.test(trimmed) ? trimmed : null;
}

export type Identifier =
  | { kind: "mobile"; value: string }
  | { kind: "email"; value: string };

export function parseIdentifier(raw: string): Identifier | null {
  const mobile = normaliseMobile(raw);
  if (mobile && !raw.includes("@")) return { kind: "mobile", value: mobile };
  const email = normaliseEmail(raw);
  if (email) return { kind: "email", value: email };
  return null;
}
