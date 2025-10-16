#!/usr/bin/env tsx
// refactor.ts
// Build a refactor-ready feature.txt for **every** directory under a given app folder
// that contains a page.tsx. For each page folder:
// - Start at <folder>/page.tsx
// - Follow **transitive** static imports (and re-exports) whose **resolved path**
//   contains a path segment named "components" (component → component chains).
// - **Ignore** any import that starts with "@/". Do not resolve/include them.
// - Resolve relative paths and tsconfig "paths" best-effort (still ignoring "@/").
// - Idempotently insert `//@see types.gen.ts` above every `import type ...;` block.
// - Write <folder>/feature.txt next to <folder>/page.tsx.
//
// Usage:
//   tsx refactor.ts <app-folder>
//
// Example:
//   tsx refactor.ts 'apps/frontend/src/app'

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import process from 'node:process';

type TsConfig = {
    compilerOptions?: {
        baseUrl?: string;
        paths?: Record<string, string[]>;
    };
};

const PAGE_NAME = 'page.tsx';
const OUTPUT_NAME = 'feature.txt';

function getRepoRoot(startDir: string): string {
    try {
        const out = execSync('git rev-parse --show-toplevel', {
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
            cwd: startDir,
        }).trim();
        return out || startDir;
    } catch {
        return startDir;
    }
}

function toPosixRelative(root: string, p: string): string {
    const rel = path.relative(root, p) || path.basename(p);
    return rel.split(path.sep).join('/');
}

async function fileExists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

function stripJsonComments(src: string): string {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:\\])\/\/.*$/gm, '$1')
        .trim();
}

async function readTsConfig(preferredDir: string, repoRoot: string): Promise<TsConfig | null> {
    const candidates = [
        path.join(preferredDir, 'tsconfig.json'),
        path.join(repoRoot, 'tsconfig.json'),
    ];
    for (const p of candidates) {
        if (await fileExists(p)) {
            const raw = await fs.readFile(p, 'utf8');
            try {
                return JSON.parse(stripJsonComments(raw)) as TsConfig;
            } catch {
                // ignore invalid-with-comments
            }
        }
    }
    return null;
}

function isComponentsPath(p: string): boolean {
    const norm = p.split(path.sep).join('/');
    const segments = norm.split('/');
    return segments.includes('components');
}

function patternToRegex(pattern: string): { regex: RegExp; star: boolean } {
    if (pattern.includes('*')) {
        const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '(.*)');
        return { regex: new RegExp(`^${esc}$`), star: true };
    }
    const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    return { regex: new RegExp(`^${esc}$`), star: false };
}

function applyPathsMapping(
    spec: string,
    baseUrlAbs: string | null,
    paths: Record<string, string[]> | undefined,
    fallbackDirAbs: string,
): string[] {
    if (!paths) return [];
    const outs: string[] = [];
    for (const [key, arr] of Object.entries(paths)) {
        const { regex, star } = patternToRegex(key);
        const m = spec.match(regex);
        if (!m) continue;
        const starVal = star ? m[1] ?? '' : '';
        for (const target of arr) {
            const replaced = star ? target.replace('*', starVal) : target;
            const abs = baseUrlAbs ? path.resolve(baseUrlAbs, replaced) : path.resolve(fallbackDirAbs, replaced);
            outs.push(abs);
        }
    }
    return outs;
}

async function tryResolveFile(base: string): Promise<string | null> {
    const exts = ['', '.tsx', '.ts', '.jsx', '.js'];
    for (const ext of exts) {
        const file = base.endsWith(ext) ? base : base + ext;
        if (await fileExists(file)) return file;
    }
    // index.* fallback
    const idx = ['index.tsx', 'index.ts', 'index.jsx', 'index.js'];
    for (const name of idx) {
        const p = path.join(base, name);
        if (await fileExists(p)) return p;
    }
    return null;
}

async function resolveImport(
    spec: string,
    importerFile: string,
    repoRoot: string,
    tsconfig: TsConfig | null,
    rootDirAbs: string,
): Promise<string | null> {
    // Avoid "@/..." imports entirely
    if (spec.startsWith('@/')) return null;

    // Relative or absolute
    if (spec.startsWith('.') || spec.startsWith('/')) {
        const base = spec.startsWith('.') ? path.resolve(path.dirname(importerFile), spec) : spec;
        const found = await tryResolveFile(base);
        if (found) return found;
    }

    // TS paths (excluding "@/")
    const baseUrl = tsconfig?.compilerOptions?.baseUrl
        ? path.resolve(repoRoot, tsconfig.compilerOptions.baseUrl)
        : null;

    const fromPaths = applyPathsMapping(spec, baseUrl, tsconfig?.compilerOptions?.paths, rootDirAbs);
    for (const candidate of fromPaths) {
        const found = await tryResolveFile(candidate);
        if (found) return found;
    }

    // BaseUrl join
    if (baseUrl) {
        const candidate = path.resolve(baseUrl, spec);
        const found = await tryResolveFile(candidate);
        if (found) return found;
    }

    return null;
}

