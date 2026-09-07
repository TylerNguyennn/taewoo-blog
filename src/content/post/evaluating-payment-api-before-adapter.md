---
title: "Notes on Evaluating a New Payment API Before You Build the Adapter"
publishDate: 2026-09-07
description: "Test the field mapping before frontend builds on top of it — a checklist for what to verify before writing adapter docs."
tags: ["payments", "api", "integration", "adapter"]
---

If you skip testing the field mapping before handing an integration off to frontend or design, they'll guess. And when they guess, you'll be rewriting things three weeks later that could've been right the first time.

That's the whole lesson of this post. Everything else is just how to actually do it.

## Why adapters cause silent rework

Whenever you integrate a third-party API, you're usually not exposing their response shape directly to the rest of your system. You write an adapter — a layer that translates the provider's fields into the fields your app actually uses. That's the correct pattern for this: an Adapter converts one interface into the interface your client code expects, so the rest of the system never has to know or care which provider is behind it.

The problem is that adapters fail quietly. If you assume a field works one way and it doesn't — say, a field you thought was always present turns out to be `null` half the time, or a status value you didn't know about shows up in production — nothing crashes immediately. Frontend builds a screen assuming that field is always there. Weeks later, something breaks in a way that traces back to an assumption nobody wrote down.

The fix isn't more code. It's testing the contract before anyone builds on top of it.

## Test the fields before you write the docs

Before documenting anything, actually call the API — don't just read the provider's docs and trust them. For every field you plan to expose through your adapter, check:

- Is it actually always present, or does the doc say "required" while the sandbox happily returns it as `null`?
- What does an empty state look like — empty string, missing key, or explicit `null`? These are not the same thing to your frontend.
- What are the real possible values for status-like fields, versus just the ones mentioned in the docs? Sandbox environments often don't cover every case a provider can send in production.
- What format are dates, amounts, and currency codes actually returned in?
- Do required/optional fields actually hold across every sub-option, or does the doc show one flat schema while the real requirements branch depending on something buried a few parameters down — like which underlying institution the request routes to?

I've been burned by exactly this. On a large finance platform (the kind that routes through a long list of underlying banks, similar in shape to Stripe), the docs listed one flat set of required and optional fields for account creation. In testing, it turned out that "flat" schema wasn't real — two different banks reachable through the same provider each required a different set of fields. We'd already built the account-creation form and validation off the docs' single schema, so once this surfaced, frontend and design had to go back and rework which fields were required per bank option — and the release slipped while that happened. That's a five-minute test against a couple of real options that would've saved a multi-day rework later.

This step doesn't need to be exhaustive. It needs to cover every field your adapter will actually expose — not every field the provider has.

## Write docs your frontend team can build from directly

Once you've verified the fields, the docs should answer one question without anyone needing to ask you: *what does this field look like on our side, and when might it not be there?*

A simple table does this better than prose:

| Provider field | Internal field (adapter output) | Required? | Notes |
|---|---|---|---|
| `acct_status` | `status` | Always present | One of `pending`, `active`, `rejected` — no other values observed |
| `benef_name` | `beneficiaryName` | Optional | `null` when beneficiary type is "business" |
| `created_ts` | `createdAt` | Always present | ISO 8601, UTC |

The goal isn't completeness for its own sake — it's that a designer or frontend engineer can look at this table and start building without pinging you to ask "wait, can this ever be empty?"

## The actual payoff

None of this is complicated. It's testing before assuming, and documenting before handing off. But skipping it is exactly how integrations end up with three rounds of "oh, turns out that field can also be X" — each one costing more than the test would have.

How do you document field mappings when you're building an adapter like this? Curious if there's a template people actually reuse, or if everyone just wings it per project.
</content>
