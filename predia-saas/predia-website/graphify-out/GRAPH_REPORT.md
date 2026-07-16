# Graph Report - .  (2026-07-13)

## Corpus Check
- Corpus is ~1,462 words - fits in a single context window. You may not need a graph.

## Summary
- 39 nodes · 31 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Package Metadata & Deps
- TypeScript Config
- Welcome Page & Layout
- NPM Scripts
- README Documentation
- PNPM Workspace Config
- Favicon Branding
- Astro Logo Asset
- Background Decoration

## God Nodes (most connected - your core abstractions)
1. `scripts` - 5 edges
2. `../components/Welcome.astro` - 4 edges
3. `include` - 3 edges
4. `Astro Starter Kit: Basics` - 3 edges
5. `engines` - 2 edges
6. `astro` - 2 edges
7. `exclude` - 2 edges
8. `pnpm Commands (install, dev, build, preview, astro CLI)` - 2 edges
9. `Astro Framework` - 2 edges
10. `pnpm Workspace Config (allowBuilds)` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 3 thin omitted)

### Community 0 - "Package Metadata & Deps"
Cohesion: 0.22
Nodes (8): astro, dependencies, astro, engines, node, name, type, version

### Community 1 - "TypeScript Config"
Cohesion: 0.25
Nodes (7): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, exclude, extends, include

### Community 2 - "Welcome Page & Layout"
Cohesion: 0.33
Nodes (4): ../assets/astro.svg, ../assets/background.svg, ../components/Welcome.astro, ../layouts/Layout.astro

### Community 3 - "NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, astro, build, dev, preview

### Community 4 - "README Documentation"
Cohesion: 0.67
Nodes (4): Astro Framework, Astro Starter Kit: Basics, pnpm Commands (install, dev, build, preview, astro CLI), Project Structure (public/, src/assets, src/components, src/layouts, src/pages, package.json)

### Community 5 - "PNPM Workspace Config"
Cohesion: 0.67
Nodes (3): pnpm Workspace Config (allowBuilds), esbuild build permission flag, sharp build permission flag

## Knowledge Gaps
- **23 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `NPM Scripts` to `Package Metadata & Deps`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._