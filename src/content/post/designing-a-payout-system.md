---
title: "Designing a Payout System: What Payment-In Tutorials Don't Tell You"
publishDate: 2026-09-20
description: "Payouts fail in ways payment-in doesn't. Lessons on beneficiary verification, double sends, compliance-first routing, and reconciliation."
tags: ["payments", "payouts", "system-design", "distributed-systems"]
draft: false
---

Most system design content covers payment-in — charging a card, capturing a subscription. Payouts get far less attention, but sending money out is a different, and often harder, problem. Here's what I learned building one, told through a few real situations.

## The webhook that never came

I was building the payout flow for a new PSP integration. Before you can send money to someone, you have to register them as a "beneficiary" — proving their bank account is real and verified.

After creating the beneficiary, I expected the same pattern as every other integration I'd worked with: send the request, then wait for a webhook telling me when it's verified and ready.

So I wired up the webhook listener. And waited.

The webhook never came — not because anything broke, but because this provider simply doesn't send one for that event. If I hadn't caught this early, payouts would have sat stuck forever, waiting for a signal that was never going to arrive.

That one gap changed how I designed the whole system. It was my first clue that payouts don't behave like payment-in at all.

## Two confirmations, one button

The beneficiary needs to be verified — a process that can take up to a day — while the payout itself waits on a separate webhook. From the user's side, it's just one button: "send money." Underneath, it's two different confirmation mechanisms that don't talk to each other on their own.

My goal was to keep that single-button experience intact without letting a payout silently hang.

The solution: when a beneficiary is created, push it into a queue that polls its status every 30 minutes. If it's still pending after 48 hours, fire an alert. If it's still pending at 72 hours, fire a second, more urgent one. The moment the beneficiary comes back active, the queue automatically triggers payout creation. If verification fails, the queue stops immediately and the transaction is marked as an error — no payout is ever created against a beneficiary that never checked out.

This turned two independent, asynchronous processes into what feels like one smooth action to the user, without ever losing track of a payout in limbo.

## Don't send the money twice

Once the system scales across multiple pods, a new problem shows up: several workers can end up picking up the same payout at the same time. If two workers both try to process the same payout, you risk sending the money twice.

The fix doesn't need to be complicated. Two things do most of the work:

- A distributed lock scoped to each individual payout, held for the shortest time possible — so only one worker can act on a given payout at a time.
- An idempotency key as a second layer of defense — so even if a lock slips or a job accidentally reruns, the system recognizes "this payout was already processed" and refuses to send it again.

Neither piece is exotic. The lock stops the race before it happens; the idempotency key catches anything that slips through anyway.

## Compliance has to come before routing, not after

Different providers enforce different compliance rules depending on the region. One might require a Tax ID and a live business website before you can pay someone. Another has no concept of a routing number at all, which rules out certain transfer rails entirely.

Early on, my routing logic only considered currency: pick a provider based on what currency the payout was in. That worked until a payout was technically routable to a provider — the currency matched, the rail existed — but failed because it didn't meet that provider's compliance requirements.

The fix was to move compliance checks earlier in the pipeline, so they act as a filter before routing decisions are made, not a validation step that catches problems at the very end. A payout that can't clear compliance for a given provider should never even be considered a routing candidate.

## "Success" doesn't always mean the money arrived

The system marks a payout as successful the moment the provider accepts the request. But accepted isn't the same as delivered — there's a gap between "the provider said yes" and "the money is actually in the recipient's account."

To close that gap, I built a reconciliation loop: a periodic check that compares the internal ledger against the provider's actual settlement status. When the two don't match, it raises an alert — ideally before a customer notices and reports it themselves.

Without this loop, "success" is really just an assumption. With it, the system can catch drift early and quietly, instead of finding out from a support ticket.

## If I were starting over

A few things I'd build in from day one, instead of retrofitting later:

- A single, provider-agnostic beneficiary state machine, instead of bolting polling logic onto each new integration separately
- Idempotency as a platform-level guarantee, not something every payout type reimplements on its own
- Compliance treated as a filter from the very first routing decision, not a rule added after the second provider revealed a gap

None of these fixes are complicated on their own. What's easy to miss is that payouts fail in ways payment-in simply doesn't — and most of those failure modes only show up once, in production, exactly when you least expect them.
