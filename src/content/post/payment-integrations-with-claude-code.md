---
title: "Payment Integrations in Two Days with Claude Code"
publishDate: 2026-10-22
description: "How I cut payment-provider integrations from a week to 1–2 days with Claude Code: goals first, high-risk logic first, review by a fresh agent."
tags: ["payments", "ai", "claude-code", "integration"]
draft: false
---

Adding a new payment provider used to take me about a week. Over the last five integrations at a payments company, it took one to two days each, and reviewers found fewer missing cases. The AI didn't get smarter in between. I changed the order of the work, and I stopped letting the agent that wrote the code also judge it.

This post is for engineers who integrate third-party APIs, payments or not, and wonder how far to trust an AI coding agent. You'll get the five steps I use, the rule that decides what to build first, and the one bias that makes AI review useless if you don't break it.

## The week was never spent on typing

Most of an integration week goes into reading and checking, not writing code.

Think of a restaurant taking on a new supplier. Cooking is quick. The slow part is learning the supplier's catalogue, deciding what happens when a delivery is late or wrong, and making sure nobody pays for the same crate twice.

A payment integration is the same: read the provider's docs, map their payment statuses to yours, list what can go wrong (duplicate webhooks, unknown statuses, timeouts), write the code and tests, then explain it all to a reviewer who has never seen this provider.

Before you read on, guess which step I now spend the *most* time on. It's the first one, before any code exists.

## Five steps: script, fixtures, build, fresh review, check

The rule: I decide what "correct" means before the agent starts, and a different agent checks the result.

![Five steps: I write the script, goals and risks; Claude Code builds fixtures from the sandbox or the docs; Claude Code builds high-risk logic first and must pass every goal; a fresh agent reviews with only the diff and the goals; I check the risk map and re-test the API with exported JSON. If review fails, it goes back to build.](./_assets/ai-integration-workflow.svg)

1. **Script (me).** I write the scenarios and the **goals**: concrete checks the finished code must pass. Each goal calls the code and compares the result against a fixture, or calls the provider's sandbox when there is one. I also rank the risks low, medium and high. High is anything that loses or doubles money: status mapping, the idempotency key (the ID that makes a repeated request safe to apply twice), and whether polling stops at the right moment.
2. **Fixtures (Claude Code).** A **fixture** is a saved example response from the provider. If the provider has a sandbox, the agent calls it and saves the real JSON; I can use that same JSON to test before integrating anything. If there's no sandbox, the agent fetches the docs and builds fixtures from them.
3. **Build (Claude Code).** High-risk logic gets written first, while everyone is still paying attention. Familiar parts just follow our existing conventions. The phase isn't done until every goal passes.
4. **Review (a fresh agent).** A new session gets only the diff and the goals. More on why below.
5. **Check (me).** A skill exports two things: a map of every critical decision in the code, and JSON requests so I can re-test the API in one pass. I read the map, not the whole diff.

Engineers call these reusable instructions **skills**: saved recipes Claude Code loads for one kind of task. The risk map in step 5 is one of them.

## Decide the scary cases before the agent does

The most valuable rules are the ones written before any code: what happens when something unexpected arrives.

My favourite example: **an unknown status becomes `pending`, plus an alert.** Payment providers add statuses without telling you. If the code guesses, it might mark an unpaid order as paid, or a paid order as failed. Parking it as pending loses nothing, and the alert means a human looks at it the same day.

I learned this one from a code review, not from an AI. The new code met a status it didn't recognise, raised an error, caught it and carried on. That looked harmless. But further down, a shared rule said: if a payment's status hasn't changed by the end of processing, mark it failed. So every unknown status quietly became a failed payment. Payments that might have gone through were recorded as failed, the success rate dropped, and nobody could tell why, because "failed" hid the real cause. The fix was to stop guessing: park it as pending, alert the team, and let a human check.

An AI agent will make the same kind of choice, and happily: it invents a reasonable-looking default. Reasonable-looking is exactly the problem, because nobody questions it in review. Writing the rule into the script first means the agent implements my decision instead of making its own.

<details>
<summary><b>For engineers: what a risk list in the script looks like</b></summary>

A trimmed example of the shape (not a real provider):

```markdown
## Risks
- HIGH  status mapping: unknown status → pending + alert, never paid/failed
- HIGH  idempotency key: one key per payout, reused on every retry
- HIGH  polling: stop on a final status or after N attempts, then alert
- MED   amount format: provider sends minor units (×100)
- LOW   response field names: follow existing adapter conventions

## Goals
- webhook "SUCCESS" fixture → payment paid, exactly once on replay
- webhook with unknown status → payment pending, alert sent
- payout retried after timeout → provider sees the same idempotency key
```

Each goal is a test that runs against a fixture, or against the sandbox when there is one.

</details>

## The agent that wrote the code shouldn't review it

Ask the same session to review its own work and it mostly agrees with itself. It remembers why it made each choice, so it reads the code through those reasons.

So review is a new agent with no memory of the build. It gets two things: the diff and the goals. It has to work out from scratch whether the code does what the goals say. In my experience this catches gaps well, because it reads the code the way a new teammate would.

## Where the agent still goes wrong

Left alone, the agent tends to build more than you need, and "more" can quietly delete what you had.

**The override that skipped the safety checks.** The project already had a shared base class for provider adapters, and the method we needed was already there. The agent created a subclass anyway and overrode that method for no real reason. The override skipped checks the base class had collected from earlier incidents. Every new test passed, because the tests only covered the new provider. That's why my script now says "familiar parts follow conventions" and why the risk map lists every override.

**Lists that jumped and drifted.** In Tabby, my browser extension, I asked the agent to render only the rows on screen, so the dashboard stays fast with 5,000 saved links. It worked: the dashboard went from about 4 seconds to 0.14 seconds. But the generated code started at the wrong scroll position and counted one margin twice, so rows slowly drifted. The end-to-end tests caught both.

Both bugs passed the agent's own checks. Both were caught by something it didn't control: a review that knew the history, or a test written beforehand.

## What it costs, and the rules I keep

The speed comes with an upfront bill: the script and goals take real time, and skipping them is how you lose money.

- **Money paths get human eyes:** signature checks, amount conversion, idempotency and any database migration.
- **No secrets or customer data in prompts.** Sandbox keys only.
- **Goals before code.** If I can't say what correct means, the agent can't either.
- **Don't let the agent over-engineer.** Reuse what exists; an unexplained override is a review flag.
- **Docs-based fixtures are a guess.** Without a sandbox, the exported JSON is how I check the guess against the real API.

The alternative is writing it all by hand. That's the right call for a one-off integration with no repeated pattern, or when you can't review the result properly. It's the wrong call when a new provider arrives every few weeks and the same risks apply each time.

A note on the numbers: "about a week" and "1–2 days" are my own before-and-after for five integrations at work, from starting the ticket to merging the PR. They're not a controlled experiment, and the providers differed in complexity.

## Takeaways

- Write the goals and the risky rules (like "unknown status → pending + alert") before the agent writes code.
- Build high-risk logic first; let familiar parts follow existing conventions.
- Review with a fresh agent that sees only the diff and the goals, never the session that wrote the code.

If you integrate payment providers and do it differently, or think I've got a rule wrong, email me at tainh.work@gmail.com. I'll correct the post.
