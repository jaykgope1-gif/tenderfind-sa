# Installed Claude Code skills

This file lists every skill copied into `.claude/skills/` in this repo: what it does, where it came from, which version, and how to remove it.

## How these work

- A skill is a folder with a `SKILL.md` file. Claude reads the short description at the top and only opens the rest when your request matches.
- Skills in `.claude/skills/` load automatically for anyone who opens this repo in Claude Code, including cloud sessions. Nothing to switch on.
- To use one by name, type `/` and its name (for example `/humanizer`), or just ask for the task in plain words.
- These are copies. They do not update themselves. To update, copy the newer folder from the source repo and change the version line below.

## Security check

Every skill here passed the same check before it was copied (Nov 2026): read-only download, a scan of every file for download-and-run commands, sending data out, reading secrets, deleting files, hidden instructions, permission bypass, hidden characters and symlinks. Every match was read by hand. All matches were teaching examples (for example a security guide showing what an attack looks like), not things the skill does to you. None of these skills add hooks or MCP servers.

What some skills can do when you use them:

- `supply-chain-risk-auditor` looks up your packages on public sites (deps.dev, osv.dev, npmjs.org, scorecard.dev, api.github.com). It uses your GitHub login token from the `gh` tool if you have one, only to call GitHub.
- `webapp-testing` starts your app locally and opens it in a browser.
- `skill-scanner` and `supply-chain-risk-auditor` run small Python scripts with `uv`.
- The small-business skills only use tools you have connected (Gmail, a CRM and so on), and ask before sending anything.

## Small business (Anthropic)

