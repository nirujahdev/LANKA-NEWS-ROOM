import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic } = body;
    const authHeader = req.headers.get('authorization');

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current preferences
    const { data: prefs } = await supabaseAdmin
      .from('user_preferences')
      .select('favourite_topics')
      .eq('user_id', user.id)
      .single();

    const currentTopics = (prefs?.favourite_topics || []) as string[];
    
    // Add topic if not already present
    if (!currentTopics.includes(topic)) {
      const updatedTopics = [...currentTopics, topic].slice(0, 3); // Max 3 topics
      
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          favourite_topics: updatedTopics,
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true, following: true });
  } catch (error: any) {
    console.error('Follow topic error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to follow topic' 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const authHeader = req.headers.get('authorization');

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current preferences
    const { data: prefs } = await supabaseAdmin
      .from('user_preferences')
      .select('favourite_topics')
      .eq('user_id', user.id)
      .single();

    const currentTopics = (prefs?.favourite_topics || []) as string[];
    const updatedTopics = currentTopics.filter(t => t !== topic);

    await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        favourite_topics: updatedTopics,
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true, following: false });
  } catch (error: any) {
    console.error('Unfollow topic error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to unfollow topic' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ topics: [] });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ topics: [] });
    }

    const { data: prefs } = await supabaseAdmin
      .from('user_preferences')
      .select('favourite_topics')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ 
      topics: (prefs?.favourite_topics || []) as string[]
    });
  } catch (error: any) {
    console.error('Get followed topics error:', error);
    return NextResponse.json({ topics: [] });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

