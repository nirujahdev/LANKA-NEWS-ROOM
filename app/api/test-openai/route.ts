import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if API key is configured
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
      return NextResponse.json(
        {
          success: false,
          error: 'OPENAI_API_KEY not configured',
          message: 'Please set OPENAI_API_KEY in your environment variables'
        },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Test with a simple completion
    const testPrompt = 'Say "OpenAI connection successful" in one sentence.';
    
    const startTime = Date.now();
    const completion = await client.chat.completions.create({
      model: env.SUMMARY_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: testPrompt
        }
      ],
      max_tokens: 50,
      temperature: 0.2
    });

    const responseTime = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content?.trim() || 'No response';

    return NextResponse.json({
      success: true,
      message: 'OpenAI connection successful',
      details: {
        model: env.SUMMARY_MODEL || 'gpt-4o-mini',
        response: response,
        responseTime: `${responseTime}ms`,
        apiKeyConfigured: true,
        apiKeyLength: env.OPENAI_API_KEY.length,
        apiKeyPrefix: env.OPENAI_API_KEY.substring(0, 7) + '...'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'OpenAI connection failed',
        message: error.message || 'Unknown error',
        details: {
          errorType: error.constructor.name,
          ...(error.response && {
            status: error.response.status,
            statusText: error.response.statusText
          })
        }
      },
      { status: 500 }
    );
  }
}

