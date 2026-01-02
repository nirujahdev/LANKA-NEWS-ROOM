/**
 * AI News Agent Pipeline Script
 * 
 * This script runs the AI News Agent Pipeline which uses AI agents
 * for all processing tasks (summary, translation, SEO, image, category).
 * 
 * Usage:
 *   npx tsx scripts/ai-agent-pipeline.ts
 * 
 * Environment Variables:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 *   - OPENAI_API_KEY: Your OpenAI API key
 *   - AGENT_ENABLED: Enable agents (default: false)
 *   - AGENT_ROLLOUT_PERCENTAGE: Percentage of traffic to route to agents (0-100)
 *   - AGENT_USE_FOR_COMPLEX: Use agents for complex cases (default: true)
 */

import { runAIAgentPipeline } from '../lib/aiNewsAgentPipeline';

async function main() {
  console.log('🤖 AI News Agent Pipeline');
  console.log('========================\n');

  try {
    const stats = await runAIAgentPipeline();

    console.log('\n📊 Pipeline Statistics:');
    console.log('========================');
    console.log(`Clusters Processed:     ${stats.clustersProcessed}`);
    console.log(`Summaries Generated:    ${stats.summariesGenerated}`);
    console.log(`Translations Generated: ${stats.translationsGenerated}`);
    console.log(`SEO Generated:          ${stats.seoGenerated}`);
    console.log(`Images Selected:        ${stats.imagesSelected}`);
    console.log(`Categories Assigned:    ${stats.categoriesAssigned}`);
    console.log(`Agent Operations:       ${stats.agentOperations}`);
    console.log(`Errors:                 ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.stage}] ${error.clusterId || 'N/A'}: ${error.message}`);
      });
    }

    if (stats.runId) {
      console.log(`\n✅ Pipeline completed successfully (Run ID: ${stats.runId})`);
    } else {
      console.log('\n✅ Pipeline completed successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main();

