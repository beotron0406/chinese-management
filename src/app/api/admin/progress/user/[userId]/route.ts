import { NextRequest, NextResponse } from 'next/server';
import { UserProgressDetail } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log(`🔄 Fetching admin user progress: ${userId}`);

    const response = await fetch(`${API_BASE_URL}/admin/progress/user/${userId}`, {
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

    const responseBody: UserProgressDetail = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch user progress' 
      },
      { status: 500 }
    );
  }
}