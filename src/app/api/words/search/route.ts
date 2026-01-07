import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.105.41.219:3000";

// GET /api/words/search?simplified=你好 - Search word by simplified form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simplified = searchParams.get('simplified');

    if (!simplified) {
      return NextResponse.json(
        { 
          status: false, 
          message: 'simplified parameter is required' 
        },
        { status: 400 }
      );
    }



    const response = await fetch(
      `${API_BASE_URL}/words/search?simplified=${encodeURIComponent(simplified)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('authorization') || '',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error searching word:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to search word' 
      },
      { status: 500 }
    );
  }
}
