import { NextRequest, NextResponse } from 'next/server';
import { GrammarPattern, GrammarPatternFormData } from '@/types/grammarTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function POST(request: NextRequest) {
  try {
    const formData: GrammarPatternFormData = await request.json();


    const response = await fetch(`${API_BASE_URL}/grammar-patterns/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API error response:', errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: GrammarPattern = await response.json();


    
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating complete grammar pattern:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to create complete grammar pattern' 
      },
      { status: 500 }
    );
  }
}
