import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.105.41.219:3000";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/restore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: Course = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error restoring course:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to restore course' 
      },
      { status: 500 }
    );
  }
}