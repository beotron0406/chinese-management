import { NextRequest, NextResponse } from "next/server";

const TTS_API_BASE_URL =
   process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "female" } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    console.log(`🔄 Generating TTS: "${text}" with voice: ${voice}`);

    const response = await fetch(`${TTS_API_BASE_URL}/audio-gen/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("✅ TTS generated successfully");

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="tts_${Date.now()}.wav"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generating TTS:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate TTS",
      },
      { status: 500 }
    );
  }
}
