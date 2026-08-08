# ShojiBrain

ShojiBrain is a local-first AI codebase intelligence CLI for software projects.

It sits between your repository and coding agents, giving them structured, reusable project context instead of forcing repeated full-repo scans.

## What It Does

ShojiBrain helps agents and developers retrieve:

- product context
- architecture rules
- project state
- modules and files
- imports and dependencies
- exported symbols
- related tests
- feature and specification docs

It is currently strongest on JavaScript and TypeScript repositories.

## Install

### From GitHub

```bash
npm install -g git+https://github.com/shojibur/shojibrain.git
```

### Local development

```bash
git clone https://github.com/shojibur/shojibrain.git
cd shojibrain
npm install
npm run build
npm link
```

## Verify Install

```bash
shojibrain --help
```

## Use In Any Project

Go into your target repository:

```bash
cd /path/to/your/project
```

Initialize ShojiBrain:

```bash
shojibrain init
```

Run the first scan:

```bash
shojibrain scan
```

Ask for task-specific context:

```bash
shojibrain context "add subscription cancellation"
```

Check project status:

```bash
shojibrain status
```

Validate setup:

```bash
shojibrain doctor
```

Refresh maps after changes:

```bash
shojibrain sync
```

## What `init` Creates

Inside the target project, ShojiBrain creates:

```text
.shojibrain/
├── PRODUCT.md
├── ARCHITECTURE.md
├── RULES.md
├── CURRENT.md
├── features/
├── specs/
├── decisions/
├── tasks/
└── map/
    ├── project.json
    ├── files.json
    ├── modules.json
    ├── symbols.json
    ├── dependencies.json
    └── tests.json
```

It also:

- creates `.shojibrain-cache/`
- adds `.shojibrain-cache/` to `.gitignore`
- creates or updates `AGENTS.md`

## What To Commit In Your Real Project

Commit these:

- `.shojibrain/`
- `AGENTS.md`
- `.gitignore` updates

Do not commit:

- `.shojibrain-cache/`

## Commands

### `shojibrain init`

Creates ShojiBrain docs, directories, map structure, cache directory, `.gitignore` entry, and `AGENTS.md` integration.

### `shojibrain scan`

Scans a JS/TS repository and writes compact project maps under `.shojibrain/map/`.

### `shojibrain context "<request>"`

Returns ranked context for a coding task using docs plus indexed project structure.

JSON output:

```bash
shojibrain context "add billing portal" --json
```

### `shojibrain status`

Shows initialization state, scan counts, documentation presence, and working tree changes.

JSON output:

```bash
shojibrain status --json
```

### `shojibrain doctor`

Checks whether required docs, map files, cache directory, and agent integration are present and readable.

### `shojibrain sync`

Refreshes ShojiBrain after code changes.

Current behavior in V0.1:

- rescans the repository
- updates files, symbols, dependencies, and tests

## Current Scope

Implemented and usable now:

- local-first CLI
- idempotent initialization
- AST-based JS/TS scanning
- structured map persistence
- deterministic ranked context retrieval
- status and validation commands

Not yet implemented:

- true incremental indexing
- embeddings or semantic retrieval
- non-JS/TS deep language support
- MCP server integration

## Example Workflow

```bash
cd my-app
shojibrain init
shojibrain scan
shojibrain context "add quote expiration"
```

## Development

```bash
npm install
npm run check
npm run build
```
