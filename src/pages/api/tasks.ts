// Import dependencies
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API ROUTE LOG: Handler function called');  // Log when handler is called

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY) {
    console.error('API ROUTE LOG: AIRTABLE_API_KEY is not set');
    res.status(500).json({ message: 'AIRTABLE_API_KEY is not set' });
    return;
  }

  if (!AIRTABLE_BASE_ID) {
    console.error('API ROUTE LOG: AIRTABLE_BASE_ID is not set');
    res.status(500).json({ message: 'AIRTABLE_BASE_ID is not set' });
    return;
  }

  console.log('API ROUTE LOG: API Key:', AIRTABLE_API_KEY);  // Log the API key (for testing only, remove in production)
  console.log('API ROUTE LOG: Base ID:', AIRTABLE_BASE_ID);  // Log the Base ID

  const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Tasks`;
  console.log('API ROUTE LOG: API URL:', API_URL);  // Log the API URL

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API ROUTE LOG: Fetch response status:', response.status);  // Log the response status
    const resText = await response.text();
    console.log('API ROUTE LOG: Fetch response text:', resText);  // Log the fetch response text

    if (!response.ok) {
      console.error('API ROUTE LOG: HTTP error! Status:', response.status, 'Description:', resText);
      throw new Error(`HTTP error! Status: ${response.status}, Description: ${resText}`);
    }

    const data = JSON.parse(resText);
    console.log('API ROUTE LOG: Fetched data:', data);  // Log the fetched data

    const tasks = data.records.map((record: any) => ({
      id: record.id,
      createdTime: record.createdTime,
      ...record.fields
    }));

    // console.log('API ROUTE LOG: Mapped tasks:', tasks);  // Log the mapped tasks

    res.status(200).json({ tasks });
  } catch (error: any) {  // Catch block captures any thrown errors
    console.error('Error fetching tasks:', error);  // Log the error

    // Use type guard to check if the error is an instance of Error
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      // If it's not an Error instance, respond with a generic error message
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}
