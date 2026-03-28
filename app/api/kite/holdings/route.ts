import { type KiteHoldingsItem, getHoldingsWithQuotes } from "@/lib/kite-api";
import { redis } from "@/lib/redis";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let sessionData: { accessToken: string } | null = null;

    try {
      const stored = await redis.get(`kite:session:${userId}`);
      if (stored && typeof stored === "string") {
        sessionData = JSON.parse(stored);
      }
    } catch (redisError) {
      console.warn("Redis error getting KITE session:", redisError);
    }

    if (!sessionData?.accessToken) {
      return NextResponse.json(
        { error: "No active KITE session found", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    const holdings = await getHoldingsWithQuotes(sessionData.accessToken);

    return NextResponse.json({
      holdings,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in kite holdings route:", error);
    return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
  }
}
