import { NextRequest, NextResponse } from 'next/server';
import { LessonContent, ContentFormValues } from '@/types/lessonTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.105.41.219:3000";

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;
    const itemData: Partial<ContentFormValues> = await request.json();

    const response = await fetch(`${API_BASE_URL}/lessons/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody: LessonContent = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error updating lesson item:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to update lesson item' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Construct URL with query parameters if they exist
    let url = `${API_BASE_URL}/lessons/items/${itemId}`;
    if (type) {
      url += `?type=${type}`;
    }

    const response = await fetch(url, {
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

    const responseBody = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error deleting lesson item:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to delete lesson item' 
      },
      { status: 500 }
    );
  }
}