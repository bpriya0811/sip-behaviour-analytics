import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expectedPasscode =
    process.env.RESEARCHER_PASSCODE ?? process.env.NEXT_PUBLIC_RESEARCHER_PASSCODE;

  if (!expectedPasscode) {
    return NextResponse.json(
      { detail: "Researcher passcode is not configured." },
      { status: 503 }
    );
  }

  const payload = (await request.json().catch(() => null)) as { passcode?: string } | null;
  const submittedPasscode = payload?.passcode?.trim();

  if (!submittedPasscode || submittedPasscode !== expectedPasscode) {
    return NextResponse.json({ detail: "Invalid researcher passcode." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
