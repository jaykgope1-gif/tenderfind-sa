# TenderFind SA

Every open South African government tender, in plain English, on your phone.

**Live site:** https://tenderfind.co.za/

TenderFind SA is a fast, mobile-first search engine for South African government tenders. It updates itself every morning from National Treasury's eTenders open-data feed, reads the tender documents to find briefing sessions and CIDB grades, and publishes a static website on GitHub Pages. Running it costs nothing. The only optional cost is AI help with reading documents.

> "TenderFind SA" is a working name. The final name and domain are still to be decided.

---

## What people get

- **Search** any word ("security guarding", "Polokwane", "cleaning"). Results are ranked, with title matches first.
- **Filters** for trade, province, closing date, buyer, newly published, and briefing sessions.
- **Plain-English details** for every tender: what they want, who is buying, where, closing date, briefing session, CIDB grade, B-BBEE level, CSD requirement, and the documents.
- **"What you'll need to submit"** on every open tender: the returnable documents and forms its own tender documents list (SBD/MBD forms, CSD report, tax PIN, CIDB, B-BBEE and more), each with the document's own words as evidence. If the documents can't be read, the page says "Check the tender documents. We couldn't read them automatically."
- **"Closing soon" badges**, countdowns and a "Did you miss these?" list.
- **A page per tender** (`/tender/<id>.html`) that shares nicely on WhatsApp and can be found on Google.
- **Closed tenders** keep their page for a year, saying "This tender has closed" with similar open tenders.
- **A sign-up box** on every page for morning tender alerts by trade and province, **by email for now** (WhatsApp later): 14 days free, then the Alerts plan (see **Pricing** below).
- **Done-for-you services:** Bid Help per tender and Tender Desk (monthly), requested through `/help.html`, plus `/partners.html` for organisations that want alerts for their members.
- **Light first load:** about 40 KB on the search page. The sign-up form only loads when tapped.

### The one rule: never invent tender details

If a detail isn't in the eTenders feed or the tender documents, the site says **"Not stated — check the tender documents"** and links to them. Anything read from documents by a computer is labelled **"auto-extracted, confirm before bidding"**.

---

## How it works

Every morning a GitHub Action (`.github/workflows/daily.yml`) runs these steps. It is started at **04:47 SA time by n8n** (workflow "TenderFind SA - Daily update trigger", which waits for it, logs the result and retries once), with GitHub's own timer at **05:47** as a backup. GitHub's timer on its own proved unreliable: it never fired for this repository.

```
eTenders API ──► fetch.js ──► extract.js ──► build.js ──► check-site.js ──► GitHub Pages
                 new/changed   reads PDFs     writes the     refuses to
                 tenders       of new ones    whole site     publish a broken site
```

1. **`scripts/fetch.js`** downloads the last 3 days of tender releases and merges them into `data/tenders.json`.
   - New tenders get a "New" badge.
   - Changed closing dates or documents get an "Updated" badge.
   - Closed tenders move to `data/archive/<month>.json`.
   - If the eTenders API is down, it keeps yesterday's data.
2. **`scripts/extract.js`** downloads the PDFs of new or changed tenders only. It finds briefing sessions, CIDB grades, B-BBEE minimums and CSD requirements with pattern matching, and the "What you'll need to submit" checklist (`scripts/lib/checklist.js`). Results are cached in `data/extracted.json`, so each tender is read once.
   - Tenders read before the checklist existed are re-read for it only, up to 150 a day (`--backfill N` to change; `--cache <file>` to test on a copy).
   - If `ANTHROPIC_API_KEY` is set, Claude Haiku helps when pattern matching finds nothing.
   - Without the key, everything still works.
3. **`scripts/build.js`** tags each tender with a trade and province, then writes the site into `site/`:
   - the search data
   - one page per tender
   - about and privacy pages
   - `sitemap.xml`, `robots.txt` and `404.html`
4. **`scripts/alerts.js`** writes the day’s alerts file (used for the email alerts now, WhatsApp later): tenders new today and tenders closing in 3 days, grouped by trade and province. It goes to `data/alerts/<date>.json` and is published at `/alerts/latest.json` for n8n. See [docs/email-alerts.md](docs/email-alerts.md).
5. **`scripts/check-site.js`** stops the deploy if there are fewer than 20 tenders or any file is missing. **The site is never published empty.** Yesterday's version stays live instead.
6. The job saves the updated data back to the repository and publishes `site/` to GitHub Pages.

You can also run it any time: on GitHub, go to **Actions → Daily update → Run workflow**.

---

## Folders

