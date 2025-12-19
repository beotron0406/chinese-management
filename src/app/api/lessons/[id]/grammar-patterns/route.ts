import { NextRequest, NextResponse } from 'next/server';
import { LessonGrammarPattern, AddLessonGrammarPatternDto } from '@/types/lessonTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/grammar-patterns`, {
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

    const responseBody: LessonGrammarPattern[] = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching lesson grammar patterns:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch lesson grammar patterns' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const patterns: AddLessonGrammarPatternDto[] = await request.json();

    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/grammar-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(patterns),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error adding grammar patterns to lesson:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to add grammar patterns to lesson' 
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
    const { searchParams } = new URL(request.url);
    const grammarPatternIds = searchParams.get('grammarPatternIds');

    const queryString = grammarPatternIds ? `?grammarPatternIds=${grammarPatternIds}` : '';
    
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/grammar-patterns${queryString}`, {
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
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error removing grammar patterns from lesson:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to remove grammar patterns from lesson' 
      },
      { status: 500 }
    );
  }
}   