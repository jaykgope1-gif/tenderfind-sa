# WhatsApp tender alerts: n8n design

How the morning WhatsApp alerts work, from the Google Sheet of sign-ups to one message per subscriber. This is a design: nothing here sends messages yet. Sending needs a WhatsApp Business account (section 5), which costs money per message.

```
05:17  GitHub Action ──► site/alerts/latest.json   (new tenders + closing in 3 days, by trade → province)
06:30  n8n "Morning alerts"
         ├─ download latest.json  ── not today's? stop and email you
         ├─ read Google Sheet: Responses (Tally) + Status + Log
         ├─ match (scripts/lib/match.js): ≤5 new tenders per subscriber, own province first
         ├─ send WhatsApp template, one per subscriber (+ optional reminder)
         └─ append every send / failure to the Log tab
any time  n8n "Replies"
         └─ STOP → Status = Cancelled, confirm · START → Status = Resumed, confirm
```

---

## 1. The alerts file

`scripts/alerts.js` runs in the daily GitHub Action after the build. It writes `data/alerts/<date>.json` (kept 60 days in git) and publishes:

- `https://jaykgope1-gif.github.io/tenderfind-sa/alerts/latest.json`, which n8n reads
- `…/alerts/<date>.json` for the last 14 days

```json
{
  "date": "2026-11-02",
  "counts": { "new": 142, "closing_soon": 16 },
  "new": {
    "Cleaning": {
      "Gauteng":  [ { "id": "176230", "title": "…", "buyer": "…", "province": "Gauteng", "trade": "Cleaning",
                      "closing": "2026-11-06T12:00:00+02:00", "closing_text": "Fri, 06 Nov 2026, 12:00",
                      "briefing": "Compulsory briefing · Tue 3 Nov · 11:00", "compulsory_briefing": true,
                      "cidb": null, "url": "https://…/tender/176230.html" } ],
      "National": [ … ]
    }
  },
  "closing_soon": { "same shape": "tenders closing exactly 3 days from today" }
}
```

- **New** means first seen by today's run and published in the last 3 days. A backfill of old tenders therefore never floods anyone.
- **closing_soon** means the closing date is exactly 3 days away, so each tender triggers at most one reminder.
- Tenders whose province is **National** or **Not stated** go to subscribers in every province. The sign-up form tells people this.
- Briefing and CIDB values come from the tender documents. Every message links to the tender page, which shows the "confirm before bidding" note.

## 2. The Google Sheet

Tally fills the first tab. Add two tabs by hand, with these exact headings in row 1.

