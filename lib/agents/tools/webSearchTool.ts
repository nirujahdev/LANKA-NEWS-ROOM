/**
 * Web Search Tool for AI Agents
 * Allows agents to search the web for images, content, and information
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Tool: Search web for images
 * Uses AI to generate search queries and can be extended with actual web search APIs
 */
export const searchWebForImagesTool = tool({
  name: 'search_web_for_images',
  description: 'Search the web for relevant news images when none are found in articles. Returns array of image URLs with relevance scores. Use this when RSS feeds and article HTML don\'t contain suitable images.',
  parameters: z.object({
    query: z.string().describe('Search query for finding images (e.g., "Sri Lanka economic recovery 2024")'),
    headline: z.string().nullable().optional().describe('Article headline for context'),
    summary: z.string().nullable().optional().describe('Article summary for context'),
    maxResults: z.number().default(5).describe('Maximum number of image URLs to return'),
  }),
  execute: async ({ query, headline, summary, maxResults }) => {
    try {
      // For now, use AI to generate search suggestions
      // In the future, this can be integrated with:
      // - Google Custom Search API
      // - Bing Image Search API
      // - SerpAPI
      // - DuckDuckGo API
      
      const searchPrompt = `Generate ${maxResults} specific web search queries to find relevant news images for this article:
      
Headline: ${headline || 'N/A'}
Summary: ${summary || 'N/A'}
Original Query: ${query}

Return only a JSON array of search query strings, each optimized for finding news images. Focus on:
- Specific events, people, or locations mentioned
- News-related keywords
- Sri Lankan context if relevant

Example format: ["Sri Lanka Prime Minister economic announcement 2024", "Colombo financial district", ...]`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a web search query optimizer. Generate specific, effective search queries for finding news images. Always return valid JSON arrays only.',
          },
          {
            role: 'user',
            content: searchPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      let searchQueries: string[] = [];
      try {
        const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
        if (Array.isArray(response.queries)) {
          searchQueries = response.queries;
        } else if (Array.isArray(response)) {
          searchQueries = response;
        } else {
          // Fallback: use the original query
          searchQueries = [query];
        }
      } catch {
        searchQueries = [query];
      }

      // For now, return search queries as placeholders
      // TODO: Integrate with actual web search API to get real image URLs
      console.log(`[WebSearchTool] Generated ${searchQueries.length} search queries for: ${query}`);
      console.log(`[WebSearchTool] Queries: ${searchQueries.join(', ')}`);
      
      // Return structured response indicating web search was attempted
      // In production, this would return actual image URLs from web search API
      return {
        searchQueries,
        imageUrls: [], // Placeholder - will be populated when web search API is integrated
        count: 0,
        note: 'Web search queries generated. Actual image URLs will be fetched when web search API is integrated.',
        source: 'ai_generated_queries',
      };
    } catch (error) {
      console.error(`[WebSearchTool] Web image search failed:`, error);
      throw new Error(`Web image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Search web for content/information
 * Allows agents to search the web for additional context
 */
export const searchWebForContentTool = tool({
  name: 'search_web_for_content',
  description: 'Search the web for additional information or context about a news topic. Use when you need to verify facts, find related information, or gather more context.',
  parameters: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().default(3).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults }) => {
    try {
      // Similar to image search, generate optimized queries
      // In production, integrate with web search API
      
      console.log(`[WebSearchTool] Content search requested: ${query}`);
      
      return {
        searchQuery: query,
        results: [], // Placeholder - will be populated when web search API is integrated
        count: 0,
        note: 'Web search query generated. Actual results will be fetched when web search API is integrated.',
      };
    } catch (error) {
      console.error(`[WebSearchTool] Web content search failed:`, error);
      throw new Error(`Web content search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

