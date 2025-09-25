import { NextRequest, NextResponse } from 'next/server';

const PLAID_CLIENT_ID = '6882a32845ca640021c5c2ce';
const PLAID_SECRET = 'f483717dbc3113cd81746a6ce511c3';
const PLAID_BASE_URL = 'https://sandbox.plaid.com';

export async function POST(request: NextRequest) {
  try {
    const { public_token } = await request.json();
    
    if (!public_token) {
      return NextResponse.json(
        { success: false, error: 'Public token is required' },
        { status: 400 }
      );
    }
    
    const requestBody = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      public_token
    };
    
    const response = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Plaid token exchange error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Plaid API error: ${response.statusText}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: {
        access_token: data.access_token,
        item_id: data.item_id,
        request_id: data.request_id
      },
    });
  } catch (error) {
    console.error('Plaid token exchange error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to exchange public token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
