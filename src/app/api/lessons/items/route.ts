import { NextRequest, NextResponse } from 'next/server';
import { LessonContent } from '@/types/lessonTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();
    
    console.log('🔄 Creating lesson item:', itemData);

    const response = await fetch(`${API_BASE_URL}/lessons/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: LessonContent = await response.json();
    console.log('✅ Lesson item created successfully');
    
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating lesson item:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to create lesson item' 
      },
      { status: 500 }
    );
  }
}