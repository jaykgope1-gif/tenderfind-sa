# Email alerts: what runs today

Tender alerts go by email while WhatsApp Business is being set up. Everything runs in n8n Cloud (https://jaykgope.app.n8n.cloud), in the owner's personal project. No Google Sheet and no extra server are needed.

```
04:47  n8n "Daily update trigger" ──► GitHub Action "Daily update" ──► site + /alerts/latest.json
       (waits, logs to run log, retries once, emails owner if it fails twice)
05:47  GitHub's own timer (backup only; often skipped by GitHub)

any time  Tally form ──webhook──► n8n "Sign-ups from Tally" ──► subscribers table

06:45  n8n "Morning email alerts"
         ├─ alerts file not today's? log STALE, email owner, send nothing
         ├─ read subscribers table ──► match (scripts/lib/match.js) ──► Gmail, one email each
         └─ write results to run log
```

## The n8n pieces

| Piece | Type | What it does |
|---|---|---|
| **TenderFind SA - Daily update trigger** | workflow (on) | 04:47 SA time: starts the GitHub Action via `workflow_dispatch`, checks it every minute until it finishes (max 40 min), logs `github_update` ok / failed, retries once, then emails the owner. Needs the **GitHub – tenderfind** credential on its three GitHub steps. |
| **TenderFind SA - Sign-ups from Tally** | workflow (on) | Tally webhook → checks email and consent → saves to the subscribers table. A repeat sign-up updates trades/provinces but keeps the first sign-up date (the free trial can't be restarted) and the status. Only accepts requests with the `x-tenderfind-key` header; the value lives only in this workflow's webhook settings and in Tally. |
| **TenderFind SA - Morning email alerts** | workflow (**live since 2 Nov 2026**) | 06:45 SA time: reads the alerts file and the subscribers table, matches, emails every consented, non-cancelled subscriber, logs `daily_update` and `email_alerts`. Its **send-only list** is empty; putting the owner's address back in it pauses sending to everyone else. |
| **TenderFind subscribers** | data table | email, whatsapp, name, business, trades, provinces, reminders, consent, consent_text, signup_date, status, paid_until, submission_id, is_test |
| **TenderFind run log** | data table | run_date, kind (`github_update`, `daily_update`, `email_alerts`), result, details |

The matching step contains a copy of `scripts/lib/match.js` (email channel). If you change the matching rules, run `npm test` and paste the updated file into that step.

## Subscriber status

Edit the **status** column in the subscribers table:

- **Trial** (default): free for 14 days from the first sign-up. On day 15 they get one "your trial has ended" email, then nothing until they pay.
- **Paying**: put the end of the paid month in **paid_until** (YYYY-MM-DD). Alerts run until that date.
- **Cancelled**: nothing is sent. Use this when someone replies UNSUBSCRIBE (those replies arrive in the owner's Gmail).

## Each email

Subject like "4 new tenders for you, Mon, 02 Nov". Up to 10 new tenders (title, buyer, closing date, link), a link to see the rest, up to 3 "closing in 3 days" reminders if they asked, and an unsubscribe line on every email. Sent from the owner's Gmail as "TenderFind SA". A normal Gmail account can send about 500 emails a day.

## Go-live record (2 Nov 2026)

Final checks before switching on real sending, all passed:

1. n8n started the GitHub update, it succeeded, and the run log says `github_update ok`.
2. One alert email reached the owner (test mode).
3. A subscriber set to **Cancelled** got nothing (dry run).
4. An alerts file that isn't today's blocks every email and logs **STALE** (dry run).

Then the test subscriber rows were deleted and the send-only list emptied. The first real alerts go out at 06:45 the next morning.

**Each morning, check the run log for:** `github_update ok` (about 04:50), `daily_update ok` and `email_alerts N sent` (about 06:46). No `email_alerts` line means nobody had matching tenders, or there were no subscribers yet.
