import { NextRequest, NextResponse } from 'next/server';
import { GrammarPattern, GrammarPatternFormData } from '@/types/grammarTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const translationId = params.translationId;
    const formData: Partial<GrammarPatternFormData> = await request.json();

    const response = await fetch(`${API_BASE_URL}/grammar-patterns/translations/${translationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: GrammarPattern = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error updating grammar pattern via translation:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to update grammar pattern' 
      },
      { status: 500 }
    );
  }
}