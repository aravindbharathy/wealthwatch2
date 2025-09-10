import { NextResponse } from 'next/server';
import axios from 'axios';

const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const EXCHANGERATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const amount = searchParams.get('amount');

  if (!from || !to) {
    return NextResponse.json({ error: 'From and to currencies are required' }, { status: 400 });
  }

  try {
    // If we have an API key, use the premium API, otherwise use the free tier
    const apiUrl = EXCHANGERATE_API_KEY 
      ? `${EXCHANGERATE_BASE_URL}/${EXCHANGERATE_API_KEY}/pair/${from}/${to}`
      : `https://api.exchangerate-api.com/v4/latest/${from}`;

    let response;
    let convertedAmount;
    let rate;

    if (EXCHANGERATE_API_KEY) {
      // Premium API with direct conversion
      response = await axios.get(apiUrl);
      rate = response.data.conversion_rate;
      convertedAmount = amount ? parseFloat(amount) * rate : null;
    } else {
      // Free API - get all rates and calculate
      response = await axios.get(apiUrl);
      rate = response.data.rates[to];
      convertedAmount = amount && rate ? parseFloat(amount) * rate : null;
    }

    return NextResponse.json({
      from,
      to,
      rate,
      amount: amount ? parseFloat(amount) : null,
      convertedAmount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching currency conversion:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch currency conversion', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
