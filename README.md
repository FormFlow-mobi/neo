# neo — Neo4j Knowledge Graph CLI

A TypeScript CLI tool for accessing Neo4j from Claude Code. Create, query, and search knowledge graphs of codebases and external data.

**Ingest your source code with neo**
> neo ingest ./src --lang ts --clear # Clear database before ingestion

## Why Neo?

Neo solves the problem of efficient codebase understanding. Instead of Claude reading entire files and directories (consuming massive token budgets), Neo creates a queryable knowledge graph that lets you ask specific questions like "Find all async error handlers" or "What imports this module?" in seconds. This approach saves 80–95% of tokens on typical queries and enables better architectural insights.

## Why Neo4j?

Neo4j is ideal because code is fundamentally relational—files import modules, classes contain methods, functions call each other. A graph database naturally represents these relationships. Neo4j offers:
- **Speed**: Sub-millisecond queries for complex traversals (vs. slow SQL joins)
- **Expressiveness**: Cypher language is powerful yet readable
- **Scalability**: Performance remains constant as codebases grow
- **Flexibility**: Graph model doesn't require schema redesign as analysis needs evolve
- **Intelligence**: Vector search enables semantic code discovery

In short: **Neo eliminates token waste** through focused querying, and **Neo4j** is the right technology because code is a graph.

## Installation

```bash
git clone https://github.com/FormFlow-mobi/neo.git
cd neo
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
