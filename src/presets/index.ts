import { ProjectConfig, ProjectPresetConfigEntry } from "../types";

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  productHints: string[];
  architectureHints: string[];
  rules: string[];
  currentHints: string[];
}

export interface RequestedPreset {
  id: string;
  scope: string;
}

const presetDefinitions: PresetDefinition[] = [
  {
    id: "laravel",
    label: "Laravel",
    description: "PHP Laravel application or API",
    productHints: [
      "Document major user-facing workflows that cross controllers, services, jobs, and notifications.",
      "Call out business rules enforced in policies, form requests, domain services, or queued jobs.",
    ],
    architectureHints: [
      "Record which logic belongs in controllers, service classes, actions, listeners, jobs, policies, and Eloquent models.",
      "Describe queue usage, scheduled tasks, events, notifications, and migration expectations.",
    ],
    rules: [
      "Keep controllers thin and move reusable business logic into services, actions, or domain classes.",
      "Validate request input explicitly and use policies or gates for protected actions.",
      "Schema changes require migrations and backward-compatible rollout thinking.",
    ],
    currentHints: [
      "Track active feature work across routes, controllers, jobs, notifications, and database changes.",
    ],
  },
  {
    id: "react-native",
    label: "React Native",
    description: "React Native mobile application",
    productHints: [
      "Document the main mobile user journeys, offline expectations, and device-specific constraints.",
      "Call out platform differences between iOS and Android when behavior diverges.",
    ],
    architectureHints: [
      "Describe navigation structure, state management, API integration, local persistence, and native module usage.",
      "Document design system expectations for screens, spacing, typography, components, and theming.",
    ],
    rules: [
      "Preserve platform consistency and test changes on both iOS and Android when relevant.",
      "Keep business logic out of presentational components where practical.",
      "Treat performance-sensitive lists, rendering, and bridge/native interactions carefully.",
    ],
    currentHints: [
      "Track the active screens, flows, and platform-specific regressions being worked on.",
    ],
  },
  {
    id: "nextjs",
    label: "Next.js",
    description: "Next.js web application",
    productHints: [
      "Document key user flows, route groups, authenticated areas, and SEO-sensitive surfaces.",
    ],
    architectureHints: [
      "Describe app/router structure, server vs client component boundaries, data fetching, caching, and mutation patterns.",
      "Record design system conventions and shared layout/component ownership.",
    ],
    rules: [
      "Respect server/client component boundaries and avoid unnecessary client-side work.",
      "Keep route conventions and shared UI patterns consistent.",
      "Be explicit about caching, revalidation, and authenticated data access.",
    ],
    currentHints: [
      "Track active route segments, shared UI changes, and API/data dependencies.",
    ],
  },
  {
    id: "node-api",
    label: "Node API",
    description: "Backend API or service in Node.js/TypeScript",
    productHints: [
      "Document external consumers, contract expectations, and domain-specific invariants.",
    ],
    architectureHints: [
      "Describe API boundaries, validation, authorization, persistence, queues, observability, and deployment constraints.",
    ],
    rules: [
      "Validate untrusted input at boundaries and keep domain logic separate from transport details.",
      "Design handlers and background jobs to be idempotent when possible.",
      "Log and surface failures in a way that supports production debugging.",
    ],
    currentHints: [
      "Track active endpoints, schema changes, integrations, and production issues.",
    ],
  },
  {
    id: "wordpress-plugin",
    label: "WordPress Plugin",
    description: "WordPress plugin codebase",
    productHints: [
      "Document what the plugin adds for site admins, editors, or visitors and how it integrates with WordPress lifecycle hooks.",
    ],
    architectureHints: [
      "Describe hook registration, admin pages, shortcode/block integration, database usage, and settings storage.",
      "Record compatibility constraints for WordPress and PHP versions.",
    ],
    rules: [
      "Use WordPress escaping, sanitization, nonce, and capability checks consistently.",
      "Avoid direct database writes without clear migration/upgrade handling.",
      "Keep plugin behavior compatible with common WordPress hosting assumptions.",
    ],
    currentHints: [
      "Track active plugin features, admin UX changes, and hook-level compatibility concerns.",
    ],
  },
  {
    id: "wordpress-theme",
    label: "WordPress Theme",
    description: "WordPress theme codebase",
    productHints: [
      "Document layout goals, content model assumptions, and editorial workflows supported by the theme.",
    ],
    architectureHints: [
      "Describe template hierarchy usage, block/theme customization, asset pipeline, and design system choices.",
      "Record which theme behavior is controlled by customizer settings, theme.json, blocks, or PHP templates.",
    ],
    rules: [
      "Keep theme behavior aligned with WordPress template and block conventions.",
      "Protect performance by being conservative with asset loading and query customization.",
      "Preserve accessibility and editor compatibility when changing templates or components.",
    ],
    currentHints: [
      "Track current layout work, template changes, block styling, and editor-facing issues.",
    ],
  },
  {
    id: "design-system",
    label: "Design System",
    description: "Shared UI component library or design system",
    productHints: [
      "Document which products consume the system and the level of consistency expected across them.",
    ],
    architectureHints: [
      "Describe token ownership, component layers, accessibility standards, theming, and release/versioning workflow.",
    ],
    rules: [
      "Prefer reusable primitives and tokens over one-off styling.",
      "Preserve accessibility, visual consistency, and backwards compatibility for shared components.",
      "Document any component API changes that affect downstream consumers.",
    ],
    currentHints: [
      "Track active component work, token changes, visual QA needs, and downstream adoption concerns.",
    ],
  },
];

