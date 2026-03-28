import { getKiteLoginUrl } from "@/lib/kite-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const loginUrl = getKiteLoginUrl();

    if (!loginUrl) {
      return NextResponse.json(
        { error: "KITE_API_KEY not configured. Please set KITE_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    return NextResponse.json({ loginUrl });
  } catch (error) {
    console.error("Error in kite GET route:", error);
    return NextResponse.json({ error: "Failed to generate KITE login URL" }, { status: 500 });
  }
}
