import { NextRequest, NextResponse } from "next/server";
import { Lesson, LessonFormValues } from "@/types/lessonTypes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    console.log(`🔄 Fetching lesson: ${lessonId}`);

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseBody: Lesson = await response.json();
    console.log("✅ Lesson fetched successfully");

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch lesson",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const lessonData: Partial<LessonFormValues> = await request.json();

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify(lessonData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: Lesson = await response.json();

    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error ? error.message : "Failed to update lesson",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/soft`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return NextResponse.json({
      status: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error ? error.message : "Failed to delete lesson",
      },
      { status: 500 }
    );
  }
}
