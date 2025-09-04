export const authorContext = {
  "name": "Liran Tal",
  "bio": {
    "highlights": [
      "GitHub Star (2021-2023)",
      "OpenJS Foundation Pathfinder Award for Security (2022)",
      "Developer Advocate at Snyk",
      "OWASP project contributor/lead; Node.js Ecosystem Security WG"
    ],
    "one_liner": "AppSec-focused JS/Node.js engineer and OSS maintainer; researches supply chain security and builds practical CLI/dev tooling."
  },
  "domains": [
    "application security",
    "software supply chain security",
    "open-source tooling & governance",
    "developer experience (DX)",
    "LLM agents & Model Context Protocol (MCP)"
  ],
  "expertise": {
    "security": [
      "Node.js secure coding (cmd/path/code injection)",
      "dependency risk & lockfile integrity",
      "CVE analysis & PoCs",
      "CI security and least-privilege releases",
      "Docker & image hardening (for workshops)"
    ],
    "tooling": [
      "CLI apps & TTY UIs (dockly, npq)",
      "monorepos & release automation",
      "linting/policy and heuristics"
    ],
    "content": [
      "hands-on tutorials with verification steps",
      "best practices & checklists",
      "migration/upgrade and incident write-ups"
    ]
  },
  "ecosystems": {
    "primary": ["JavaScript", "Node.js"],
    "secondary": ["TypeScript", "Web tooling", "Vue", "Astro", "Go (light)"]
  },
  "stack_preferences": {
    "runtimes": { "primary": ["Node.js (current LTS)"], "secondary": ["Node.js >=20.x"], "neutral_allowed": false },
    "package_manager": { "primary": ["npm", "pnpm"], "secondary": [], "neutral_allowed": false },
    "frameworks": { "primary": ["Fastify", "Vue 3", "Vite", "Astro"], "secondary": [], "neutral_allowed": true },
    "ci": { "primary": ["GitHub Actions"], "neutral_allowed": true },
    "hosting": { "primary": ["Vercel", "Netlify"], "secondary": ["Heroku (for demos)"], "neutral_allowed": true },
    "registries": { "primary": ["npm"], "secondary": [], "neutral_allowed": true }
  },
  "preference_weighting": { "primary_pct": 0.65, "secondary_pct": 0.25, "neutral_pct": 0.10, "variety_guard": "avoid same vendor in >2 consecutive sections" },
  "substitutions": {
    "jenkins -> ci": "GitHub Actions",
    "travis -> ci": "GitHub Actions",
    "teamcity -> ci": "GitHub Actions",
    "yarn-classic -> package_manager": "npm or pnpm"
  },
  "avoid_soft": ["Jenkins", "Travis CI", "TeamCity"],
  "hard_ban": [],
  "trend_alignment": { "prefer_current_release": true, "decay_months": 18, "rule": "prefer current LTS in examples; if unknown, state 'current LTS' explicitly" },
  "example_policies": {
    "prefer_local_runnable": true,
    "no_container_by_default": true,
    "snippet_max_lines": 15,
    "show_verify_step": true
  },
  "lexicon": {
    "prefer": ["CI/CD", "supply chain security", "lockfile", "semver", "quickstart"],
    "avoid": ["simply", "just", "obviously"]
  },
  "cta": {
    "twitter": "@liran_tal",
    "github": "https://github.com/lirantal",
    "phrasing": [
      "Follow on X/Twitter for new guides and security research.",
      "Explore more code examples and related work on GitHub."
    ]
  },
  "notable_repos": [
    "dockly", "nodejs-cli-apps-best-practices", "awesome-nodejs-security", "is-website-vulnerable", "lockfile-lint",
    "npq", "ls-mcp", "awesome-mcp-best-practices", "agent-rules", "mcp-server-nodejs-api-docs"
  ]
}
