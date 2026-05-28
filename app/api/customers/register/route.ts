import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { normaliseEmail, normaliseMobile } from "@/lib/identifiers";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        firstName?: string;
        lastName?: string;
        mobile?: string;
        email?: string;
        consentMarketing?: boolean;
      }
    | null;

  if (!body?.firstName || !body.lastName || !body.mobile || !body.email) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const mobile = normaliseMobile(body.mobile);
  const email = normaliseEmail(body.email);
  if (!mobile || !email) {
    return NextResponse.json({ error: "invalid_contact" }, { status: 400 });
  }

  const result = await airship.registerCustomer({
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    mobile,
    email,
    consentMarketing: !!body.consentMarketing,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ ok: true, customerRef: result.customerRef });
}
