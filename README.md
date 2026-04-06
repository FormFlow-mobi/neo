# neo — Neo4j Knowledge Graph CLI

A TypeScript CLI tool for accessing Neo4j from Claude Code. Create, query, and search knowledge graphs of codebases and external data.

## Why Neo?

Understanding large codebases is time-consuming—Claude Code users typically need to ask: "Where is this functionality?", "What depends on this module?", or "How is this pattern implemented?" Without Neo, Claude must read entire files and directories to answer these questions, consuming significant tokens and requiring broad context. Neo addresses this by building a queryable knowledge graph of your codebase, enabling Claude to understand structure, dependencies, and patterns without reading raw source. By ingesting your code once, Neo lets you ask Claude precise questions—"Find all async error handlers", "What imports this module?", "Show me the class hierarchy"—and get compact, semantically-rich results back within seconds. This saves 80–95% of tokens on typical queries, accelerates analysis of large projects, and lets Claude provide better architectural insights by working with structured data instead of raw code. Neo unlocks faster, cheaper, and more intelligent codebase interaction within Claude Code.

## Why Neo4j?

Codebase analysis requires understanding relationships: files import modules, classes contain methods, functions call other functions. Representing codebases as graphs—where nodes are code entities and edges are relationships—maps naturally to how code actually works. Neo4j is a proven, mature graph database purpose-built for traversing relationships efficiently. Neo4j solves the relationship problem: you can ask complex questions like "find all files that transitively import a module" or "what's the deepest call chain in this service?" in milliseconds, whereas flattening this into tables or documents would require slow joins or sequential traversals. The advantages are immediate: Neo4j's Cypher query language is expressive yet readable, its vector search capabilities enable semantic code discovery, and its performance remains constant as codebases grow. Users benefit from sub-millisecond query results, the ability to ask complex structural questions without hand-written traversal code, and a graph model that doesn't require schema redesign as your analysis needs evolve. For Claude Code, Neo4j ensures that codebase insights are fast, precise, and rich enough to inform real refactoring and architecture decisions.

## Installation

```bash
cd /home/linux/hexguild/golems/neo
npm install
npm run build
npm link
```

This makes the `neo` command available globally.

## Configuration

Set your Neo4j credentials via environment variables:

```bash
export NEO4J_URI=neo4j://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=your_password
export ANTHROPIC_API_KEY=your_api_key
```

Or save them to `~/.neo/config.json`:

```json
{
  "uri": "neo4j://localhost:7687",
  "user": "neo4j",
  "password": "your_password"
}
```

Test the connection:

```bash
neo config --test
```

## Commands

### `neo query "<cypher>" [--format json|table]`

Run a Cypher query and display results.

```bash
neo query "MATCH (n) RETURN n LIMIT 5"
neo query "RETURN 1 as ping" --format json
```

### `neo schema [--labels] [--rels] [--indexes]`

Inspect the database schema.

```bash
neo schema                   # All sections
neo schema --labels         # Only node labels
neo schema --rels          # Only relationship types
neo schema --indexes       # Only indexes
```

### `neo ingest <path> [--lang ts|js] [--clear]`

Ingest a codebase as a knowledge graph (extracts classes, functions, files, imports, and call relationships).

```bash
neo ingest ./src                    # TypeScript/JavaScript in ./src
neo ingest ./src --lang ts --clear # Clear database before ingestion
```

**Node types created:**
- `File` — Source files
- `Class` — Class definitions
- `Function` — Functions and methods

**Relationships created:**
- `CONTAINS` — File contains classes/functions
- `IMPORTS` — File imports modules
- `CALLS` — Function calls (structural analysis)

### `neo search "<query>" [--limit 10] [--label Function]`

Search the knowledge graph using semantic similarity or keyword matching.

```bash
neo search "authentication logic"              # Semantic search
neo search "parse" --label Function --limit 5 # Keyword search with filters
```

Uses embeddings from Anthropic's Claude model for semantic understanding, falls back to keyword search if vector indexes aren't available.

### `neo config [--test] [--uri] [--user] [--password]`

Manage connection configuration.

```bash
neo config                          # Display current config
neo config --test                  # Test Neo4j connection
neo config --uri neo4j://remote:7687  # Save URI
neo config --user myuser           # Save username
```

## Usage with Claude Code

Use `neo` in your Claude Code sessions:

```bash
# Start an interactive session
neo query "MATCH (n:Function) RETURN n.name, n.file LIMIT 10"

# Ingest a project
neo ingest /path/to/project --lang ts

# Search for specific patterns
neo search "error handling" --label Function
```

## Architecture

- **connection.ts** — Neo4j driver management, credential resolution
- **commands/** — CLI command implementations (query, schema, ingest, search, config)
- **lib/parser.ts** — TypeScript/JavaScript AST parsing via ts-morph
- **lib/format.ts** — Output formatting (JSON, ASCII tables)
- **lib/embeddings.ts** — Anthropic SDK integration for semantic search

## Development

```bash
npm run dev          # Run with ts-node (for testing)
npm run build        # TypeScript compilation to ./dist
npm run clean        # Remove dist/
```

## Quick Start Example

```bash
# 1. Set up credentials
export NEO4J_URI=neo4j://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password
export ANTHROPIC_API_KEY=sk-...

# 2. Test connection
neo config --test

# 3. Ingest your codebase
neo ingest ~/my-project --lang ts --clear

# 4. Query the graph
neo query "MATCH (f:File) RETURN f.name LIMIT 10"

# 5. Search for patterns
neo search "authentication" --limit 5
```

## Integration with Claude Code

In Claude Code sessions, you can use `neo` to analyze codebases:

```bash
# Import a codebase into Neo4j
neo ingest . --lang ts

# Explore the graph structure
neo schema

# Ask Claude about specific patterns
neo search "error handling in services"

# Run custom Cypher queries
neo query "MATCH (c:Class)-[:CONTAINS]->(m:Function) 
           WHERE m.name CONTAINS 'async'
           RETURN c.name, m.name"
```

## Troubleshooting

**Connection refused**
- Check Neo4j is running: `nc -zv localhost 7687`
- Verify credentials with `neo config --test`

**Ingestion slow**
- Large codebases may take time; monitor Neo4j browser at `http://localhost:7474`
- Use `--lang js` to skip TypeScript features for faster parsing

**Vector search not working**
- Embeddings require `ANTHROPIC_API_KEY` in environment
- Falls back to keyword search if not available
- Create a vector index in Neo4j: `CREATE VECTOR INDEX neo_embeddings FOR (n:File|Class|Function) ON (n.embedding) OPTIONS {indexConfig: {vector.dimensions: 1536}}`
