---
paths:
  - "campaigns/**/emails/*.md"
---

# Email file rules

These rules apply to every email file inside a campaign's `emails/` folder.

Each email file must:

- Start with a line that begins `Subject: ` and is 50 characters or fewer in total.
- Follow it with a line that begins `Preview: ` and is 90 characters or fewer in total.
- Greet the reader using the `{{first_name}}` placeholder somewhere in the greeting.
- Contain exactly one main link, formatted as a markdown link in this exact form: `[Button text](https://kettlebird.example/steep-club)`. The button text can change, but the URL must stay exactly `https://kettlebird.example/steep-club`, and no other links should appear anywhere else in the email.
- End with one of the sign-offs from `brand/voice.md` (for example "Warmly, The Kettlebird Team"), written as two lines — the sign-off word followed by a comma, then `The Kettlebird Team` on its own line, with no dash — followed immediately by this two-line footer, written as plain text (not inside a code block):

  You're getting this because you joined the Kettlebird Tea waitlist.
  Kettlebird Tea, {{company_address}} · Unsubscribe: {{unsubscribe_url}}
