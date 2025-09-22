import { NextRequest, NextResponse } from 'next/server';

const API_KEY = '049b900a4109c9c608a0ca696e73f0c6';
const BASE_URL = 'https://api.marketstack.com/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const interval = searchParams.get('interval') || '1min';
    
    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BASE_URL}/intraday?access_key=${API_KEY}&symbols=${encodeURIComponent(symbols)}&interval=${interval}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      
      // Handle specific error cases with better logging
      if (response.status === 403) {
        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.error?.code === 'function_access_restricted') {
            const userFriendlyMessage = `Intraday data not available - subscription plan doesn't support real-time data for ${symbols}`;
            console.warn(userFriendlyMessage);
            return NextResponse.json(
              { 
                error: userFriendlyMessage,
                code: 'SUBSCRIPTION_LIMITATION',
                details: 'Your current Marketstack subscription plan does not support real-time intraday data. The application will fall back to end-of-day data.'
              },
              { status: 403 }
            );
          } else {
            console.error('Marketstack API error:', response.status, errorData);
          }
        } catch {
          console.error('Marketstack API error:', response.status, errorData);
        }
      } else {
        console.error('Marketstack API error:', response.status, errorData);
      }
      
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
