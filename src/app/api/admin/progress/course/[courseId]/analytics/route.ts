import { NextRequest, NextResponse } from 'next/server';
import { CourseAnalytics } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;

    const response = await fetch(`${API_BASE_URL}/admin/progress/course/${courseId}/analytics`, {
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

    const responseBody: CourseAnalytics = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching course analytics:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch course analytics' 
      },
      { status: 500 }
    );
  }
}