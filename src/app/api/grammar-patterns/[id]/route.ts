import { NextRequest, NextResponse } from 'next/server';
import { GrammarPattern } from '@/types/grammarTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patternId = params.id;

    const response = await fetch(`${API_BASE_URL}/grammar-patterns/${patternId}`, {
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

    const responseBody: GrammarPattern = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching grammar pattern:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch grammar pattern' 
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
    const patternId = params.id;

    const response = await fetch(`${API_BASE_URL}/grammar-patterns/${patternId}`, {
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

    return NextResponse.json({ message: 'Grammar pattern deleted successfully' }, { status: 204 });
  } catch (error) {
    console.error('❌ Error deleting grammar pattern:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to delete grammar pattern' 
      },
      { status: 500 }
    );
  }
}