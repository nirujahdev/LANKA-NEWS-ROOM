import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { env } from '@/lib/env';
import { Database } from '@/lib/supabaseTypes';

type ClusterRow = Database['public']['Tables']['clusters']['Row'];

/**
 * Monthly cleanup cron job.
 * Runs on the 1st of every month to delete clusters older than 30 days.
 * This enforces the 30-day retention policy.
 */
function assertCronAuth(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  return secret === env.CRON_SECRET;
}

export async function GET(req: Request) {
  if (!assertCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate cutoff date: 30 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffISO = cutoffDate.toISOString();

    // Find clusters to delete (older than 30 days)
    const { data: clustersToDelete, error: findError } = await supabaseAdmin
      .from('clusters')
      .select('id')
      .lt('created_at', cutoffISO);

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    const clusterIds = (clustersToDelete || []).map((c) => c.id);
    const count = clusterIds.length;

    if (count === 0) {
      return NextResponse.json({
        message: 'No clusters to delete',
        cutoffDate: cutoffISO,
        deleted: 0
      });
    }

    // Delete related data first (cascade deletes should handle this, but being explicit)
    // Delete summaries
    await supabaseAdmin.from('summaries').delete().in('cluster_id', clusterIds);

    // Delete cluster_articles links
    await supabaseAdmin.from('cluster_articles').delete().in('cluster_id', clusterIds);

    // Update articles to remove cluster_id (or delete articles - depends on policy)
    // For now, we'll just unlink articles from clusters
    await supabaseAdmin.from('articles').update({ cluster_id: null }).in('cluster_id', clusterIds);

    // Finally, delete clusters
    const { error: deleteError } = await supabaseAdmin.from('clusters').delete().in('id', clusterIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      cutoffDate: cutoffISO,
      deleted: count,
      clusterIds: clusterIds.slice(0, 10) // Return first 10 IDs for logging
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