function extractImportSpecifiers(src: string): string[] {
    const specs: string[] = [];
    // import ... from 'spec';  |  export ... from 'spec';
    const re = /\b(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"];?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        specs.push(m[1]);
    }
    // side-effect imports: import 'spec';
    const re2 = /\bimport\s*['"]([^'"]+)['"];?/g;
    while ((m = re2.exec(src)) !== null) {
        specs.push(m[1]);
    }
    return specs;
}

/**
 * Idempotently insert a `//@see types.gen.ts` comment directly above each `import type ...;` block.
 * Handles multi-line imports up to the terminating semicolon.
 */
function addSeeCommentIdempotent(src: string): string {
    const lines = src.split(/\r?\n/);
    const out: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (/^[ \t]*import[ \t]+type\b/.test(line)) {
            const indent = (line.match(/^[ \t]*/) ?? [''])[0];
            const block: string[] = [line];
            i++;
            while (i < lines.length && !/[;][ \t]*$/.test(lines[i])) {
                block.push(lines[i]);
                i++;
            }
            if (i < lines.length) block.push(lines[i]);

            // Check previous non-empty line in `out`
            let prevIdx = out.length - 1;
            while (prevIdx >= 0 && /^\s*$/.test(out[prevIdx])) prevIdx--;
            const hasExisting =
                prevIdx >= 0 && /^\s*\/\/@see types\.gen\.ts\s*$/i.test(out[prevIdx] ?? '');

            if (!hasExisting) out.push(`${indent}//@see types.gen.ts`);
            out.push(...block);
            i++;
            continue;
        }

        out.push(line);
        i++;
    }

    return out.join('\n');
}

async function collectComponentsGraph(
    entry: string,
    repoRoot: string,
    tsconfig: TsConfig | null,
    rootDirAbs: string,
): Promise<string[]> {
    const visited = new Set<string>();
    const order: string[] = [];

    async function visit(file: string): Promise<void> {
        if (visited.has(file)) return;
        visited.add(file);
        order.push(file);

        const src = await fs.readFile(file, 'utf8');
        const specs = extractImportSpecifiers(src).filter((s) => !s.startsWith('@/')); // skip "@/..." entirely

        for (const spec of specs) {
            const resolved = await resolveImport(spec, file, repoRoot, tsconfig, rootDirAbs);
            if (!resolved) continue;

            // Skip node_modules and files outside the repo root
            const relToRoot = path.relative(repoRoot, resolved);
            if (relToRoot.startsWith('..') || relToRoot.includes(`node_modules${path.sep}`)) continue;

            // Only follow into files whose **resolved path** sits under a "components" segment
            if (!isComponentsPath(resolved)) continue;

            // Only traverse source files
            if (!/\.(tsx|ts|jsx|js)$/.test(resolved)) continue;

            await visit(resolved);
        }
    }

    await visit(entry);
    return order;
}

