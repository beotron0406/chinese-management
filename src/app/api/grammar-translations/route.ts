import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.105.41.219:3000";

export async function POST(request: NextRequest) {
  try {
    const translationData = await request.json();

    const response = await fetch(`${API_BASE_URL}/grammar-translations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(translationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();

    
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating grammar translation:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to create grammar translation' 
      },
      { status: 500 }
    );
  }
}
