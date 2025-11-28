import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://26.112.47.221:3000";

// Server-side API helper function
export const serverApiRequest = async <T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> => {
  const { token, ...fetchOptions } = options;
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(fetchOptions.headers || {}),
  };

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to extract token from request
export const getTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookies if no auth header
  const tokenCookie = request.cookies.get('auth_token');
  return tokenCookie?.value || null;
};

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: error.message || 'Internal Server Error' },
    { status: error.status || 500 }
  );
};

// Helper function for successful responses
export const handleApiSuccess = <T>(data: T, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};