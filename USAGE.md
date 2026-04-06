# Neo CLI Usage Guide

## Overview

`neo` is a command-line interface for Neo4j that integrates with Claude Code. It allows you to:

1. **Run Cypher queries** directly from the command line
2. **Inspect database schema** (labels, relationships, indexes)
3. **Ingest codebases** as knowledge graphs (AST analysis, imports, function calls)
4. **Search semantically** using embeddings or keyword matching

## Environment Setup

Before using `neo`, configure your Neo4j connection:

```bash
# Option 1: Environment variables
export NEO4J_URI=neo4j://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=your_password
export ANTHROPIC_API_KEY=sk-...

# Option 2: Save to ~/.neo/config.json
neo config --uri neo4j://localhost:7687
neo config --user neo4j
neo config --password your_password

# Test the connection
neo config --test
```

## Command Reference

### 1. Query Cypher (`neo query`)

Execute arbitrary Cypher queries and view results in a table or JSON format.

```bash
# Simple query with table output
neo query "RETURN 1 as ping"

# Match nodes
neo query "MATCH (n:File) RETURN n.name LIMIT 10"

# JSON output for scripting
neo query "MATCH (n) RETURN n LIMIT 5" --format json

# Complex query with relationships
neo query "
  MATCH (f:File)-[:CONTAINS]->(c:Class)-[:CONTAINS]->(m:Function)
  WHERE m.name CONTAINS 'parse'
  RETURN f.name as file, c.name as class, m.name as method
"
```

**Output modes:**
- `--format table` (default): ASCII table with borders
- `--format json`: JSON array of records

### 2. Schema Inspection (`neo schema`)

View the structure of your knowledge graph.

```bash
# All schema information
neo schema

# Only node labels
neo schema --labels

# Only relationship types
neo schema --rels

# Only indexes
neo schema --indexes
```

**Example output:**
```
=== Node Labels ===
File, Class, Function, Variable

=== Relationship Types ===
CONTAINS, IMPORTS, CALLS, EXTENDS

=== Indexes ===
neo_embeddings: [File, Class, Function] [ONLINE]
```

### 3. Code Ingestion (`neo ingest`)

Parse a codebase and create a knowledge graph of files, classes, functions, and relationships.

```bash
# Basic ingestion (TypeScript/JavaScript)
neo ingest ./src

# JavaScript only
neo ingest ./src --lang js

# Clear database before ingestion
neo ingest ./src --clear

# Ingest and show progress
neo ingest /path/to/project --lang ts
# Parsing codebase at /path/to/project...
# Found 425 nodes and 1203 relationships.
# Generating embeddings for 425 nodes...
# Inserting nodes...
# Inserting relationships...
# ✓ Ingestion complete!
```

**What gets created:**

**Nodes:**
- `File` — Source files with `path`, `language` properties
- `Class` — Class definitions with `name`, `file`, `line` properties
- `Function` — Functions and methods with metadata

**Relationships:**
- `CONTAINS` — File contains classes/functions
- `IMPORTS` — File imports modules
- `CALLS` — Call relationships (structural)

**Embeddings:**
Each node gets an `embedding` property (1536-dimensional vector) for semantic search.

### 4. Semantic Search (`neo search`)

Find nodes in the graph using natural language or keywords.

```bash
# Semantic similarity search
neo search "handle errors and exceptions"

# Limit results
neo search "authentication logic" --limit 5

# Filter by node label
neo search "parse" --label Function

# Combined
neo search "database query" --limit 10 --label Class
```

**How it works:**
1. Generates an embedding for your query using Anthropic's API
2. Searches against stored node embeddings using vector similarity
3. Falls back to keyword search if embeddings aren't available

**Output:**
```
name              label      file                  score
────────────────────────────────────────────────────────
parseJSON         Function   src/parser.ts         0.87
parseCSV          Function   src/parser.ts         0.81
jsonParser        Variable   src/config.ts         0.73
```

### 5. Configuration (`neo config`)

Manage Neo4j connection settings.

```bash
# Display current configuration
neo config

# Output:
# Current Neo4j Configuration:
#   URI: neo4j://localhost:7687
#   User: neo4j
#   Password: ***

# Test connection
neo config --test
# ✓ Connected to Neo4j!

# Update settings
neo config --uri neo4j://production:7687
neo config --user admin
neo config --password newpassword
```

## Common Workflows

### Workflow 1: Analyze a Codebase

