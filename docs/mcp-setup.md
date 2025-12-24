# Supabase MCP Setup Guide

## Overview

This guide explains how to connect and use Supabase MCP (Model Context Protocol) for database management.

## MCP Configuration

The Supabase MCP server URL for this project:
```
https://mcp.supabase.com/mcp?project_ref=qisxzgzutfspwqmiqbvn
```

## Setting Up MCP in Cursor

### Option 1: Cursor Settings UI

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "MCP" or "Model Context Protocol"
3. Add the Supabase MCP server configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=qisxzgzutfspwqmiqbvn"
    }
  }
}
```

### Option 2: Config File

If Cursor uses a config file, add the MCP server configuration to your Cursor settings JSON.

## Verifying MCP Connection

Once configured, you should be able to:
- Query database tables
- Execute SQL commands
- View schema information
- Manage data through MCP

## Using MCP for Database Work

### Direct SQL Execution

If MCP is properly configured, you can execute SQL directly:

```sql
-- Example: Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Alternative: Supabase SQL Editor

If MCP isn't available, use Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/qisxzgzutfspwqmiqbvn
2. Navigate to **SQL Editor**
3. Copy and paste SQL scripts from `scripts/` folder
4. Click **Run** to execute

## Recommended Workflow

1. **Use MCP** (if available) for quick queries and data inspection
2. **Use SQL Editor** for migrations and bulk operations
3. **Use Scripts** for repeatable operations

## Troubleshooting

### MCP Not Available

If MCP resources aren't showing:
1. Verify MCP server URL is correct
2. Check Cursor settings are saved
3. Restart Cursor
4. Check Supabase project is accessible

### Fallback: Direct SQL

If MCP isn't working, use:
- Supabase SQL Editor (recommended)
- Supabase CLI
- Direct API calls with service role key

## Next Steps

After MCP is configured:
1. Run database migrations (see `docs/database-setup.md`)
2. Seed initial data
3. Verify schema
4. Start using MCP for database queries

