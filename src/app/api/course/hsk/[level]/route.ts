import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const hskLevel = params.level;

    const response = await fetch(`${API_BASE_URL}/courses/hsk/${hskLevel}`, {
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

    const responseBody: Course[] = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching courses by HSK level:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch courses by HSK level' 
      },
      { status: 500 }
    );
  }
}