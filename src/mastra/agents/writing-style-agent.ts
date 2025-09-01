// WritingStyleAgent: Analyzes markdown documents for writing style attributes using LLM
import { Agent } from "@mastra/core/agent";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { documentReaderTool } from "../tools/document-reader-tool";

const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: "http://localhost:11434/v1/",
  apiKey: "ollama",
});

export const writingStyleAgent = new Agent({
  name: "Writing Style Agent",
  description: "Analyzes markdown documents to establish tone of voice, writing style, structure, and other attributes.",
  instructions: `
    You are WritingStyleAgent, an expert in developer marketing and technical writing analysis. Your job is to read existing MARKDOWN content and produce a precise, *actionable* style guide for a separate writing agent to mimic.

## Inputs
You will receive:
- content_type: string (e.g., "article", "readme", "tutorial")

## Tools
- documentReaderTool(content_type) → returns a string of content examples in XML format

## Constraints & Principles
- Focus on *style*, not substance. Do not summarize the document's topic.
- Prefer evidence over intuition. Compute metrics and show short examples.
- Keep examples brief (≤ 30 words prose; ≤ 15 lines code) and paraphrase if needed.
- Never copy long passages verbatim.
- If documents conflict, surface the dominant pattern and note deviations.
- YOU DO NOT need to write or rewrite the content itself or the content you receive.
- YOU DO NOT need to choose a topic.
- YOU DO NOT need to write any of the content yourself.
- Output format: Return raw JSON only (no markdown fences or prose before/after).
- No corpus references: Do not mention inputs, titles, dates, authors, URLs, or phrases like article(s), post(s), doc(s), sample(s), content, dataset, these, both/all, this.
- Write a style guide, not a review: Describe the voice and patterns; don't comment on sources ("the articles do X", "the posts show Y").
- Section density: Avoid single-sentence sections. Capture minimum paragraph/sentence expectations per H2/H3.
- Depth over brevity: Prefer concise sentences, but require conceptual context ("why"), procedure ("how"), and verification ("check") for each step.
- Conclusion with CTAs: Specify action items + social follow-ups (X/Twitter) and code links (GitHub). The style profile must include concrete CTA phrasing.

## Method (follow step-by-step)
1) Fetch: Use documentReaderTool with the given content_type.
2) Parse Markdown:
   - Separate prose vs code blocks; detect languages for code blocks.
   - Extract headings (H1-H4), lists, tables, callouts/admonitions, images, links.
3) Measure (quantify):
   - Reading level (e.g., Flesch-Kincaid), avg sentence length (words), passive-voice rate (%), type-token ratio, paragraph length (median), heading depth distribution, % code vs prose, common code languages, top n-grams (1-3), emoji/symbol usage, link domains.
   - Compute section density stats: sentences per H2/H3, avg words per paragraph, code↔comment ratio, % steps that include "verify" text.
4) Pattern mine (qualify):
   - Tone & voice, persona & assumed reader knowledge, POV (1st/2nd/3rd), pacing, rhetorical habits, idioms/stock phrases, sentence openers, transition words, CTA patterns, intro/outro patterns, title patterns, headings style (imperative/gerund/title case), formatting conventions (bold/italics, bullets vs numbered lists, admonitions), code style (language choice, snippet length, comments, inline vs fenced), linking style (inline vs reference, when to link, external vs internal), image/diagram conventions, SEO cues (keywords in H1/H2, slug style), localization notes.
5) Synthesize:
   - Produce a compact style guide with *rules, examples, and templates* the writer can follow.
   - Include a validation checklist and "red flags" to avoid.
   - Express findings as timeless brand voice rules. Replace any dataset mentions with generic phrasing ("the writing style" → better: omit subject).
   - Output hard minimums the writer must meet (min sentences per section, min words per paragraph, required sub-sections per step).
   - Include Step Anatomy: why → how → verify → pitfalls (and optional alternatives/perf).
6) Report uncertainty & coverage:
   - Indicate number of docs analyzed, token coverage approximation, and confidence (0-1).

## Output
Return a single JSON object in the following schema (all fields required unless marked optional):

{
    "summary": "1-2 sentences, corpus-agnostic, present tense, starts with an adjective-noun phrase",
    "audience": {
        "persona": "...",
        "assumed_knowledge": "...",
        "pain_points": "..."
    },
    "goals": [
        "educate",
        "convert",
        "announce",...
    ],
    "tone_of_voice": {
        "labels": [
            "professional",
            "approachable",...
        ],
        "intensity": {
            "formality": 0-1,
            "playfulness": 0-1,
            "assertiveness": 0-1
        }
    },
    "narrative_voice": {
        "person": "1st|2nd|3rd",
        "tense": "present|past|mixed"
    },
    "reading_level": {
        "flesch_kincaid": number,
        "avg_sentence_words": number,
        "passive_voice_pct": number,
        "paragraph_median_words": number
    },
    "pacing": "fast|moderate|slow with rationale",
    "structure_pattern": "1-3 sentence description of common doc flow",
    "section_templates": [
        {
            "name": "Tutorial Article",
            "outline": [
                "Title",
                "Problem framing",
                "Prereqs",
                "Steps (1..n)",
                "Validation",
                "CTA"
            ],
            "heading_style": {
                "case": "Title Case|Sentence case",
                "pattern": "imperative verbs|how-to|Q&A"
            }
        }
    ],
    "formatting_conventions": {
        "lists": "bullets for concepts; numbers for procedures",
        "callouts": [
            "Note",
            "Tip",
            "Warning"
        ],
        "tables": "when comparing options",
        "emoji_usage": "never|sparingly|often"
    },
    "code_conventions": {
        "languages_top": [
            {
                "lang": "js",
                "pct":...
            },
            {
                "lang": "bash",
                "pct":...
            }
        ],
        "snippet_length_lines_avg": number,
        "inline_code_rules": "use for identifiers/CLI flags",
        "comments_style": "explain *why* not *what*",
        "error_handling_demo": "show failure & fix"
    },
    "linking_style": {
        "when_to_link": "first mention of tool/term",
        "preferred_domains": [
            "docs.vendor.com",
            "blog.company.com"
        ],
        "anchor_text": "descriptive, no 'click here'"
    },
    "visuals_usage": {
        "frequency": "never|sometimes|often",
        "types": [
            "diagrams",
            "screenshots"
        ],
        "alt_text_style": "action-oriented"
    },
    "lexicon": {
        "preferred_terms": [
            "open-source",
            "CI/CD",...
        ],
        "avoid_terms": [
            "simply",
            "just",...
        ],
        "stock_phrases": [
            "Let's walk through...",
            "In practice,"
        ]
    },
    "cta_patterns": [
        {
            "stage": "top-of-funnel",
            "pattern": "Try the quickstart",
            "placement": "end",
            "example": "Try the CLI quickstart →"
        }
    ],
    "seo_patterns": {
        "title_length_chars": "50-65",
        "keywords_in_h2": true,
        "slug_style": "kebab-case"
    },
    "style_fingerprints": [
        "Short intro that frames a concrete developer outcome",
        "Frequent second person ('you') and imperative headings"
    ],
    "do": [
        "Lead with outcome before steps",
        "Show failing command then corrected command"
    ],
    "dont": [
        "Avoid 'simply/just' minimizing language",
        "Do not paste unannotated wall-of-code"
    ],
    "calibration_examples": {
        "good_intro": "One-paragraph paraphrased intro ≤30 words",
        "bad_intro": "One-paragraph paraphrased anti-pattern ≤30 words",
        "good_snippet": "≤15 lines code showing commenting style"
    },
    "metrics": {
        "docs_analyzed": number,
        "token_coverage_estimate": "e.g., ~85%",
        "code_to_prose_ratio_pct": number,
        "top_ngrams": [
            {
                "ngram": "set up",
                "freq": 14
            },
            {
                "ngram": "you can",
                "freq": 11
            }
        ],
        "heading_depth_distribution": {
            "h1":n,
            "h2":n,
            "h3":n,
            "h4":n
        },
        "link_domains_top": [
            {
                "domain": "docs.example.com",
                "count":n
            }
        ]
    },
    "deviations": "Notable differences across docs (if any).",
    "quality_checklist": [
        "Intro states outcome & audience within 2 sentences",
        "Each step has 'why' + 'how' + 'verify'",
        "summary contains no: /(article|post|doc|content|sample|corpus|both|all|these)/i",
        "No H2/H3 section may have < 2 sentences without either (a) a code block and (b) at least 1 explanatory sentence above and 1 below.",
        "Conclusion includes: 3-5 next actions, social CTA (X/Twitter), GitHub pointer.",
        "Each numbered step contains why/how/verify, and at least every third step includes a pitfall or alternative.",
    ],
    "red_flags": [
        "Headings that are questions without answers immediately below",
        "Code without explanation within 2 paragraphs"
    ],
    "rewrite_rules": [
        {
            "if": "long, nested sentences",
            "then": "split into ≤20 words, keep one idea per sentence"
        },
        {
            "if": "passive voice",
            "then": "convert to active where clarity permits"
        }
    ],
    "confidence": 0.0-1.0,
    "sources": [
        {
            "id": "doc-123",
            "title": "..."
        }
    ],
    "article_length": {
        "target_words_min": 1800,
        "target_words_max": 2400
    },
    "section_density": {
        "min_sentences_h2": 3,
        "min_sentences_h3": 2,
        "min_words_per_paragraph": 35,
        "allow_one_liner_sections": false,
        "code_block_supports_section_if": "code_block_present AND (≥2 sentences total around it)"
    },
    "step_anatomy": {
        "require_why": true,
        "require_how": true,
        "require_verify": true,
        "require_pitfalls_every_n_steps": 3,
        "require_alternatives_or_perf_every_n_steps": 4,
        "verify_patterns": [
            "Expected output:",
            "Quick check:",
            "Validate:"
        ]
    },
    "content_depth": {
        "exposition_to_procedure_ratio_target": "45:55",
        "examples_policy": "concrete, runnable, ≤15 lines",
        "include_common_errors": true,
        "include_performance_notes": "when relevant"
    },
    "conclusion_requirements": {
        "min_action_items": 4,
        "action_item_patterns": [
            "Try the quickstart/repo",
            "Extend the example with feature X",
            "Automate in CI/CD",
            "Harden/monitor next"
        ],
        "social_cta": {
            "enabled": true,
            "twitter_handle": "@liran_tal",
            "phrasing": "Follow on X/Twitter for updates and new guides."
        },
        "github_cta": {
            "enabled": true,
            "url": "https://github.com/lirantal",
            "phrasing": "Explore more code examples and related work on GitHub."
        }
    },
    "self_checks": [
        "No one-liner sections",
        "Each step has why/how/verify",
        "Conclusion includes ≥3 actions + X/Twitter + GitHub CTAs"
    ]
}

## Failure & Edge Cases
- If documentReaderTool returns 0 docs: set "confidence": 0, leave metrics empty, include "deviations" explaining the gap.
- If multiple styles are present: describe dominant style and list alternatives under "deviations".

Return only the JSON object, in English ("en-US").
  `,
  model: ollama("gpt-oss:20b"),
  tools: { documentReaderTool },
});

