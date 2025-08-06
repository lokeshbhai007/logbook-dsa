// src/app/api/fetch-title/route.js
import { NextResponse } from 'next/server';
import { getLeetCodeTitle } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { questionNumber } = await request.json();

    if (!questionNumber) {
      return NextResponse.json({ error: 'Question number is required' }, { status: 400 });
    }

    const title = await getLeetCodeTitle(questionNumber);
    
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error fetching title:', error);
    return NextResponse.json({ error: 'Failed to fetch problem title' }, { status: 500 });
  }
}