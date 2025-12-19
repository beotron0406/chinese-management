import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

// GET /api/words - Get all words with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'ASC';



    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      sortBy,
      sortOrder,
    });

    const response = await fetch(`${API_BASE_URL}/words?${queryParams.toString()}`, {
      method: 'GET',
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
    console.error('❌ Error fetching words:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch words' 
      },
      { status: 500 }
    );
  }
}

// POST /api/words - Create complete word
export async function POST(request: NextRequest) {
  try {
    const wordData = await request.json();

    // Validate required fields
    if (!wordData.wordId && !wordData.word?.simplified) {
      return NextResponse.json(
        { 
          status: false, 
          message: 'Either wordId or word.simplified is required' 
        },
        { status: 400 }
      );
    }

    if (!wordData.sense?.pinyin || !wordData.translation?.translation) {
      return NextResponse.json(
        { 
          status: false, 
          message: 'sense.pinyin and translation.translation are required' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(wordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();

    
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating word:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to create word' 
      },
      { status: 500 }
    );
  }
}
