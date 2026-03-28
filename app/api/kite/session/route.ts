import { type KiteProfile, generateSession, getProfile } from "@/lib/kite-api";
import { redis } from "@/lib/redis";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { requestToken } = await request.json();

    if (!requestToken) {
      return NextResponse.json({ error: "requestToken is required" }, { status: 400 });
    }

    const apiSecret = process.env.KITE_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json({ error: "KITE_API_SECRET not configured" }, { status: 500 });
    }

    const sessionData = await generateSession(requestToken, apiSecret);

    const profile = await getProfile(sessionData.access_token);

    const kiteUserId = `kite:${sessionData.user_id}`;

    try {
      await redis.set(
        `kite:session:${sessionData.user_id}`,
        JSON.stringify({
          accessToken: sessionData.access_token,
          userId: sessionData.user_id,
          userName: sessionData.user_name,
          email: sessionData.email,
        }),
        { ex: 86400 * 7 }
      );
    } catch (redisError) {
      console.warn("Redis error storing KITE session:", redisError);
    }

    return NextResponse.json({
      success: true,
      userId: sessionData.user_id,
      userName: sessionData.user_name,
      email: sessionData.email,
      profile,
    });
  } catch (error) {
    console.error("Error in kite session route:", error);
    return NextResponse.json({ error: "Failed to generate session" }, { status: 500 });
  }
}