```bash
# 1. Ingest the codebase
neo ingest ./src --lang ts --clear

# 2. See what was imported
neo query "MATCH (f:File)-[:IMPORTS]->(m) RETURN f.name, m"

# 3. Find all classes and their methods
neo query "
  MATCH (c:Class)-[:CONTAINS]->(m:Function)
  RETURN c.name as class, m.name as method
  ORDER BY c.name
"

# 4. Search for specific patterns
neo search "error handling"
neo search "authentication" --limit 5
```

### Workflow 2: Explore File Dependencies

```bash
# Find files that import a specific module
neo query "
  MATCH (f:File)-[r:IMPORTS]->(m)
  WHERE r.module CONTAINS 'axios'
  RETURN f.name
"

# Find circular dependencies (files importing each other)
neo query "
  MATCH (a:File)-[:IMPORTS]->(b:File)-[:IMPORTS]->(a)
  RETURN a.name, b.name
"

# Most imported modules
neo query "
  MATCH (f:File)-[r:IMPORTS]->(m)
  RETURN m.module, count(*) as imports
  ORDER BY imports DESC
  LIMIT 10
"
```

### Workflow 3: Class Hierarchy Analysis

```bash
# Find all classes in a file
neo query "
  MATCH (f:File {path: 'src/models.ts'})-[:CONTAINS]->(c:Class)
  RETURN c.name
"

# Find methods in a specific class
neo query "
  MATCH (c:Class {name: 'User'})-[:CONTAINS]->(m:Function)
  RETURN m.name, m.line
  ORDER BY m.line
"

# Count methods per class
neo query "
  MATCH (c:Class)-[:CONTAINS]->(m:Function)
  RETURN c.name, count(m) as method_count
  ORDER BY method_count DESC
"
```

### Workflow 4: Create Custom Indexes for Better Search

```bash
# Create a full-text index on function names
neo query "
  CREATE FULLTEXT INDEX fn_names FOR (n:Function) ON (n.name)
"

# Create a vector index for semantic search
neo query "
  CREATE VECTOR INDEX neo_embeddings
  FOR (n:File|Class|Function) ON (n.embedding)
  OPTIONS {indexConfig: {vector.dimensions: 1536}}
"
```

## Integration with Claude Code

Within Claude Code sessions, you can use `neo` to ask Claude questions about your codebase:

```bash
# Step 1: Ingest your project
neo ingest /path/to/your/project --lang ts

# Step 2: Query for insights
neo search "authentication mechanisms"
neo query "MATCH (f:File) WHERE f.name CONTAINS 'auth' RETURN f.name"

# Step 3: Discuss findings with Claude
# Claude can now see the results and provide insights about:
# - Code structure and organization
# - Dependency patterns
# - Potential refactoring opportunities
# - Architecture analysis
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Connection refused` | Check Neo4j is running: `nc -zv localhost 7687` |
| `Authentication failed` | Verify credentials: `neo config --test` |
| `Parsing errors` | Check file paths and language: `neo ingest . --lang js` |
| `No embeddings` | Set `ANTHROPIC_API_KEY` for semantic search |
| `Slow ingestion` | Large repos take time; check Neo4j browser at `http://localhost:7474` |
| `Vector search not working` | Create index: `neo query "CREATE VECTOR INDEX..."` |

## Performance Tips

- **Batch ingestion**: Process large codebases in 1000-line chunks
- **Selective ingestion**: Ignore `node_modules/`, `dist/`, `.git/` (automatic)
- **Vector indexes**: Create VECTOR INDEXes for faster semantic search
- **Query optimization**: Use Cypher LIMIT and WHERE clauses to reduce results
- **Caching**: Results are streamed; use `--format json` for piping

## Advanced Examples

### Find unimported code

```bash
neo query "
  MATCH (f:File)-[:CONTAINS]->(func:Function)
  WHERE NOT (f)-[:IMPORTS]->()
  RETURN f.name, func.name
"
```

### Analyze code complexity

```bash
neo query "
  MATCH (f:File)-[:CONTAINS]->(c:Class)-[:CONTAINS]->(m:Function)
  RETURN f.name, c.name, count(m) as complexity
  ORDER BY complexity DESC
"
```

### Find all async functions

```bash
neo search "async" --label Function --limit 20
```

### Export graph data

```bash
neo query "MATCH (n) RETURN n" --format json > graph.json
```

## Getting Help

```bash
neo --help              # Overall help
neo query --help        # Query command help
neo ingest --help       # Ingest command help
neo search --help       # Search command help
neo config --help       # Config command help
neo schema --help       # Schema command help
```
