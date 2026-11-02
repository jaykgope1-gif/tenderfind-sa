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
| **TenderFind SA - Daily update trigger** | workflow | 04:47 SA time: starts the GitHub Action via `workflow_dispatch`, checks it every minute until it finishes (max 40 min), logs `github_update` ok / failed, retries once, then emails the owner. Needs the **GitHub – tenderfind** credential on its three GitHub steps. |
| **TenderFind SA - Sign-ups from Tally** | workflow (on) | Tally webhook → checks email and consent → saves to the subscribers table. A repeat sign-up updates trades/provinces but keeps the first sign-up date (the free trial can't be restarted) and the status. Only accepts requests with the `x-tenderfind-key` header; the value lives only in this workflow's webhook settings and in Tally. |
| **TenderFind SA - Morning email alerts** | workflow (off) | 06:45 SA time: reads the alerts file and the subscribers table, matches, emails each subscriber, logs `daily_update` and `email_alerts`. Contains a **send-only list** that blocks every address except the owner's until it is emptied. |
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

## Before switching alerts on for real subscribers

1. Create the **GitHub – tenderfind** credential in n8n. Open the trigger workflow, open "Start GitHub daily update", and use Credential → Create new (templated auth, `Authorization: Bearer {{api_key}}`). Pick it in "Find the run" and "Check the run" too, and save.
2. Put the current webhook key in Tally: form → Integrations → Webhooks → HTTP headers → `x-tenderfind-key`.
3. Run the trigger workflow once by hand and check the run log shows `github_update ok`.
4. Switch the trigger workflow on, and check the run log after one unattended morning.
5. Sign up once with the owner's email through the live form, check the next morning's email, then delete that row.
6. Owner's go-ahead: empty `SEND_ONLY_TO` in "Match tenders to subscribers" and switch on "Morning email alerts".
