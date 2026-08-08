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

If you use Volta and the `git+https` install ends with a Volta manifest error, use the tarball flow instead:

```bash
git clone https://github.com/shojibur/shojibrain.git
cd shojibrain
npm pack
npm install -g ./shojibrain-1.0.0.tgz
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

Initialize with one or more presets:

```bash
shojibrain init --preset laravel
shojibrain init --preset wordpress-plugin
shojibrain init --preset laravel:. --preset react-native:mobile
```

List available presets:

```bash
shojibrain init --list-presets
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
├── PROMPT_TEMPLATE.md
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
- stores selected project presets in `.shojibrain/project.config.json`

## What To Fill In After `init`

You should edit these human-maintained files:

- `.shojibrain/PRODUCT.md`
- `.shojibrain/ARCHITECTURE.md`
- `.shojibrain/RULES.md`
- `.shojibrain/CURRENT.md`

You can also use:

- `.shojibrain/PROMPT_TEMPLATE.md`

The code maps update from `scan` and `sync`, but product intent, architecture guidance, and current priorities should be updated by you when they change.

## Presets

ShojiBrain can initialize projects with one or more scoped presets so mixed repositories stay simple.

Examples:

- Laravel app at repo root:
  `shojibrain init --preset laravel`
- React Native app in a subfolder:
  `shojibrain init --preset react-native:mobile`
- Laravel at root and React Native inside `mobile/`:
  `shojibrain init --preset laravel:. --preset react-native:mobile`
- WordPress plugin:
  `shojibrain init --preset wordpress-plugin`
- WordPress theme:
  `shojibrain init --preset wordpress-theme`
- Shared UI library:
  `shojibrain init --preset design-system`

Current built-in presets:

- `laravel`
- `react-native`
- `nextjs`
- `node-api`
- `wordpress-plugin`
- `wordpress-theme`
- `design-system`

Preset guidance is applied automatically when ShojiBrain creates new docs. Existing docs are preserved, so rerunning `init` updates `project.config.json` but does not rewrite your manual documentation.

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
