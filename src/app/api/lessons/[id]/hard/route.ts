
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/hard`, {
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
      message: "Xóa bài học thành công",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error ? error.message : "Có lỗi khi xóa bài học",
      },
      { status: 500 }
    );
  }
}
