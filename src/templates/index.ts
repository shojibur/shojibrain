export const productTemplate = `# Product

## Product Name

## Vision

## Problem

## Target Users

## Core User Journey

## Core Features

## Business Rules

## MVP Scope

## Out of Scope

## Future Ideas
`;

export const architectureTemplate = `# Architecture

## Technology Stack

## Application Structure

## Frontend Architecture

## Backend Architecture

## Database

## Authentication

## Authorization

## API Conventions

## Error Handling

## Background Jobs / Queue

## Caching

## File Storage

## Testing

## Security

## Performance

## Important Constraints
`;

export const rulesTemplate = `# Rules

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
`;

export const currentTemplate = `# Current Project State

## Current Goal

## Active Feature

## In Progress

## Recently Completed

## Next

## Known Issues

## Blockers

## Recent Decisions
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
