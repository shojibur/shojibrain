import { ProjectPresetConfigEntry } from "../types";
export declare function buildProductTemplate(presets: ProjectPresetConfigEntry[]): string;
export declare function buildArchitectureTemplate(presets: ProjectPresetConfigEntry[]): string;
export declare function buildRulesTemplate(presets: ProjectPresetConfigEntry[]): string;
export declare function buildCurrentTemplate(presets: ProjectPresetConfigEntry[]): string;
export declare const featureTemplate = "# Feature: [Name]\n\n## Purpose\n\n## Users / Roles\n\n## Behaviour\n\n## Lifecycle\n\n## Business Rules\n\n## Related Entities\n\n## Related Code\n\n## Related Tests\n\n## Known Limitations\n\n## Future\n";
export declare const specTemplate = "# Specification: [Feature / Change]\n\n## Goal\n\n## Problem\n\n## Requirements\n\n## Acceptance Criteria\n\n## Technical Constraints\n\n## Out of Scope\n\n## Open Questions\n";
export declare const adrTemplate = "# ADR-XXX: [Decision]\n\n## Status\n\n## Context\n\n## Decision\n\n## Alternatives Considered\n\n## Consequences\n";
export declare const agentsSection = "## ShojiBrain\n\nBefore significant implementation:\n1. Read `.shojibrain/CURRENT.md`.\n2. Read relevant product and architecture documentation.\n3. Query ShojiBrain for task-specific context.\n4. Inspect only the necessary implementation files.\n5. Follow `.shojibrain/RULES.md`.\n\nPrefer ShojiBrain context retrieval over blindly reading the entire repository.\n\nAfter significant implementation:\n1. Run relevant tests.\n2. Synchronize ShojiBrain.\n3. Update feature documentation if behavior changed.\n4. Update `.shojibrain/CURRENT.md` when appropriate.\n5. Create an ADR only for meaningful architectural decisions.\n";
export declare function buildPromptTemplate(presets: ProjectPresetConfigEntry[]): string;
//# sourceMappingURL=index.d.ts.map