import { NextRequest, NextResponse } from 'next/server';

const PLAID_CLIENT_ID = '6882a32845ca640021c5c2ce';
const PLAID_SECRET = 'f483717dbc3113cd81746a6ce511c3';
const PLAID_BASE_URL = 'https://sandbox.plaid.com';

export async function POST(request: NextRequest) {
  try {
    const { institution_id, initial_products, user_token } = await request.json();
    
    // Default values for sandbox testing
    const requestBody = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      institution_id: institution_id || 'ins_109508', // Default to Chase
      initial_products: initial_products || ['investments', 'auth'],
      ...(user_token && { user_token })
    };
    
    const response = await fetch(`${PLAID_BASE_URL}/sandbox/public_token/create`, {
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
      console.error('Plaid sandbox token creation error:', response.status, errorData);
      
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
        public_token: data.public_token,
        request_id: data.request_id
      },
    });
  } catch (error) {
    console.error('Plaid sandbox token creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create sandbox public token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
