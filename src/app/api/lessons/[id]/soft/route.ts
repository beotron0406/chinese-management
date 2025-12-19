import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    console.log(`🔄 Soft deleting lesson: ${lessonId}`);

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/soft`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log('✅ Lesson soft deleted successfully');
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error soft deleting lesson:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to soft delete lesson' 
      },
      { status: 500 }
    );
  }
}