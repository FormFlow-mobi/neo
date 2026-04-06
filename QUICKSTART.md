# Neo CLI — Quick Start

## ✅ Installation Complete

The `neo` CLI tool is installed and ready to use. You can call it globally:

```bash
neo --help
neo query --help
neo ingest --help
neo search --help
neo schema --help
neo config --help
```

## 🔧 Setup (5 minutes)

### 1. Set Neo4j Credentials

Choose one method:

**Method A: Environment variables (recommended)**
```bash
export NEO4J_URI=neo4j://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=your_password_here
export ANTHROPIC_API_KEY=sk-...
```

**Method B: Save to config file**
```bash
neo config --uri neo4j://localhost:7687
neo config --user neo4j
neo config --password your_password
```

### 2. Verify Connection

```bash
neo config --test
# Output: ✓ Connected to Neo4j!
```

## 🚀 5-Minute Tutorial

### Step 1: Ingest a Codebase

```bash
neo ingest ./src --lang ts --clear
# Found 425 nodes and 1203 relationships.
# Generating embeddings for 425 nodes...
# ✓ Ingestion complete!
```

### Step 2: Explore the Schema

```bash
neo schema
```

### Step 3: Query the Graph

```bash
neo query "MATCH (f:File) RETURN f.name LIMIT 10"
```

### Step 4: Search for Patterns

```bash
neo search "error handling" --limit 5
neo search "authentication" --label Function
```

## 📋 Common Commands

| Task | Command |
|------|---------|
| Ingest TypeScript project | `neo ingest ./src --lang ts` |
| Ingest JavaScript project | `neo ingest ./src --lang js` |
| Show all labels | `neo schema --labels` |
| Find files with "auth" | `neo search "authentication"` |
| List 20 functions | `neo query "MATCH (f:Function) RETURN f.name LIMIT 20"` |
| Get JSON output | `neo query "RETURN 1" --format json` |
| Clear database | `neo query "MATCH (n) DETACH DELETE n"` |

## 📚 Documentation

- **README.md** — Features and overview
- **USAGE.md** — Comprehensive guide with examples
- **IMPLEMENTATION.md** — Technical architecture details

## 💡 Use with Claude Code

In any Claude Code session:

```bash
# Ingest your project
neo ingest /path/to/your/project --lang ts

# Ask Claude about the codebase
neo schema

# Search for specific patterns
neo search "middleware implementations"

# Claude can now analyze and discuss your code structure
```

## 🔗 Integration Points

- **Query execution:** Run any Cypher query
- **Schema inspection:** Understand graph structure  
- **Semantic search:** Find code patterns by meaning
- **Code analysis:** AST-based code graph
- **Embeddings:** 1536-dimensional vectors for similarity

## ⚙️ Configuration Files

```
~/.neo/config.json          # Saved credentials and settings
.env                        # Local environment file (create as needed)
```

Example `.env`:
```
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret
ANTHROPIC_API_KEY=sk-...
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Start Neo4j: `docker run -d -p 7474:7474 -p 7687:7687 neo4j:latest` |
| `Authentication failed` | Run: `neo config --test` |
| `Command not found` | Install: `npm link` from neo directory |
| `Slow ingestion` | Monitor Neo4j at `http://localhost:7474` |

## 📖 Next Steps

1. ✅ Configure Neo4j (already done above)
2. ✅ Test connection (`neo config --test`)
3. Choose a project to analyze
4. Ingest it: `neo ingest /path/to/project --lang ts`
5. Explore with `neo query` and `neo search`
6. Use Claude Code to analyze results

## 🎯 Examples

### Analyze Your Project
```bash
neo ingest . --clear
neo schema
neo query "MATCH (c:Class)-[:CONTAINS]->(m:Function) RETURN c.name, count(m) as methods ORDER BY methods DESC"
```

### Find Code Patterns
```bash
neo search "error handling"
neo search "async operations" --label Function
neo search "database connection" --limit 10
```

### Understand Dependencies
```bash
neo query "MATCH (f:File)-[:IMPORTS]->(m) RETURN f.name, m.module"
neo query "MATCH (f1:File)-[:IMPORTS]->(f2:File)-[:IMPORTS]->(f1) RETURN f1.name, f2.name"
```

---

**Ready to use!** Start with `neo config --test` to verify your Neo4j connection.
