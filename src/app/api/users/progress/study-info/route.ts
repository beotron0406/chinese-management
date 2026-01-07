import { NextRequest, NextResponse } from 'next/server';
import { StudyInfo } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.105.41.219:3000";

export async function GET(request: NextRequest) {
  try {


    const response = await fetch(`${API_BASE_URL}/users/progress/study-info`, {
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

    const responseBody: StudyInfo = await response.json();

    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching study info:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch study info' 
      },
      { status: 500 }
    );
  }
}