| Path | What it is |
|---|---|
| `site/` | The website: `index.html`, `app.js` (search), `format.js` (display rules shared with the build), `signup.js`, `style.css` |
| `site/data/`, `site/tender/`, `site/*.html` (except index), `sitemap.xml`, `robots.txt` | Generated by `build.js`. Not stored in git. |
| `scripts/` | The daily pipeline (fetch, extract, build, check) and a local preview server |
| `scripts/lib/normalise.js` | Turns an eTenders record into a tender, and holds the **trade rules** |
| `scripts/lib/provinces.js` | Works out the **province** from the buyer's name |
| `scripts/lib/pages.js`, `info-pages.js` | Tender pages, about/privacy pages, sitemap |
| `scripts/lib/config.js` | **Settings you edit:** site address, operator contact details and **all prices** |
| `data/tenders.json` | All open tenders (saved daily by the Action) |
| `data/extracted.json` | What was found in each tender's documents |
| `data/archive/` | Closed tenders, one file per month |
| `data/alerts/` | Daily alerts files for the alert sender (60 days) |
| `scripts/lib/checklist.js` | Finds "What you'll need to submit" in the document text (tested by `scripts/test-checklist.js`) |
| `scripts/lib/prices.js` | Turns PRICING into the price text every page shows |
| `scripts/lib/match.js` | Who gets which tenders, by email or WhatsApp: the same code runs inside n8n (tested by `npm test`) |
| `docs/email-alerts.md` | **What runs today:** the n8n workflows, tables, sign-up webhook and the go-live checklist |
| `docs/n8n-alerts.md` | The later WhatsApp design: templates, STOP handling, Meta setup |
| `data/fetch-log.json` | The last 60 daily runs: how many tenders, errors |

---

## Settings

Edit **`scripts/lib/config.js`**:

- `SITE_URL`: the public address. Change it when you add your own domain.
- `OPERATOR`: your name or business, email and WhatsApp number. These appear on the privacy page as the POPIA responsible party and contact. The WhatsApp number also turns on the "WhatsApp us to subscribe" button on /pricing. **Fill this in before promoting sign-ups.**
- `PRICING`: **every price on the site**, and the trial length. See **Pricing** below for what each one is and what else to change with it.
- `PAYMENTS_LIVE`: stays `false` until the real PayFast account is approved.

Other settings:

- **WhatsApp contact button** on the search page: set `CONTACT_WHATSAPP` near the top of `site/app.js`.
- **AI help with documents** (optional): on GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**. Name it `ANTHROPIC_API_KEY` and paste your key. Remove the secret to switch AI off.

---

## Pricing

All prices live in `PRICING` in `scripts/lib/config.js`. Nothing on the site has a price typed in by hand: the pages get them through `scripts/lib/prices.js`, and the hand-written home page marks its prices as `<span data-price="alerts">R149</span>`, which `build.js` fills in. `check-site.js` refuses to deploy a stale home-page price or a leftover old price.

| Plan | Key(s) | Price now | How people buy it |
|---|---|---|---|
| Free | | R0 | search on the site |
| **Alerts** (main plan) | `alerts`, `alertsYear`, `trialDays` | R149 a month / R1,490 a year, 14 days free | sign-up box, then WhatsApp or pay link |
| **Pro** | `pro`, `proYear`, `proEmails` | R499 a month / R4,990 a year | WhatsApp or help form (`?service=pro`) |
| **Bid Help** | `bidHelpFrom`, `bidHelpMax` | from R1,500 per tender, quoted up to R5,000 | help form (`?service=bid`) |
| **Tender Desk** | `deskFrom` | from R3,500 a month | WhatsApp ("Book a call") or help form (`?service=tender-desk`) |
| CSD / CIDB help | `csdHelpPrice`, `cidbHelpPrice` | R300 / R500 | help form |
| Partners (bulk seats) | `partnerFrom`, `partnerMembers` | from R5,000 a month for 100 members | `/partners.html`, help form (`?service=partner`) |

**Pro** is Alerts plus: the same email to up to 3 addresses, the "What you'll need to submit" list under each tender in the email, and priority WhatsApp support (answered first by the owner). It's switched on per subscriber in n8n (see [docs/email-alerts.md](docs/email-alerts.md)).

**When you change a price, also change:**

