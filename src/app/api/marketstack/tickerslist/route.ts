import { NextRequest, NextResponse } from 'next/server';

const API_KEY = '049b900a4109c9c608a0ca696e73f0c6';
const BASE_URL = 'https://api.marketstack.com/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    
    let url = `${BASE_URL}/tickerslist?access_key=${API_KEY}&limit=${limit}&offset=${offset}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Marketstack API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to fetch data from Marketstack API', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in marketstack proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
