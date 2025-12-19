import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

// GET /api/words/[id] - Get single word by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('🔄 Fetching word by ID:', id);

    const response = await fetch(`${API_BASE_URL}/words/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            status: false, 
            message: `Word with ID ${id} not found` 
          },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log('✅ Word fetched successfully:', responseBody.simplified);
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error fetching word:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch word' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/words/[id] - Delete word (cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('🔄 Deleting word:', id);

    const response = await fetch(`${API_BASE_URL}/words/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            status: false, 
            message: `Word with ID ${id} not found` 
          },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    console.log('✅ Word deleted successfully:', id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error deleting word:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to delete word' 
      },
      { status: 500 }
    );
  }
}