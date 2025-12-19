import { NextRequest, NextResponse } from 'next/server';
import { CompleteListsonRequest, UserProgressResponse } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function PUT(request: NextRequest) {
  try {
    const data: CompleteListsonRequest = await request.json();
    
    console.log('🔄 Completing lesson:', data);

    const response = await fetch(`${API_BASE_URL}/users/progress/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: UserProgressResponse = await response.json();
    console.log('✅ Lesson completed successfully');
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error completing lesson:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to complete lesson' 
      },
      { status: 500 }
    );
  }
}