1. `scripts/lib/match.js` (it runs inside n8n and can't read config.js): `ALERTS_PRICE`, `BID_HELP`, `TRIAL_DAYS` and `PRO_EMAILS`. `npm test` fails until they match `PRICING`. Then paste `match.js` into n8n.
2. The n8n "Payments: pay link" workflow's own price list (monthly, annual, bid, csd, cidb).
3. The Terms page says price changes are emailed to subscribers 20 working days before they apply to them.

## Sign-ups (Tally → n8n)

The sign-up form is a Tally form: https://tally.so/r/EqKWVX. It asks for:

- name and business name
- **email address** (required): alerts go by email for now
- trade(s) and province(s)
- WhatsApp number (optional, for when WhatsApp alerts start)
- whether to get "closing in 3 days" reminders
- the required POPIA consent: "I agree to receive tender alerts by email, and on WhatsApp if I gave my number. I can unsubscribe at any time."

A hidden `page` field records which page the person signed up from.

Each sign-up goes from Tally's webhook to n8n, which saves it in the **TenderFind subscribers** data table. No Google Sheet is needed. The webhook only accepts requests carrying a private header key, which is kept in n8n and Tally and never in this repository. See [docs/email-alerts.md](docs/email-alerts.md).

To edit the questions, use the Tally editor and click **Publish**. The website doesn't need changing. If you rename a question, check the names used in n8n's "Parse Tally sign-up" step. If you ever create a different form, put its ID in `site/signup.js` and `scripts/lib/pages.js`.

---

## Trades and provinces

- **Trades:** Cleaning, Security, Construction, Maintenance & repairs, Catering, IT, Transport, Supplies, Professional services, Other.
  - Each trade is a keyword list in `scripts/lib/normalise.js`. The first match wins, so the order matters.
  - The title is checked first, then the description, then the feed's own category.
  - Change a rule and the next build re-tags everything. No refetch is needed.
- **Province:** taken from the tender text when it names exactly one province. Otherwise it comes from the buyer: municipalities, metros and provincial departments are mapped in `scripts/lib/provinces.js`.
  - National departments and SOEs show as **National**.

---

## Running it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm ci                 # install, once
npm run daily          # fetch → extract → build (takes a few minutes the first time)
npm run serve          # preview at http://localhost:8080
```

Useful extras:

```bash
node scripts/fetch.js --days 7             # look back further than 3 days
node scripts/extract.js --ids 176422       # re-read one tender's documents
node scripts/check-site.js                 # the same safety check the Action runs
npm test                                   # check the email and WhatsApp matching
```

---

## When something goes wrong

- **n8n emails you** if the morning update fails twice, or if the alerts file isn't today's. The **TenderFind run log** table in n8n shows every morning's result.
- **GitHub emails you about a failed run.** Open **Actions**, click the red run, and read the step that failed. The live site keeps yesterday's data, so nobody sees a broken page.
- **"eTenders API unreachable; kept previous data"** in the log means the government API was down. Nothing to do; tomorrow's run catches up. The `fetch.js` step looks back 3 days.
- **A tender is in the wrong trade:** adjust the keywords in `scripts/lib/normalise.js`, then run `npm run build` to check.
- **Some tenders show "Not stated" for briefing/CIDB:** their documents are scanned images, zip or Word files, or don't state it. The link to the documents is always there.

---

## Data and disclaimer

Tender data comes from National Treasury eTenders (public domain) via the official OCDS API (`ocds-api.etenders.gov.za`). TenderFind SA is independent and not part of government. Always confirm details on the official portal before bidding.

## Roadmap

- **Pricing and services (Nov 2026, built; not yet live until approved):** Pro, Bid Help from R1,500, Tender Desk, the partners page, and "What makes TenderFind different" on the home and pricing pages. See **Pricing**.
- **"What you'll need to submit" (built):** from the tender documents only, on every tender page and in Pro emails. Older tenders get it within about 5 daily runs (backfill of 150 a day).
- **Coming soon (shown as such on /pricing):** tenders that municipalities and state companies put only on their own websites, and private-sector tenders. Neither is fetched yet.
- **Award data (not available):** we wanted to save who won each tender and for how much. National Treasury's eTenders open-data feed (`ocds-api.etenders.gov.za`) doesn't publish it: the `awards` field was empty in every release sampled in Nov 2026 (releases from 2024, 2025 and Aug–Nov 2026), and the API has only the two release endpoints. Nothing is collected. Revisit if the feed starts publishing awards.

- **Email alerts (live since 2 Nov 2026):** n8n workflows, subscriber and run-log tables, and the go-live checklist are in [docs/email-alerts.md](docs/email-alerts.md).
- **WhatsApp alerts (designed):** templates, STOP handling and WhatsApp Business setup are in [docs/n8n-alerts.md](docs/n8n-alerts.md). They start once a Meta WhatsApp Business account is approved.
- **Phase F (done):** `/pricing.html` (Free / Alerts / Bid Help) and subscriber status (Trial / Paying until a date / Cancelled) with a 14-day trial. The rules are in `scripts/lib/match.js`, and how to record a payment is in [docs/n8n-alerts.md §2a](docs/n8n-alerts.md#2a-subscriber-status-trial-and-payments-phase-f).
