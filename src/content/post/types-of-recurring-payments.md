---
title: "Not All Recurring Payments Are Subscriptions"
publishDate: 2026-10-11
description: "Subscriptions, metered billing, installments, unscheduled card-on-file, direct debit and push-based mandates: the main kinds of recurring payments and why each one breaks your system in a different place."
tags: ["payments", "recurring", "subscriptions", "direct-debit", "system-design"]
draft: true
---

When people say "recurring payments," they usually mean one thing: a Netflix-style subscription. Same amount, same day, every month, charged to a saved card.

That's one shape. There are at least five others, and they differ in ways that matter when you build them: who triggers the charge, whether the amount is known in advance, and what happens when it fails. If your system treats them all as "a subscription with a cron job," it will work for the first one and quietly break on the rest.

Here's how I think about the main types.

## 1. Fixed subscriptions

Same amount, fixed schedule, until the customer cancels. Streaming, SaaS seats, gym memberships.

This is the easiest case, and it's the one every billing tutorial covers. The customer agrees once, you store a payment credential, and your scheduler charges it on each billing date.

The hard part isn't the charge. It's everything around it: proration when someone upgrades mid-cycle, what "the 31st" means in February, and retries when a card is declined. A surprising share of subscription churn isn't customers leaving. It's cards expiring, and nobody updating them.

## 2. Usage-based (metered) billing

The schedule is fixed, but the amount isn't. Cloud hosting, API calls, electricity, phone bills.

Now the charge depends on data you collect during the period, so billing becomes a pipeline: meter events, aggregate them, close the period, generate an invoice, then charge. Each step can be late or wrong. If a usage event arrives after the period closes, you need a rule for it before it happens, not after.

The amount also changes the risk. A customer who agreed to "about \$20 a month" and gets charged \$400 will dispute it, even if every API call was real. Spending alerts and caps aren't just nice UX here. They protect you from chargebacks.

## 3. Installments

A fixed total, split into a fixed number of payments. Buy now, pay later, "4 interest-free payments," phone plans that pay off a device.

Unlike a subscription, installments have an end, and the customer owes the remaining balance whether or not they still want the product. That changes failure handling completely. A failed subscription payment can mean "cancel the service." A failed installment means there is now debt to collect.

So your data model needs a schedule with a known end date, a running balance, and a clear state for "overdue," which a plain subscription model doesn't have.

## 4. Unscheduled card-on-file

The customer saves a card, and the merchant charges it when something happens, not on a calendar. Auto top-up when a wallet balance drops below a threshold, ride-hailing fares, tolls.

There's no schedule to predict, so your system can't pre-check anything. Each charge is triggered by an event, often at an inconvenient moment, and the customer isn't there to complete a 3-D Secure challenge.

That's why the card networks care about *how* a stored card is used. The first charge, where the customer is present and agrees to future use, is a customer-initiated transaction. Every later charge the merchant makes on its own is a merchant-initiated transaction, and it has to be flagged that way and linked back to the original. Get this wrong, and issuers decline charges that look like fraud: a card being charged with no customer present and no history explaining why.

## 5. Direct debit (pull from a bank account)

Instead of a card, the customer authorizes you to pull money from their bank account. SEPA Direct Debit in Europe, ACH debits in the US, BACS in the UK.

The authorization is a **mandate**, and it's the core object in your system, not the payment. You collect it once, store its reference, and every debit points back to it.

Direct debit is cheap, but it's slow and it fails late. A card decline comes back in seconds. A bank debit can come back as failed days later, after you've already shipped the order. Under SEPA Core, a customer can ask their bank to reverse an authorized debit for weeks afterward, with no reason needed. So "success" on a direct debit is provisional for a long time, and your ledger needs to model that.

## 6. Push-based mandates (the bank pays you)

The newest model flips direction. The customer sets up a mandate in their own banking app, and the bank pushes each payment to the merchant under the agreed rules: max amount, frequency, end date. India's UPI AutoPay, Australia's PayTo and Brazil's Pix Automático all work like this.

The customer controls the mandate. They can pause or cancel it from their bank app without telling you. So your system can't assume a mandate is still active just because it was yesterday. You need to listen for mandate status changes the same way you listen for payment results.

These rails often add rules of their own, such as sending the customer a notice before each debit, or requiring extra authentication above a certain amount. Those rules shape your billing schedule: if a pre-debit notice must go out a day early, your "charge on the 1st" job really starts on the 31st.

## The three questions that tell them apart

When a new recurring use case lands on my desk, I don't start with "which type is this?" I ask three questions:

- **Who triggers each charge?** The merchant on a schedule, the merchant on an event, or the customer's bank?
- **Is the amount known in advance?** Fixed, variable within limits, or unknown until the period closes?
- **What does a failure mean?** Lost revenue, a paused service, or a debt that still has to be collected?

Two products can both be "monthly billing" and get different answers to all three. Those answers, not the billing frequency, decide what your data model looks like, how retries work, and what you have to tell the customer.

## If I were designing a recurring system from scratch

- Make the **agreement** (subscription, mandate, installment plan, stored credential consent) the main object, and treat each charge as a child of it.
- Store whether each charge was customer-initiated or merchant-initiated from day one. Retrofitting it later means guessing for every historical transaction.
- Treat "success" as provisional for any rail where money can come back late, and reconcile against it.
- Design retries per type. Retrying a declined card three times in a row is fine for a subscription. Retrying a bank debit the same way just stacks failure fees.

Recurring payments look like one feature from the outside. Underneath, they're several different contracts between the customer, the merchant and the bank, and your system has to know which one it's holding.