const presetMap = new Map(presetDefinitions.map((preset) => [preset.id, preset]));

export function listPresetDefinitions(): PresetDefinition[] {
  return [...presetDefinitions];
}

export function getPresetDefinition(id: string): PresetDefinition | undefined {
  return presetMap.get(id);
}

export function parsePresetInputs(values: string[]): RequestedPreset[] {
  const expanded = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return expanded.map((entry) => {
    const [rawId, rawScope] = entry.split(":");
    const id = rawId?.trim();
    if (!id) {
      throw new Error(`Invalid preset entry: "${entry}"`);
    }
    if (!getPresetDefinition(id)) {
      throw new Error(`Unknown preset "${id}". Use \`shojibrain init --list-presets\` to see valid presets.`);
    }
    return {
      id,
      scope: normalizeScope(rawScope?.trim() || "."),
    };
  });
}

export function resolvePresetConfigEntries(requested: RequestedPreset[]): ProjectPresetConfigEntry[] {
  const deduped = new Map<string, ProjectPresetConfigEntry>();
  for (const item of requested) {
    const preset = getPresetDefinition(item.id);
    if (!preset) continue;
    const key = `${preset.id}:${item.scope}`;
    deduped.set(key, {
      id: preset.id,
      label: preset.label,
      scope: item.scope,
      description: preset.description,
    });
  }
  return Array.from(deduped.values());
}

export function buildProjectConfig(presets: ProjectPresetConfigEntry[]): ProjectConfig {
  return {
    schemaVersion: 1,
    initializedAt: new Date().toISOString(),
    presets,
  };
}

export function buildPresetSummary(presets: ProjectPresetConfigEntry[]): string {
  if (presets.length === 0) {
    return "No presets selected. Add general project guidance manually.";
  }
  return presets
    .map((preset) => `- ${preset.label} (\`${preset.id}\`) scoped to \`${preset.scope}\`: ${preset.description}`)
    .join("\n");
}

export function buildPresetGuidanceSection(
  presets: ProjectPresetConfigEntry[],
  type: "product" | "architecture" | "rules" | "current",
): string {
  if (presets.length === 0) {
    return "";
  }

  const lines = ["## Preset Guidance", ""];
  for (const presetEntry of presets) {
    const preset = getPresetDefinition(presetEntry.id);
    if (!preset) continue;
    const items = type === "product"
      ? preset.productHints
      : type === "architecture"
        ? preset.architectureHints
        : type === "rules"
          ? preset.rules
          : preset.currentHints;
    lines.push(`### ${preset.label} (${presetEntry.scope})`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function normalizeScope(scope: string): string {
  if (!scope || scope === "./") return ".";
  return scope.replace(/\/+$/, "") || ".";
}
