export const productTemplate = `# Product

Use this file for human-maintained product truth. Keep it concise, concrete, and current.

## Product Name
[Replace with project name]

## Vision
Describe what this product should enable for users in 2-4 sentences.

Example:
This product helps operations teams manage recurring internal workflows without relying on spreadsheets and manual follow-up.

## Problem
What problem exists today? What is painful, slow, error-prone, or expensive?

## Target Users
- Primary users:
- Secondary users:
- Internal stakeholders:

## Core User Journey
Describe the main happy path from the user's perspective.

Example:
1. User signs in
2. User creates or updates a record
3. System validates and stores the change
4. User sees updated status and can continue the workflow

## Core Features
- [Feature name]: [one-line description]
- [Feature name]: [one-line description]
- [Feature name]: [one-line description]

## Business Rules
- [Rule]
- [Rule]
- [Rule]

Only include real business constraints, not implementation details.

## MVP Scope
- In scope:
- In scope:
- In scope:

## Out of Scope
- Not in scope:
- Not in scope:

## Future Ideas
- Possible future direction:
- Possible future direction:
`;

export const architectureTemplate = `# Architecture

Use this file for stable architectural guidance. Update it when system structure or constraints materially change.

## Technology Stack
- Frontend:
- Backend:
- Database:
- Queue / jobs:
- Infrastructure / hosting:

## Application Structure
Describe the major top-level folders, services, or packages and what each owns.

Example:
- \`src/app\`: application entrypoints and routing
- \`src/modules\`: feature modules and business logic
- \`src/lib\`: shared utilities and infrastructure code

## Frontend Architecture
- UI framework:
- State management:
- Routing approach:
- Data fetching approach:
- Shared UI patterns:

## Backend Architecture
- API style:
- Service boundaries:
- Validation approach:
- Domain logic location:
- External integrations:

## Database
- Database technology:
- Core entities:
- Migration workflow:
- ORM / query layer:

## Authentication
- Auth provider:
- Session/token model:
- Login flow:

## Authorization
- Role model:
- Permission checks:
- Sensitive actions requiring explicit checks:

## API Conventions
- Request validation:
- Response shape:
- Error response conventions:
- Versioning strategy:

## Error Handling
- Expected error categories:
- Logging expectations:
- User-facing error handling:

## Background Jobs / Queue
- Job system:
- Retry strategy:
- Idempotency expectations:

## Caching
- Cache layers:
- Cache invalidation notes:

## File Storage
- Storage provider:
- Upload rules:
- Access control:

## Testing
- Unit test scope:
- Integration test scope:
- End-to-end test scope:
- Required checks before merge:

## Security
- Secrets handling:
- Input validation expectations:
- Audit / compliance concerns:

## Performance
- Known bottlenecks:
- Latency-sensitive paths:
- Scaling constraints:

## Important Constraints
- Constraint:
- Constraint:
- Constraint:
`;

export const rulesTemplate = `# Rules

These rules are for coding agents and contributors working in this repository.

- Understand the request before changing code.
- Read relevant ShojiBrain documentation before significant implementation.
- Inspect existing patterns before inventing new ones.
- Do not modify unrelated code.
- Prefer existing abstractions over parallel ones.
- Avoid unnecessary dependencies and broad refactors.
- Validate untrusted input and handle failures explicitly.
- Check authentication and authorization when behavior touches protected actions.
- Do not expose secrets, tokens, or private configuration.
- Database schema changes require explicit migrations.
- Bug fixes should include regression coverage when practical.
- Do not weaken tests merely to make them pass.
- Run the most relevant tests or checks for the change.
- Document architectural changes and meaningful decisions.
- Update current project state when behavior or priorities materially change.

## Change Workflow

Before substantial implementation:
1. Read \`CURRENT.md\`.
2. Read only the relevant product and architecture documentation.
3. Query ShojiBrain context for the requested task.
4. Inspect the minimum necessary implementation files.

After substantial implementation:
1. Run relevant tests or validation commands.
2. Run \`shojibrain sync\`.
3. Update docs if user-visible behavior or architecture changed.

## Code Review Expectations

- Prefer small, targeted changes.
- Keep naming aligned with existing code.
- Avoid speculative refactors unless the task requires them.
- Leave clear boundaries between product logic, infrastructure, and UI concerns.
`;

export const currentTemplate = `# Current Project State

Keep this short. It should reflect the current working reality of the project, not a historical archive.

## Current Goal
[What is the team trying to achieve right now?]

## Active Feature
[What feature or area is currently being changed?]

## In Progress
- [Current work item]
- [Current work item]

## Recently Completed
- [Recently finished item]

## Next
- [Likely next step]

## Known Issues
- [Known issue]

## Blockers
- [Blocking dependency or empty]

## Recent Decisions
- [Decision worth remembering during current work]
`;

export const featureTemplate = `# Feature: [Name]

## Purpose

## Users / Roles

## Behaviour

## Lifecycle

## Business Rules

## Related Entities

## Related Code

## Related Tests

## Known Limitations

## Future
`;

export const specTemplate = `# Specification: [Feature / Change]

## Goal

## Problem

## Requirements

## Acceptance Criteria

## Technical Constraints

## Out of Scope

## Open Questions
`;

export const adrTemplate = `# ADR-XXX: [Decision]

## Status

## Context

## Decision

## Alternatives Considered

## Consequences
`;

export const agentsSection = `## ShojiBrain

Before significant implementation:
1. Read \`.shojibrain/CURRENT.md\`.
2. Read relevant product and architecture documentation.
3. Query ShojiBrain for task-specific context.
4. Inspect only the necessary implementation files.
5. Follow \`.shojibrain/RULES.md\`.

Prefer ShojiBrain context retrieval over blindly reading the entire repository.

After significant implementation:
1. Run relevant tests.
2. Synchronize ShojiBrain.
3. Update feature documentation if behavior changed.
4. Update \`.shojibrain/CURRENT.md\` when appropriate.
5. Create an ADR only for meaningful architectural decisions.
`;

export const promptTemplate = `# ShojiBrain Prompt Template

Use this with Codex, Claude, Cursor, Cline, or another coding agent after running ShojiBrain.

## Recommended Workflow

1. Run:
\`\`\`bash
shojibrain context "your task here"
\`\`\`

2. Paste the ShojiBrain context into your coding agent.

3. Use a prompt like this:

\`\`\`text
I need to make this change:
[describe the task]

Use the ShojiBrain context below before making changes.
Follow .shojibrain/RULES.md.
Inspect only the files necessary for this task.
Do not modify unrelated code.
Prefer existing patterns and abstractions.
Run the most relevant tests or checks after implementation.
If behavior or architecture changes, update the relevant ShojiBrain docs.

ShojiBrain context:
[paste output of shojibrain context "..."]
\`\`\`

## Short Version

\`\`\`text
Use ShojiBrain context for this task first. Follow .shojibrain/RULES.md. Make only the necessary code changes. Run relevant tests. Update ShojiBrain docs if behavior or architecture changed.
\`\`\`
`;
