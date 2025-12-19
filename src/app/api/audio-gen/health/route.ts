import { NextRequest, NextResponse } from "next/server";

const TTS_API_BASE_URL =
   process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${TTS_API_BASE_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "TTS service unavailable",
      },
      { status: 503 }
    );
  }
}