const PROMPT_MD = String.raw`You are refactoring a Next.js (App Router) + TypeScript + TanStack Query v5 + MUI project.
Act like a principal TypeScript architect.

## OUTPUT RULES
- Output **only** production-ready code blocks with file paths.
- No explanations or prose.
- If you run out of tokens, stop **before** the next file and write exactly: \`CONTINUE\`.

---

## INPUT SCOPE (important)
- The INPUT below includes \`page.tsx\` and **only those files whose resolved path contains a "components" segment**,
  discovered by following **transitive** static imports from \`page.tsx\`.
- Imports that use the \`@/\` alias were **intentionally ignored** when assembling INPUT.

---

## ARCHITECTURE (single direction)
**Hooks (data)** ➜ **Smart container (logic & wiring)** ➜ **UI components (presentational)**

### 1) Hooks (strict)
- **Only here** may you import from \`@/api-client/*\` (including \`types.gen\` and generated react-query options).
- **Never** import from \`app/**/ui/*\`, \`app/**/components/*\`, or \`@mui/*\`. **No** \`'use client'\` in hooks.
- Own all SDK I/O; compose reads & mutations; reuse generated \`queryKey\`s.
- Return **plain, minimal, serializable** shapes and mutation fns.
- You **may** use SDK endpoint types **inside the hook only**. Do **not** export them.
- Do **not** define/export any \`Ui*\` types here.
- Shared pure helpers live in \`src/lib/<feature>/*.ts\` (no SDK, no MUI).

### 2) Smart containers (strict)
- Client component (\`'use client'\` allowed).
- **Never** import from \`@/api-client/*\` or \`@mui/*\`.
- Own side effects (router, session, toasts, local state).
- Import **UI types only** from \`../ui/types\`.
- Map hook data ➜ UI props using **only** \`satisfies\` to validate shapes against \`Ui*\` types.
- No \`as\` assertions, no \`unknown\`, no SDK types or server-only modules.

### 3) UI components (strict MUI boundary)
- Presentational only; no data fetching, no navigation, no side effects.
- **MUI allowed only here:** \`@mui/material\`, \`@mui/lab\`, \`@mui/icons-material\`, \`@toolpad/core/*\`, theming hooks, \`sx\`.
- Define **all UI-only prop types** in \`../ui/types.ts\`.
- Minimal props + callbacks; interactive elements must include \`data-test-id\` (kebab-case).

### 4) Shared domain & utils
- Cross-layer non-UI types (if needed) in \`src/domain/<feature>/types.ts\` (no SDK, no MUI).
- Pure formatters/utilities in \`src/lib/<feature>/*.ts\` (no SDK, no MUI).

---

## TYPE & CODE QUALITY RULES
- **Type conversion:** shape objects to UI types and validate with **\`satisfies\`**. Fix shapes; do not cast.
- **No** \`any\`, \`unknown\`, \`as any\`, double-casts, or suppressions.
- Do **not** annotate component returns with \`JSX.Element\`.
- Prefer \`readonly\` arrays/tuples and \`as const\` where appropriate.
- Remove dead code and **delete unused props/params/fields**. Do **not** preserve for “consistency”.

### COMMENT POLICY (no filler)
- Allowed: concise TSDoc on **exported** APIs (1–3 lines), \`eslint-disable\` with a reason, or a **single-line** \`@see\`.
- **Banned:** narrative/filler (e.g., “kept for consistency”), TODOs, commented-out code.
- Default to **no comments**; write self-explanatory code and types.

---

## STEP-BASED UI EXTRACTION
- If the input contains \`getStepContent\` or inline \`renderXyz\`, create **one file per step** under \`../ui/steps/\`.
- Create \`FeaturePageFrame.tsx\`, \`StepperHeader.tsx\`, and \`ActionBar.tsx\`.
- Replace \`switch(step)\` with a **component map** inside the container.
- Step components receive only the fields they render plus callbacks (no hooks, no navigation).

---

## SSR / HYDRATION (only for \`page.tsx\`)
- Server: per-request \`QueryClient\` → \`prefetch<Feature>\` → \`dehydrate\` → \`<HydrateClient>\`.
- **No MUI** in \`page.tsx\`.

---

## REACT QUERY v5
- Use generated \`read*GetOptions(...)\` / \`*Mutation()\` and their \`queryKey\`s.
- Prefetch \`staleTime\`: ~60s for primary entities, ~5m for lookups.
- Invalidate the **minimal** set of keys on mutations.

---

## FILESYSTEM & IMPORTS
- No imports from \`../ui/*\` or \`../components/*\` inside hooks.
- Move util imports wrongly placed under components to \`src/lib/<feature>/*\` and update usage.
- No wildcard/barrel imports from SDK; import only what you use.
- Keep imports sorted and paths relative within the feature.

---

## DELIVERABLES (each file in its own code block)
1) \`src/hooks/data/<Feature>/use<Feature>Data.ts\`
2) \`src/hooks/data/<Feature>/prefetch<Feature>.ts\`
3) \`src/hooks/data/index.ts\`
4) \`src/app/(protected)/<feature>/[<param>]/page.tsx\` (only if the input file itself is a page)
5) \`src/app/(protected)/<feature>/[<param>]/components/<Feature>Container.tsx\`
6) \`src/app/(protected)/<feature>/[<param>]/ui/FeaturePageFrame.tsx\`
7) \`src/app/(protected)/<feature>/[<param>]/ui/StepperHeader.tsx\`
8) \`src/app/(protected)/<feature>/[<param>]/ui/ActionBar.tsx\`
9) \`src/app/(protected)/<feature>/[<param>]/ui/steps/Step<MeaningfulName>.tsx\`
10) \`src/app/(protected)/<feature>/[<param>]/ui/InlineLoader.tsx\`, \`ErrorBanner.tsx\`
11) \`src/app/(protected)/<feature>/[<param>]/ui/types.ts\`
12) \`src/app/(protected)/<feature>/[<param>]/ui/__stories__/*.stories.tsx\`

---

## ENFORCEMENT CHECKLIST
- [ ] No \`'use client'\` in \`src/hooks/**\`.
- [ ] No \`@mui/*\` imports outside \`../ui/*\`.
- [ ] No \`@/api-client/*\` imports outside \`src/hooks/**\`.
- [ ] No \`Ui*\` types in hooks.
- [ ] Containers use **\`satisfies\`** for shaped props.
- [ ] Unused fields are **deleted**, not commented.
- [ ] No \`any*\` or \`ever*\` type ever used
- [ ] Typescript 5.7 compatible

---

## REFACTORING INSTRUCTIONS FOR THE PASTED INPUT
- Infer \`<Feature>\` and \`[<param>]\` from the path/name.
- Move all SDK usage to hooks; keep endpoint types internal to hooks.
- Extract inline render helpers / step switches into \`../ui/steps/Step*.tsx\`.
- Replace step switch with a component map in the container.
- Shape container props to UI types with \`satisfies Ui*Type\`.
- Enforce boundaries; relocate shared helpers to \`src/lib/...\`.
- Implement \`prefetch<Feature>\` for all datasets used by the feature.
- Use granular loaders/errors with \`InlineLoader\` / \`ErrorBanner\`.
- **Delete** unused fields and filler comments.

---

## INPUT
`;

const SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'out',
    'coverage',
    '.turbo',
    '.parcel-cache',
    '.vscode',
    '.idea',
]);

async function* walkDirs(root: string): AsyncGenerator<string> {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (SKIP_DIRS.has(e.name)) continue;
        const full = path.join(root, e.name);
        yield full;
        yield* walkDirs(full);
    }
}

async function findAllPageFolders(appRoot: string): Promise<string[]> {
    const hits: string[] = [];
    // Include the appRoot itself if it contains page.tsx
    if (await fileExists(path.join(appRoot, PAGE_NAME))) hits.push(appRoot);
    for await (const dir of walkDirs(appRoot)) {
        if (await fileExists(path.join(dir, PAGE_NAME))) hits.push(dir);
    }
    return hits;
}

async function buildFeatureForFolder(
    pageFolder: string,
    repoRoot: string,
    tsconfig: TsConfig | null,
): Promise<void> {
    const entry = path.join(pageFolder, PAGE_NAME);
    const outputFile = path.join(pageFolder, OUTPUT_NAME);

    const graph = await collectComponentsGraph(entry, repoRoot, tsconfig, pageFolder);

    let output = PROMPT_MD + '\n\n## INPUT\n';
    for (const abs of graph) {
        const rel = toPosixRelative(repoRoot, abs);
        const raw = await fs.readFile(abs, 'utf8');
        const transformed = addSeeCommentIdempotent(raw);
        output += `${rel}\n${transformed}\n`;
    }

    await fs.writeFile(outputFile, output, 'utf8');
    console.log(`✓ Wrote ${toPosixRelative(repoRoot, outputFile)} (${output.length} bytes)`);
}

async function main(): Promise<void> {
    const argPath = process.argv[2];
    if (!argPath) {
        console.error('Usage: tsx refactor.ts <app-folder>');
        process.exit(1);
    }

    const appRoot = path.resolve(argPath);
    if (!(await fileExists(appRoot))) {
        console.error(`refactor: folder not found: ${appRoot}`);
        process.exit(1);
    }

    const repoRoot = getRepoRoot(appRoot);
    const tsconfig = await readTsConfig(appRoot, repoRoot);

    const pageFolders = await findAllPageFolders(appRoot);
    if (pageFolders.length === 0) {
        console.error(`refactor: no '${PAGE_NAME}' found under: ${appRoot}`);
        process.exit(1);
    }

    for (const folder of pageFolders) {
        await buildFeatureForFolder(folder, repoRoot, tsconfig);
    }
}

main().catch((err) => {
    console.error('refactor failed:', err);
    process.exit(1);
});