Source: https://github.com/anthropics/knowledge-work-plugins · Licence: Apache-2.0

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `grant-rfp-writer` | Finds tenders and grants you qualify for, does a go/no-go check, then drafts the response. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/grant-rfp-writer) |
| `proposal-builder` | Turns call notes, a voice memo, photos or an RFP into a priced proposal. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/proposal-builder) |
| `lead-finder` | Builds a ranked list of likely customers, with a reason for each. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/lead-finder) |
| `lead-triage` | Scores new leads in HubSpot and ranks who to call today, with talking points. | 0.1.1 | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/lead-triage) |
| `outreach-composer` | Writes first-touch and follow-up messages in your voice. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/outreach-composer) |
| `speed-to-lead` | Watches your forms, inbox and CRM so no new enquiry goes unanswered, and drafts quick replies. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/speed-to-lead) |
| `reactivate` | Finds old customers worth contacting again and drafts the messages. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/reactivate) |
| `invoice-chase` | Drafts overdue-invoice reminders using your accounting tool (Xero, QuickBooks and others). | 0.3.0 | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/invoice-chase) |
| `cash-flow-snapshot` | Shows money in, money out and what is coming, from your accounting or payments tool. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/cash-flow-snapshot) |
| `social-content-engine` | Keeps a rolling posting calendar in your voice and drafts the posts. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/social-content-engine) |
| `seo-ai-visibility` | Checks how your business shows up in Google and AI answers. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/seo-ai-visibility) |
| `review-reputation` | Gathers Google, Facebook and other reviews and drafts replies. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/review-reputation) |
| `contract-review` | Reviews NDAs, service and supplier contracts and flags risky clauses in plain English. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/contract-review) |
| `brand-style` | Saves your colours, fonts and tone so documents look like you. | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/brand-style) |
| `smb-onboard` | Guided first-time setup: connects your first tools and learns about your business (brand-style uses its checklists). | not numbered (see commit) | [`0e0fcacddcc8`](https://github.com/anthropics/knowledge-work-plugins/tree/0e0fcacddcc892eb92a1b7873ff9d68159c47571/small-business/skills/smb-onboard) |

## Marketing (Corey Haines)

Source: https://github.com/coreyhaines31/marketingskills · Licence: MIT

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `copywriting` | Writes landing page, homepage and sales copy. | 2.3.6 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/copywriting) |
| `copy-editing` | Tightens and fixes copy you already have. | 2.2.4 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/copy-editing) |
| `cold-email` | Writes cold email sequences that sound human. | 2.2.7 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/cold-email) |
| `emails` | Writes welcome, nurture and launch email sequences. | 2.1.9 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/emails) |
| `content-strategy` | Plans what content to make and why. | 2.1.8 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/content-strategy) |
| `launch` | Plans a product or feature launch. | 2.2.4 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/launch) |
| `lead-magnets` | Designs free guides, checklists and tools that collect leads. | 2.1.5 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/lead-magnets) |
| `offers` | Shapes a stronger offer (what you sell, guarantee, bonuses). | 1.0.6 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/offers) |
| `pricing` | Helps set prices and packages. | 2.1.7 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/pricing) |
| `cro` | Finds why a page is not converting and what to change. | 2.0.6 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/cro) |
| `prospecting` | Researches target companies and contacts before outreach. | 1.6.3 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/prospecting) |
| `ad-creative` | Writes ad concepts, hooks and variations. | 2.13.5 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/ad-creative) |
| `social` | Writes platform-specific social posts and threads. | 2.6.0 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/social) |
| `marketing-psychology` | Applies buying psychology to copy and offers. | 2.0.3 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/marketing-psychology) |
| `customer-research` | Turns reviews, calls and surveys into customer insights. | 2.0.8 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/customer-research) |
| `competitor-profiling` | Builds a profile of a competitor. | 2.1.9 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/competitor-profiling) |
| `seo-audit` | Audits a site for search problems. | 2.2.9 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/seo-audit) |
| `ai-seo` | Helps your site get cited by ChatGPT, Gemini and other AI tools. | 2.12.7 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/ai-seo) |
| `schema` | Adds structured data so search engines understand your pages. | 2.0.5 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/schema) |
| `site-architecture` | Plans site pages, navigation and URLs. | 2.1.3 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/site-architecture) |
| `product-marketing` | Creates the one context file the marketing skills read first (.agents/product-marketing.md). | 2.2.3 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/product-marketing) |
| `ads` | Plans, audits and scales paid ads (Meta, Google and others). | 2.7.9 | [`5b2b400eec1e`](https://github.com/coreyhaines31/marketingskills/tree/5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1/skills/ads) |

## Building and testing (Anthropic)

Source: https://github.com/anthropics/skills · Licence: Apache-2.0

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `frontend-design` | Makes web pages look designed, not generic. | not numbered (see commit) | [`e4bb5d960d87`](https://github.com/anthropics/skills/tree/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/frontend-design) |
| `webapp-testing` | Tests a local web app in a real browser with Playwright. | not numbered (see commit) | [`e4bb5d960d87`](https://github.com/anthropics/skills/tree/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing) |

## Automation with n8n (official n8n)

Source: https://github.com/n8n-io/skills · Licence: Apache-2.0

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `n8n-agents-official` | Builds n8n Agents (AI that decides its own steps). | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-agents-official) |
| `n8n-ai-nodes-official` | Sets up AI nodes inside n8n workflows. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-ai-nodes-official) |
| `n8n-binary-and-data-official` | Handles files, images and data passing between nodes. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-binary-and-data-official) |
| `n8n-code-nodes-official` | Writes Code nodes (JavaScript or Python) in n8n. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-code-nodes-official) |
| `n8n-credentials-and-security-official` | Sets up logins and keys in n8n safely. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-credentials-and-security-official) |
| `n8n-data-tables-official` | Uses n8n Data Tables to store records. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-data-tables-official) |
| `n8n-debugging-official` | Finds why an n8n workflow failed. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-debugging-official) |
| `n8n-error-handling-official` | Adds retries and error alerts to workflows. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-error-handling-official) |
| `n8n-expressions-official` | Writes n8n expressions ({{ }}) correctly. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-expressions-official) |
| `n8n-extending-mcp-official` | Exposes n8n workflows as tools Claude can call. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-extending-mcp-official) |
| `n8n-loops-official` | Loops over many items without breaking. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-loops-official) |
| `n8n-node-configuration-official` | Configures individual n8n nodes correctly. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-node-configuration-official) |
| `n8n-subworkflows-official` | Splits big workflows into reusable pieces. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-subworkflows-official) |
| `n8n-workflow-lifecycle-official` | Builds, tests and publishes a workflow from start to finish. | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-workflow-lifecycle-official) |
| `using-n8n-skills-official` | Ground rules for all n8n work and which n8n skill to use. (In the plugin a startup hook loads it; here it loads when you mention n8n.) | not numbered (see commit) | [`626f50fdf293`](https://github.com/n8n-io/skills/tree/626f50fdf2934116eea2c5469339e03d2d524e83/skills/using-n8n-skills-official) |

## Security (Sentry)

Source: https://github.com/getsentry/skills · Licence: Apache-2.0

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `sentry-security-review` | Reviews code for real, exploitable security holes. | not numbered (see commit) | [`a582c51ee29d`](https://github.com/getsentry/skills/tree/a582c51ee29d0f35e6ac321340796f77d43da733/skills/security-review) |
| `skill-scanner` | Security-checks a new skill before you install it. | not numbered (see commit) | [`a582c51ee29d`](https://github.com/getsentry/skills/tree/a582c51ee29d0f35e6ac321340796f77d43da733/skills/skill-scanner) |

## Security (Trail of Bits)

Source: https://github.com/trailofbits/skills · Licence: CC-BY-SA-4.0

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `differential-review` | Security review of a change or pull request. | not numbered (see commit) | [`149d7b21f406`](https://github.com/trailofbits/skills/tree/149d7b21f4067765b82e67029730b42d228ef4b4/plugins/differential-review/skills/differential-review) |
| `sharp-edges` | Finds APIs and settings that are easy to misuse. | not numbered (see commit) | [`149d7b21f406`](https://github.com/trailofbits/skills/tree/149d7b21f4067765b82e67029730b42d228ef4b4/plugins/sharp-edges/skills/sharp-edges) |
| `supply-chain-risk-auditor` | Checks whether your project's packages are risky. | not numbered (see commit) | [`149d7b21f406`](https://github.com/trailofbits/skills/tree/149d7b21f4067765b82e67029730b42d228ef4b4/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor) |

## Writing

Source: https://github.com/blader/humanizer · Licence: MIT

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `humanizer` | Rewrites AI-sounding text so it sounds like you. | 4.0.0 | [`a32f24407364`](https://github.com/blader/humanizer/tree/a32f24407364c74c812b43c15926d638bee1e072/) |

## Website quality (Addy Osmani)

Source: https://github.com/addyosmani/web-quality-skills · Licence: MIT

| Skill | What it does | Version | Source commit |
|---|---|---|---|
| `accessibility` | Checks a site works for people with disabilities. | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/accessibility) |
| `best-practices` | Checks a site for security and modern web best practice. | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/best-practices) |
| `core-web-vitals` | Fixes Google page-speed scores (LCP, INP, CLS). | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/core-web-vitals) |
| `performance` | Makes a site load faster. | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/performance) |
| `web-quality-audit` | Runs all of the website quality checks together. | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/web-quality-audit) |
| `seo` | Technical search checks for a site (web-quality version). | 2.0 | [`afa8da942115`](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/seo) |


## How they were tested (20 Nov 2026)

1. **They load.** A fresh Claude Code session started in this repo listed all 66 skills, and correctly said a made-up skill name did not exist.
2. **They work on real tasks.** Eleven separate Claude Code runs. Each run had to open the named skill (checked in the run log), and none could edit files:

| Skill | Small real task | Result |
|---|---|---|
| `humanizer` | Rewrite a TenderFind README paragraph | Worked. Kept every fact |
| `cold-email` | Cold email to a Gauteng cleaning company | Worked. Used only claims the README supports |
| `grant-rfp-writer` | Go/no-go on a real open cleaning tender for a made-up business | Worked. Said "not stated" where the data was silent |
| `web-quality-audit` | Audit the TenderFind site files | Worked. Found real issues (focus ring contrast, no phone menu) |
| `sentry-security-review` | Review `serve.js` and `alerts.js` | Worked. No exploitable issues, one small hardening note |
| `n8n-expressions-official` | Closing-date expression for the alerts workflow | Worked. Applied the skill's rules |
| `skill-scanner` | Scan the installed `humanizer` skill with its script | Worked. Clean |
| `supply-chain-risk-auditor` | Check TenderFind's npm packages | Ran, but partial: this cloud session's network blocks osv.dev, and GitHub lookups had no login. Works fully on a normal computer |
| `webapp-testing` | Start the site locally, search "cleaning", screenshot | Worked |
| `differential-review` | Security review of the CoachOS rename pull request | Worked. Low risk, no findings |
| `contract-review` | Made-up sample NDA (not a real contract) | Worked. Flagged unlimited indemnity, IP grab, Delaware courts |

The other skills share files, format and authors with the ones tested above.

## Other files that came with them

- `.claude/shared/` holds notes the small-business skills read (voice, currency, privacy rules). Keep it while any small-business skill is installed. Source: anthropics/knowledge-work-plugins, folder `small-business/shared`, same commit as above, Apache-2.0.
- `.claude/agents/adversarial-modeler.md` is a helper used by `differential-review`. Source: trailofbits/skills `plugins/differential-review/agents/`. CC-BY-SA-4.0.
- `.claude/agents/sharp-edges-analyzer.md` is a helper used by `sharp-edges`. Source: trailofbits/skills `plugins/sharp-edges/agents/`. CC-BY-SA-4.0.

Each skill folder keeps its original LICENSE file. Example and test folders (`evals/`) were left out because Claude never uses them.

## Changes made to the originals

- `sentry-security-review`: renamed from `security-review` so it does not clash with Claude Code's built-in `/security-review` command. Only the folder name and the `name:` line changed.
- `differential-review`: the helper agent name `differential-review:adversarial-modeler` was changed to `adversarial-modeler`, because outside a plugin the agent has no prefix.
- Nothing else was changed.

## Left out on purpose

- Word, Excel, PowerPoint and PDF skills (anthropics/skills `docx`, `xlsx`, `pptx`, `pdf`): your Claude account already has them, so a second copy would just compete with the first.
- Some skills mention companion skills that are not installed (`crm-autopilot`, `build-connector`, `grow-pipeline`, `call-list`, `marketing-monday`, `conversion-tracking` and similar). These are optional "next step" suggestions. The skills work without them.

## How to remove

One skill: delete its folder, then remove its row from this file.

```bash
git rm -r .claude/skills/SKILL-NAME
```

Everything this install added:

```bash
git rm -r .claude/skills .claude/shared .claude/agents/adversarial-modeler.md .claude/agents/sharp-edges-analyzer.md .claude/.gitignore SKILLS.md
```

Then commit. Your next Claude Code session will no longer load them.
