#!/usr/bin/env tsx
/**
 * Generate News Card Image
 * 
 * Renders HTML template to PNG using Playwright
 * Output: 1200x675 PNG image optimized for X/Twitter
 */

import { chromium, Browser, Page } from 'playwright';
import { readFileSync } from 'fs';
import { join } from 'path';

interface GenerateImageOptions {
  headline: string;
  imageUrl: string;
  publishedAt: string | null;
  siteUrl?: string;
}

/**
 * Format date as DD.MM.YYYY
 */
function formatDate(dateString: string | null): string {
  if (!dateString) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate PNG image from HTML template
 */
export async function generateNewsImage(options: GenerateImageOptions): Promise<Buffer> {
  const { headline, imageUrl, publishedAt, siteUrl = 'https://lankanewsroom.xyz' } = options;

  // Read HTML template
  const templatePath = join(process.cwd(), 'templates', 'news-card.html');
  let htmlTemplate = readFileSync(templatePath, 'utf-8');

  // Replace template variables
  htmlTemplate = htmlTemplate.replace('{{IMAGE_URL}}', escapeHtml(imageUrl));
  htmlTemplate = htmlTemplate.replace('{{HEADLINE}}', escapeHtml(headline));
  htmlTemplate = htmlTemplate.replace('{{DATE}}', formatDate(publishedAt));

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page: Page = await browser.newPage({
      viewport: { width: 1200, height: 675 }
    });

    // Set content and wait for images to load
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle' });

    // Wait a bit more for any background images
    await page.waitForTimeout(1000);

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 675
      }
    });

    return screenshot as Buffer;
  } finally {
    await browser.close();
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: tsx generate-news-image.ts <headline> <imageUrl> [publishedAt]');
    process.exit(1);
  }

  const [headline, imageUrl, publishedAt] = args;

  generateNewsImage({
    headline,
    imageUrl,
    publishedAt: publishedAt || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz'
  })
    .then((buffer) => {
      process.stdout.write(buffer);
    })
    .catch((error) => {
      console.error('Error generating image:', error);
      process.exit(1);
    });
}