| Tab | Columns | Written by |
|---|---|---|
| **Responses** (Tally's tab, keep its name) | Your name · Business name · Your trade(s) · Province(s) you can work in · WhatsApp number · Also remind me 3 days before matching tenders close? · Consent · page · Submitted at … | Tally, automatically |
| **Status** | Phone · Status · Paid until · Changed · Note | n8n (STOP/START) and you (payments) |
| **Log** | Date · Phone · Kind · Template · Tender IDs · Message ID · Result | n8n, one row per message |

The rules (all in `scripts/lib/match.js`):

- **Status:** see section 2a. In short: everyone starts on a 14-day free trial, **Paying** runs until its "Paid until" date, and **Cancelled** never gets anything.
- **Repeat sign-ups:** if a number signed up twice, the newest sign-up is used, because people re-sign to change trades.
- **No consent, no message.** Rows without the consent box ticked are skipped.
- **One morning message per number per day.** Numbers already in today's Log are skipped, so re-running the workflow never double-sends.

Never edit the Responses tab by hand. To stop or pause someone, add a line to Status.

## 2a. Subscriber status, trial and payments (Phase F)

The Status tab is read top to bottom, one line per change, so it doubles as a history. For each number:

| Status line | Meaning | Who writes it |
|---|---|---|
| *(no line yet)* | **Trial**: free for 14 days from the person's **first** sign-up (sign-up day is day 1) | — |
| **Trial** | Back on trial terms (it still ends 14 days after the first sign-up, so it can't be used to extend a trial) | you |
| **Paying** + *Paid until* `2026-12-15` | Alerts run until and including that date. Blank date = no end. | you, when payment arrives |
| **Cancelled** | No messages at all. "Stopped" means the same. | Workflow B on STOP, or you |
| **Resumed** | Undo Cancelled; whatever applied before (trial or paid period) carries on | Workflow B on START |

What each morning run does (`access()` in `match.js`):

- **Paying**, and today is on or before *Paid until*: alerts as normal.
- **Paying**, but *Paid until* has passed: nothing is sent, and the summary lists the number as "payment due" so you can follow up.
- **Trial**, days 1–14: alerts as normal.
- **Day 15**: one `trial_ended` message instead of alerts. Nothing is charged automatically.
- **Day 16 onwards** without a Paying line: nothing.
- **Cancelled**: nothing, ever, until START.

**Taking a payment (manual for now).**

1. Someone taps "WhatsApp us to subscribe" on /pricing, or replies to the trial-ended message.
2. You send your payment details.
3. When the money arrives, add a line to Status: Phone, **Paying**, *Paid until* one month on (e.g. paid 15 Nov → 15 Dec), Changed = today, Note = "R149 EFT".
4. To renew, add another Paying line with the new date.

If you later add card payments (PayFast, Yoco, Paystack and similar can send a webhook), an n8n workflow can write these Paying lines automatically. Nothing else changes.

## 3. Workflow A: "Morning alerts"

| # | Node | Settings |
|---|---|---|
| 1 | **Schedule Trigger** | Every day 06:30, timezone Africa/Johannesburg. The GitHub job runs at 05:17 (backup 06:07) and takes about 2 minutes, plus a few more for Pages to publish. |
| 2 | **HTTP Request** "Get alerts" | GET `https://jaykgope1-gif.github.io/tenderfind-sa/alerts/latest.json?d={{$now.toFormat('yyyyLLdd')}}`. The query string avoids a cached copy. |
| 3 | **IF** "Is today's file?" | `{{$json.date}}` equals `{{$now.setZone('Africa/Johannesburg').toFormat('yyyy-LL-dd')}}`. **False:** send yourself an email/WhatsApp ("Tender data didn't update today, alerts not sent") and stop. Never send yesterday's tenders as new. |
| 4 | **Google Sheets** "Read sign-ups" | Get Rows, sheet = Responses. |
| 5 | **Google Sheets** "Read status" | Get Rows, sheet = Status. Turn on *Always Output Data*. |
| 6 | **Google Sheets** "Read today's log" | Get Rows, sheet = Log, filter Date = today. Turn on *Always Output Data*. |
| 7 | **Code** "Match" | *Run once for all items*. Paste all of `scripts/lib/match.js`, then the snippet below. |
| 8 | **IF** "Dry run?" | A workflow variable `DRY_RUN` (true while testing). **True:** skip to node 11 with Result = "dry run". |
| 9 | **Loop Over Items** (batch size 1) → **HTTP Request** "Send template" | See the request body below. *On Error: Continue (using error output)*. Add a **Wait** of 1 second inside the loop to stay well under rate limits. |
| 10 | **Set** "Result" | Success: Message ID = `{{$json.messages[0].id}}`, Result = "sent". Error branch: Result = the error message. |
| 11 | **Google Sheets** "Log" | Append Row to Log: Date, Phone, Kind, Template, Tender IDs, Message ID, Result. |

Code node, after the pasted `match.js`:

```js
const alerts = $('Get alerts').first().json;
const rows = $('Read sign-ups').all().map((i) => i.json);
const status = $('Read status').all().map((i) => i.json);
const sentToday = $('Read today\'s log').all().map((i) => i.json).filter((r) => r.Kind === 'new' || r.Kind === 'trial_ended').map((r) => r.Phone);
const { messages, skipped } = matchSubscribers(alerts, applyStatus(rows, status), sentToday);
// Optional: send `skipped` to yourself as a daily summary.
return messages.map((m) => ({ json: { ...m, date: alerts.date } }));
```

The **"Send template"** request uses the WhatsApp Cloud API directly. It's simpler and more predictable than the WhatsApp node for templates with URL buttons:

- **POST** `https://graph.facebook.com/<current API version>/<PHONE_NUMBER_ID>/messages`
- **Authentication:** Header Auth, `Authorization: Bearer <permanent access token>`. Store it as an n8n credential, never in the workflow.
- **Body (JSON):**

```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.phone }}",
  "type": "template",
  "template": {
    "name": "{{ $json.template }}",
    "language": { "code": "en" },
    "components": [
      { "type": "body", "parameters": {{ JSON.stringify($json.params.map(t => ({ type: 'text', text: t }))) }} }
      {{ $json.button_suffix ? `, { "type": "button", "sub_type": "url", "index": "0", "parameters": [ { "type": "text", "text": "${$json.button_suffix}" } ] }` : '' }}
    ]
  }
}
```

If the expression gets fiddly, build the whole `template` object in the Code node instead (`m.body = {...}`) and send `{{ JSON.stringify($json.body) }}`.

## 4. Workflow B: "Replies" (STOP / START)

| # | Node | Settings |
|---|---|---|
| 1 | **WhatsApp Trigger** | Updates: *messages*. This receives every message people send to your number. |
| 2 | **Code** "Read reply" | `text = (message.text?.body || message.button?.text || '').trim().toUpperCase()`, `phone = message.from`. |
| 3 | **Switch** | `STOP`, `UNSUBSCRIBE`, `CANCEL`, `STOP ALL`, `OPT OUT` → **Stop** · `START`, `SUBSCRIBE`, `YES` → **Start** · anything else → **Other** |
| 4a | Stop: **Google Sheets** append to Status | Phone, Status = **Cancelled**, Changed = now, Note = "replied STOP". Then **WhatsApp → Send message** (free text, allowed because they just wrote to you): *"You're unsubscribed and won't get more tender alerts. Reply START if you change your mind."* |
| 4b | Start: append Status = **Resumed** | Reply: *"Welcome back! Tender alerts start again tomorrow morning. Reply STOP any time."* |
| 4c | Other: forward to you | Email or forward the message to your own WhatsApp, so real questions get a human answer. Optional auto-reply: *"Thanks, we'll get back to you. For tenders, visit …"* |

STOP takes effect immediately for the next morning's run, because node 7 of Workflow A reads the Status tab each time. Marketing templates also carry Meta's own "Stop promotions" option; treat a block or opt-out from Meta the same way (Status = Cancelled).

## 5. WhatsApp Business setup (one-time)

Free WhatsApp Business on a phone can't send automated messages to a list. You need the **WhatsApp Business Platform (Cloud API)** from Meta:

1. **Meta Business portfolio.** Create one at business.facebook.com, in your business name.
2. **Add WhatsApp** in Meta for Developers: create an app (type *Business*) and add the *WhatsApp* product. Meta gives you a **test number**. Use it while building: it can message up to 5 numbers you verify.
3. **A real phone number** for sending. It must not already be registered on the WhatsApp or WhatsApp Business app (or you must delete it there first). A new prepaid SIM is the usual choice. It needs to receive one SMS or call for verification.
4. **Display name.** Meta reviews it. It must relate to your business; "TenderFind SA" works if the business uses that name.
5. **Business verification** (company or sole-trader documents). Until verified, Meta limits how many people you can start conversations with per day (it starts small, around 250). After verification and good quality ratings, the limit rises automatically.
6. **Payment method** in WhatsApp Manager. Meta charges per **delivered template message**. Rates depend on category (Marketing costs more than Utility) and country, so check Meta's current South Africa price list before setting your price. Replies to someone who wrote to you in the last 24 hours (like STOP confirmations) are free-form and cheaper or free.
7. **Permanent access token.** In Business Settings → System users, create a system user, give it the WhatsApp app with `whatsapp_business_messaging` permission, and generate a token. This token goes in n8n credentials only.
8. **Webhook** for Workflow B. The n8n WhatsApp Trigger shows a URL; paste it into the app's WhatsApp → Configuration, and subscribe to **messages**.
9. **Templates.** Submit them (below) in WhatsApp Manager → Message templates. Approval usually takes minutes to a day.

Alternative: a Meta Business Solution Provider (e.g. 360dialog, Twilio, Clickatell) does steps 1–8 with you for a monthly fee. It's easier, but costs more.

**Running n8n:** n8n Cloud (paid monthly) is the easiest. Self-hosting on a small server (Docker) is free apart from the server. It must be reachable from the internet for the STOP webhook.

## 6. Message templates to submit

Meta templates can't contain line breaks inside a variable, so each tender is its own variable, `match.js` makes sure of that. Because the number of tenders varies (1–5), submit one template per count.

**Category:** Marketing (subscribed alerts are promotional in Meta's rules; submitting them as Utility usually gets them re-categorised). **Language:** English (`en`).

### `tender_alert_1` … `tender_alert_5`

- **Body** (shown for `tender_alert_3`; for N tenders, keep lines 1…N):

  ```
  Good morning {{1}}. New tenders for your trade today: {{2}}. Closing soonest:

  1. {{3}}

  2. {{4}}

  3. {{5}}

  Always read the tender documents before you bid.
  ```

- **Footer:** `Reply STOP to unsubscribe`
- **Button:** *Visit website*, dynamic URL. Text: `See all new tenders`. URL: `https://jaykgope1-gif.github.io/tenderfind-sa/{{1}}`
- **Sample values** (Meta asks for them):
  - {{1}} `Thandi`
  - {{2}} `11`
  - {{3}} `Cleaning, Gauteng: Provision of cleaning, hygiene and horticulture services at Braamfontein yard depot… Closes Fri 06 Nov, 12:00. https://jaykgope1-gif.github.io/tenderfind-sa/tender/176230.html`
  - button `?trade=Cleaning&province=Gauteng&new=1`

### `tender_closing_1` … `tender_closing_3` (only for people who chose reminders)

- **Body** (shown for 2):

  ```
  Reminder: these tenders close in 3 days.

  1. {{1}}

  2. {{2}}

  Make sure your bid is in on time.
  ```

- **Footer:** `Reply STOP to unsubscribe`

What a subscriber sees (from today's real data):

> Good morning Thandi. New tenders for your trade today: 11. Closing soonest:
>
> 1. Cleaning, Gauteng: Request for quotation (rfq) for provision of cleaning, hygiene and… Closes Fri 06 Nov, 12:00. https://…/tender/176230.html
>
> 2. Cleaning, Gauteng: Invitation to submit an offer to purchase, collectio and removal of electronic… Closes Mon 09 Nov, 10:00. https://…/tender/176295.html
>
> …
>
> Always read the tender documents before you bid.
> *Reply STOP to unsubscribe* · [See all new tenders]

### `trial_ended` (sent once, on day 15)

- **Body:** *"Hi {{1}}, your 14-day free trial of TenderFind SA tender alerts has ended. To keep getting new tenders for your trade every morning, it's R149 a month. Nothing is charged automatically. Tap below to see how to subscribe, or reply to this message."*
- **Footer:** `Reply STOP to unsubscribe`
- **Button:** *Visit website*, static URL `https://jaykgope1-gif.github.io/tenderfind-sa/pricing.html`, text `Subscribe`
- **Sample:** {{1}} `Sipho`

If they reply, the 24-hour window opens, and you can send payment details as a normal message, free-form, no template needed.

If Meta rejects the multi-line templates (they sometimes object to "too many variables"), use this fallback. It's one template with a count and a link:

- `tender_digest`: *"Good morning {{1}}. There are {{2}} new tenders for your trade today. The closest deadline is {{3}}. Tap below to see them all."* + the same button.

## 7. Testing before going live

1. `node scripts/test-match.js` runs the matching against today's real alerts file with test subscribers. It covers STOP, no consent, repeat sign-ups and reminders.
2. In n8n, set `DRY_RUN = true` and run Workflow A manually. Check that the Log tab gets one sensible row per subscriber and nothing is sent.
3. With Meta's test number, add your own number as a recipient, set `DRY_RUN = false`, and filter the Code node to your number only. Check how the message looks on your phone and that the button opens the right page.
4. Reply STOP from your phone and check that the Status tab gets a "Cancelled" line and that the next run skips you. Then reply START and check for a "Resumed" line.
5. Switch to the real number, remove the filter, and turn on the schedule.

## 8. Ground rules

- No consent, no message. STOP is honoured from the next run, and the confirmation goes out immediately.
- At most one morning message (plus one reminder for those who asked) per person per day. The Log prevents repeats.
- If the tender data didn't update, nothing is sent and you're told.
- Messages only contain facts from the alerts file, and every tender links to its page with the documents.
