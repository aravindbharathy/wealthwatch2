import { NextRequest, NextResponse } from 'next/server';

const PLAID_CLIENT_ID = '6882a32845ca640021c5c2ce';
const PLAID_SECRET = 'f483717dbc3113cd81746a6ce511c3';
const PLAID_ENV = 'sandbox';
const PLAID_BASE_URL = 'https://sandbox.plaid.com';

export async function POST(request: NextRequest) {
  try {
    const { access_token, account_ids } = await request.json();
    
    if (!access_token) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      );
    }
    
    // For testing purposes, if access_token is 'test-sandbox', return mock data
    if (access_token === 'test-sandbox') {
      const fs = await import('fs');
      const path = await import('path');
      
      try {
        const mockDataPath = path.join(process.cwd(), 'src/app/plaid_sandbox/holdings-get.json');
        const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
        
        return NextResponse.json({
          success: true,
          data: {
            accounts: mockData.accounts || [],
            holdings: mockData.holdings || [],
            securities: mockData.securities || [],
            item: mockData.item || null,
            request_id: 'mock-request-id'
          },
        });
      } catch (error) {
        console.error('Error reading mock data:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to load mock data' },
          { status: 500 }
        );
      }
    }
    
    const requestBody = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token,
      ...(account_ids && { options: { account_ids } })
    };
    
    const response = await fetch(`${PLAID_BASE_URL}/investments/holdings/get`, {
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
      console.error('Plaid API error:', response.status, errorData);
      
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
        accounts: data.accounts || [],
        holdings: data.holdings || [],
        securities: data.securities || [],
        item: data.item || null,
        request_id: data.request_id
      },
    });
  } catch (error) {
    console.error('Plaid holdings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch holdings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
