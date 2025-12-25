import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clusterId, feedbackType, reason, comment, userId } = body;
    
    if (!clusterId || !feedbackType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const validTypes = ['like', 'dislike', 'report', 'helpful', 'not_helpful'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }
    
    // Insert feedback (userId can be null for anonymous)
    const { data: feedback, error: insertError } = await supabaseAdmin
      .from('user_feedback')
      .upsert({
        cluster_id: clusterId,
        user_id: userId || null,
        feedback_type: feedbackType,
        reason: reason || null,
        comment: comment || null
      }, {
        onConflict: 'cluster_id,user_id,feedback_type'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Feedback insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit feedback' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clusterId = searchParams.get('clusterId');
    const userId = searchParams.get('userId');
    
    if (!clusterId) {
      return NextResponse.json({ error: 'Missing clusterId' }, { status: 400 });
    }
    
    // Get user feedback for this cluster
    const query = supabaseAdmin
      .from('user_feedback')
      .select('feedback_type')
      .eq('cluster_id', clusterId);
    
    const { data: userFeedback } = userId 
      ? await query.eq('user_id', userId)
      : await query.is('user_id', null);
    
    // Get aggregate counts
    const { data: cluster } = await supabaseAdmin
      .from('clusters')
      .select('like_count, report_count, helpful_count')
      .eq('id', clusterId)
      .single();
    
    return NextResponse.json({
      userFeedback: userFeedback || [],
      counts: {
        likes: cluster?.like_count || 0,
        reports: cluster?.report_count || 0,
        helpful: cluster?.helpful_count || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get feedback' 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

