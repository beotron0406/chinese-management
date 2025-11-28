import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardData } from '@/types/userprogressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    
    console.log(`🔄 Fetching leaderboard with limit: ${limit}`);

    const response = await fetch(`${API_BASE_URL}/admin/progress/leaderboard?limit=${limit}`, {
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

    const responseBody: LeaderboardData = await response.json();
    console.log('✅ Leaderboard fetched successfully');
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch leaderboard' 
      },
      { status: 500 }
    );
  }
}