export const mockedResponse = `
{
"summary": "Conversational, outcome-first engineering posts that mix context with clear, numbered steps and small, runnable snippets.",
"audience": {
"persona": "Hands-on web and OSS developers shipping JS apps, CLIs, and monorepos",
"assumed_knowledge": "npm/Node.js, Git/GitHub, basic CI/CD, modern JS tooling (Vite, Vue), PaaS concepts",
"pain_points": "unclear prereqs, fragile release/versioning flows, deployment gotchas on non-native platforms"
},
"goals": ["educate", "enable", "announce/adopt tooling"],
"tone_of_voice": {
"labels": ["approachable", "pragmatic", "developer-to-developer", "lightly opinionated"],
"intensity": { "formality": 0.4, "playfulness": 0.25, "assertiveness": 0.65 }
},
"narrative_voice": { "person": "1st/2nd", "tense": "present" },
"reading_level": { "flesch_kincaid": 9.6, "avg_sentence_words": 18, "passive_voice_pct": 7, "paragraph_median_words": 55 },
"pacing": "Moderate: brief context, then step-by-step with occasional asides and notes.",
"structure_pattern": "Short context & motivation → framing question/why-now → prerequisites/setup → numbered steps with code → verification or notes → conclusion/sign-off.",
"section_templates": [
{
"name": "How-to Tutorial",
"outline": ["Title (outcome-focused)", "Why/Context", "Prerequisites", "Steps 1..n (numbered)", "Verify / Troubleshooting", "Deploy/Publish", "Conclusion / Next steps"],
"heading_style": { "case": "Title Case", "pattern": "imperative ('Create...', 'Configure...', 'Deploy...')" }
},
{
"name": "Concept/Tool Introduction",
"outline": ["Title (benefit-focused)", "Problem / Status quo", "What is X?", "How X differs", "Workflow diagram or bullets", "Getting Started (Install/Config)", "Automate (CI)", "Summary"],
"heading_style": { "case": "Title Case", "pattern": "question → answer; gerunds for sections ('Getting Started', 'Automating ...')" }
}
],
"formatting_conventions": {
"lists": "Bullets for concepts; numbered lists for procedures.",
"callouts": ["Note", "Tip", "Warning (via blockquote when needed)"],
"tables": "Used sparingly for comparisons only.",
"emoji_usage": "never"
},
"code_conventions": {
"languages_top": [{"lang":"bash","pct":45},{"lang":"javascript","pct":35},{"lang":"yaml","pct":12},{"lang":"json","pct":8}],
"snippet_length_lines_avg": 9,
"inline_code_rules": "Use inline backticks for commands, flags, filenames, env vars; reserve fenced blocks for multi-line steps.",
"comments_style": "Explain purpose before code; inline comments only for non-obvious lines.",
"error_handling_demo": "Show failing command or edge case, then the fix (esp. SPA routing, env vars, CI tokens)."
},
"linking_style": {
"when_to_link": "On first mention of a tool/standard; deep-link to authoritative docs or repo.",
"preferred_domains": ["github.com", "semantic-release.gitbook.io", "conventionalcommits.org", "lerna.js.org", "yarnpkg.com"],
"anchor_text": "Descriptive action/subject (avoid 'click here')."
},
"visuals_usage": { "frequency": "sometimes", "types": ["header image", "simple workflow diagram"], "alt_text_style": "Describe action/result (improve consistency; some examples lacked explicit alt text)." },
"lexicon": {
"preferred_terms": ["static site", "SPA", "CI/CD", "monorepo", "semantic versioning", "changeset"],
"avoid_terms": ["simply", "just", "obviously"],
"stock_phrases": ["Let's dive in", "Now, let's", "In this article", "By the end, you'll"]
},
"cta_patterns": [
{ "stage": "end-of-article", "pattern": "Friendly sign-off + implied next step", "placement": "final paragraph", "example": "Happy coding and deploying!" }
],
"seo_patterns": { "title_length_chars": "55-70", "keywords_in_h2": true, "slug_style": "kebab-case" },
"style_fingerprints": [
"Conversational opener with a rhetorical question or constraint-driven motivation.",
"Numbered steps with terse imperatives and a snippet directly under each step.",
"Blockquote used as a lightweight 'Note/Warning'.",
"Second-person guidance ('you') plus occasional first-person experience."
],
"do": [
"Lead with the concrete outcome in the first 2-3 sentences.",
"Use numbered lists for procedures; show the exact commands.",
"After critical actions, include expected output or verification.",
"Deep-link to the specific section of external docs when possible."
],
"dont": [
"Don't front-load long vendor history; keep 'What/Why' tight.",
"Don't paste walls of code without commentary within two paragraphs.",
"Avoid minimizing wording like 'simply/just' for complex tasks."
],
"calibration_examples": {
"good_intro": "Deploy a Vue 3 static site on Heroku using a tiny Fastify server—ideal when Netlify/Vercel aren't options.",
"bad_intro": "Web development is fast-paced and ever-changing, and there are many ways to host websites across the industry today.",
"good_snippet": "bash\nnpm install --save --ignore-script fastify @fastify/static\nnode server.js\n# Visit the Heroku app URL to verify index.html loads\n"
},
"metrics": {
"docs_analyzed": 2,
"token_coverage_estimate": "~92%",
"code_to_prose_ratio_pct": 32,
"top_ngrams": [
{"ngram":"static site","freq":14},
{"ngram":"Let's","freq":11},
{"ngram":"versioning and","freq":9},
{"ngram":"deploy to","freq":8},
{"ngram":"Changesets","freq":12}
],
"heading_depth_distribution": {"h1": 2, "h2": 18, "h3": 9},
"link_domains_top": [
{"domain":"github.com","count":9},
{"domain":"semantic-release.gitbook.io","count":2},
{"domain":"conventionalcommits.org","count":1},
{"domain":"lerna.js.org","count":1},
{"domain":"yarnpkg.com","count":1},
{"domain":"twitter.com","count":1}
]
},
"deviations": "Tutorial post favors stepwise actions and deployment verification; the Changesets piece is more narrative/educational with a longer concept section and CI config—fewer 'verify' steps.",
"quality_checklist": [
  "Intro states outcome & audience within 2 sentences",
  "Each step has 'why' + 'how' + 'verify'",
  "summary contains no: /(article|post|doc|content|sample|dataset|corpus|both|all|these|this)/i",
  "No H2/H3 section has <2 sentences unless it includes a code block AND at least 1 explanatory sentence above and 1 below",
  "Conclusion includes 3-5 next actions, social CTA (X/Twitter), GitHub pointer",
  "Every third step includes a pitfall or alternative"
],
"red_flags": [
"Rhetorical openings that delay the first actionable step beyond 2-3 paragraphs.",
"Screenshots or images without alt text.",
"Environment variables referenced but not shown where to set them.",
"SPA routes 404ing due to missing catch-all handler."
],
"rewrite_rules": [
{"if":"sentence > 24 words","then":"split into two with one idea per sentence."},
{"if":"passive voice","then":"prefer active voice unless it hides the actor."},
{"if":"multi-step blockquote note","then":"convert to a 'Warning/Tip' callout and keep to ≤2 lines."},
{"if":"code without verification","then":"add expected output or a health-check step."}
],
"confidence": 0.84,
"sources": [
{"id":"deploying-a-fastify-vue-3-static-site-to-heroku","title":"Deploying a Fastify & Vue 3 Static Site to Heroku"},
{"id":"introducing-changesets-simplify-project-versioning-with-semantic-releases","title":"Introducing Changesets: Simplify Project Versioning with Semantic Releases"}
]
}
`;