import { NextRequest, NextResponse } from 'next/server';
import { Lesson } from '@/types/lessonTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/restore`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify({}),
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
        message: error instanceof Error ? error.message : 'Có lỗi khi khôi phục bài học' 
      },
      { status: 500 }
    );
  }
}