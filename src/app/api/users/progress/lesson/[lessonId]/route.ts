import { NextRequest, NextResponse } from 'next/server';
import { UserProgressResponse } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const lessonId = params.lessonId;

    const response = await fetch(`${API_BASE_URL}/users/progress/lesson/${lessonId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseBody: UserProgressResponse | null = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching lesson progress:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch lesson progress' 
      },
      { status: 500 }
    );
  }
}