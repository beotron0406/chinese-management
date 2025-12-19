import { NextRequest, NextResponse } from "next/server";

const TTS_API_BASE_URL =
  process.env.TTS_API_BASE_URL || "http://localhost:9880";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${TTS_API_BASE_URL}/voices`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Return default voices if API fails
    return NextResponse.json({
      voices: [
        { id: "male", name: "Male Voice", description: "Adult male voice" },
        { id: "female", name: "Female Voice", description: "Adult female voice" },
        { id: "child", name: "Child Voice", description: "Child voice" },
        { id: "uncle", name: "Uncle Voice", description: "Older male voice" },
      ],
    });
  }
}
