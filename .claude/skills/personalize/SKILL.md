---
name: personalize
description: Write a version of each campaign email for every lead group in leads/leads.csv. Use when a campaign's emails are final and you want one copy per group.
argument-hint: "[campaign folder]"
context: fork
allowed-tools: Read, Glob, Grep, Write
---

You are personalizing a finished email campaign for each lead group.

## 1. Get the campaign folder

The campaign folder is given as an argument. If no argument was given:

- List the folders under `campaigns/` (these are the campaign folders that exist).
- Stop. Do not read any emails or write any files.

## 2. Read the inputs

- Read `leads/leads.csv` and find the distinct values in the `group` column (expect `tea-curious`, `gift-buyers`, `daily-drinkers`, but use whatever groups actually appear in the file).
- Read every file in `<campaign folder>/emails/`. Each of these is one email in the campaign.
- Read `brand/voice.md` for the brand voice (words to use/avoid, claims never to make, sign-off style).

## 3. Write one version of each email per group

For every email file and every group, write a personalized copy that:

- Keeps the exact same structure, subject line, preview line, main link, and footer/sign-off as the original.
- Changes only the opening line (the line(s) right after the `Hi {{first_name}},` greeting, before the shared body) and one concrete example or detail in the body, so it reads as relevant to that group:
  - `tea-curious`: someone new to loose-leaf tea, still learning.
  - `gift-buyers`: someone thinking of this as a gift for someone else.
  - `daily-drinkers`: someone who already drinks tea daily and knows what they like.
- Leaves everything else — subject, preview, the `[text](https://kettlebird.example/steep-club)` link, placeholders, and the two-line sign-off/footer — untouched.
- Follows `brand/voice.md` (tone, words to avoid, no claims) and the rules in `.claude/rules/emails.md` (subject/preview length limits, exactly one link in the exact required form, sign-off and footer format).

## 4. Save the files

Save each personalized version to:

```
<campaign folder>/groups/<group>/emails/<same file name as the original>
```

So `campaigns/steep-club-launch/emails/01-the-wait-is-over.md` becomes, for example, `campaigns/steep-club-launch/groups/tea-curious/emails/01-the-wait-is-over.md`.

## 5. Reply

Do not explain your reasoning or show the full emails. Reply with only a short summary:

- How many files you wrote in total.
- One example opening line per group.
