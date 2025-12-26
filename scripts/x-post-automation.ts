#!/usr/bin/env tsx
/**
 * X (Twitter) Posting Automation
 * 
 * Selects one unpublished cluster, generates styled image, and posts to X
 * Uses X API v2 with Bearer token authentication
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/supabaseTypes';
import { generateNewsImage } from './generate-news-image';
import { normalizeTopicSlug } from '../lib/topics';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const X_API_BEARER_TOKEN = process.env.X_API_BEARER_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';

interface Cluster {
  id: string;
  headline: string;
  slug: string;
  topic: string | null;
  image_url: string | null;
  published_at: string | null;
  tweeted_at: string | null;
  tweet_id: string | null;
  tweet_status: string | null;
}

/**
 * Get article URL for a cluster
 */
function getArticleUrl(slug: string, topic: string | null, lang: 'en' | 'si' | 'ta' = 'en'): string {
  const normalizedTopic = normalizeTopicSlug(topic) || 'other';
  return `${SITE_URL}/${lang}/${normalizedTopic}/${slug}`;
}

/**
 * Generate caption for X post
 */
function generateCaption(headline: string, articleUrl: string): string {
  // X limit is 280 characters
  // "Read more 👉 " + URL (typically ~30 chars) = ~40 chars
  // So headline can be max 240 chars
  const maxHeadlineLength = 240;
  const truncatedHeadline = headline.length > maxHeadlineLength
    ? headline.substring(0, maxHeadlineLength - 3) + '...'
    : headline;

  return `${truncatedHeadline}\nRead more 👉 ${articleUrl}`;
}

/**
 * Upload media to X API (v1.1 endpoint for media upload)
 */
async function uploadMedia(imageBuffer: Buffer): Promise<string> {
  // Use form-data package for Node.js
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('media', imageBuffer, {
    filename: 'news-card.png',
    contentType: 'image/png'
  });

  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${X_API_BEARER_TOKEN}`,
      ...formData.getHeaders()
    },
    body: formData as any
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Media upload failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.media_id_string;
}

/**
 * Post tweet to X API v2
 */
async function postTweet(caption: string, mediaId: string): Promise<string> {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${X_API_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: caption,
      media: {
        media_ids: [mediaId]
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tweet post failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.data || !data.data.id) {
    throw new Error(`Invalid response from X API: ${JSON.stringify(data)}`);
  }
  return data.data.id;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting X posting automation...');

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  if (!X_API_BEARER_TOKEN) {
    console.error('❌ Missing X_API_BEARER_TOKEN');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Select cluster to post
    console.log('📊 Selecting cluster to post...');
    
    // First, try to find a cluster with image_url
    let { data: cluster, error } = await supabase
      .from('clusters')
      .select('id, headline, slug, topic, image_url, published_at, tweeted_at, tweet_id, tweet_status')
      .eq('status', 'published')
      .is('tweeted_at', null)
      .not('slug', 'is', null)
      .not('image_url', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(1)
      .single<Cluster>();

    // If no cluster with image_url, try to find one and get image from articles
    if (!cluster || error) {
      console.log('   No cluster with image_url found, checking articles...');
      
      const { data: clusterWithoutImage, error: clusterError } = await supabase
        .from('clusters')
        .select('id, headline, slug, topic, image_url, published_at, tweeted_at, tweet_id, tweet_status')
        .eq('status', 'published')
        .is('tweeted_at', null)
        .not('slug', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(1)
        .single<Cluster>();

      if (clusterError || !clusterWithoutImage) {
        console.log('✅ No clusters to post (all posted or none available)');
        process.exit(0);
      }

      // Get image from first article
      const { data: articles } = await supabase
        .from('articles')
        .select('image_url')
        .eq('cluster_id', clusterWithoutImage.id)
        .not('image_url', 'is', null)
        .limit(1);

      if (articles && articles.length > 0 && articles[0].image_url) {
        cluster = {
          ...clusterWithoutImage,
          image_url: articles[0].image_url
        };
      } else {
        console.log('✅ No clusters with images available to post');
        process.exit(0);
      }
    }

    if (!cluster || !cluster.slug || !cluster.image_url) {
      console.log('✅ No clusters available to post');
      process.exit(0);
    }

    console.log(`✅ Selected cluster: ${cluster.id}`);
    console.log(`   Headline: ${cluster.headline.substring(0, 60)}...`);

    // Step 2: Generate image
    console.log('🎨 Generating news card image...');
    let imageBuffer: Buffer;
    try {
      imageBuffer = await generateNewsImage({
        headline: cluster.headline,
        imageUrl: cluster.image_url,
        publishedAt: cluster.published_at,
        siteUrl: SITE_URL
      });
      console.log('   ✓ Image generated');
    } catch (error) {
      console.error('❌ Failed to generate image:', error);
      // Mark as failed but don't set tweeted_at so it can be retried
      await supabase
        .from('clusters')
        .update({ tweet_status: 'failed' })
        .eq('id', cluster.id);
      process.exit(1);
    }

    // Step 3: Generate caption
    const articleUrl = getArticleUrl(cluster.slug, cluster.topic, 'en');
    const caption = generateCaption(cluster.headline, articleUrl);
    console.log('📝 Caption generated');

    // Step 4: Upload media and post to X
    console.log('📤 Posting to X...');
    let tweetId: string;

    try {
      // Upload media (imageBuffer is already a Buffer)
      const mediaId = await uploadMedia(imageBuffer);
      console.log(`   ✓ Media uploaded (ID: ${mediaId})`);

      // Post tweet
      tweetId = await postTweet(caption, mediaId);
      console.log(`   ✓ Tweet posted (ID: ${tweetId})`);
    } catch (error) {
      console.error('❌ Failed to post to X:', error);
      
      // Mark as failed but don't set tweeted_at so it can be retried
      await supabase
        .from('clusters')
        .update({ tweet_status: 'failed' })
        .eq('id', cluster.id);
      process.exit(1);
    }

    // Step 5: Update database
    console.log('💾 Updating database...');
    const { error: updateError } = await supabase
      .from('clusters')
      .update({
        tweeted_at: new Date().toISOString(),
        tweet_id: tweetId,
        tweet_status: 'posted'
      })
      .eq('id', cluster.id);

    if (updateError) {
      console.error('❌ Failed to update database:', updateError);
      process.exit(1);
    }

    console.log('✅ Successfully posted to X!');
    console.log(`   Tweet ID: ${tweetId}`);
    console.log(`   URL: ${articleUrl}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

