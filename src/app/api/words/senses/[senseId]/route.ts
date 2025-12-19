import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

// PATCH /api/words/senses/[senseId] - Update word by sense ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { senseId: string } }
) {
  try {
    const { senseId } = params;
    const updateData = await request.json();

    const response = await fetch(`${API_BASE_URL}/words/senses/${senseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            status: false, 
            message: `Word sense with ID ${senseId} not found` 
          },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const responseBody = await response.json();
    
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('❌ Error updating word sense:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to update word sense' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/words/senses/[senseId] - Delete word sense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { senseId: string } }
) {
  try {
    const { senseId } = params;

    const response = await fetch(`${API_BASE_URL}/words/senses/${senseId}`, {
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
            message: `Word sense with ID ${senseId} not found` 
          },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error deleting word sense:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to delete word sense' 
      },
      { status: 500 }
    );
  }
}