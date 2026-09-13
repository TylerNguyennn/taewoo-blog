---
title: "How Do We Know a Customer Has Actually Received Their Money?"
publishDate: 2026-09-13
description: "Webhooks vs. polling: how a payment system actually confirms money has arrived, explained through a grocery-store QR code."
tags: ["payments", "api", "reconciliation"]
draft: false
---

When a customer sends money, how do you actually confirm it landed — not just that your system said it did?

## Why this is harder than it sounds

Imagine you're at a grocery store paying by QR code. The store displays the QR on a table, you scan it, and you pay — simple, because you're standing right there.

Now imagine you're not at the store. You've asked a friend to pick up a bottle of milk for you, and you'll pay once they hand it over. But the store's payment device can't leave the counter, so your friend just takes a photo of the QR code and sends it to you. You scan the photo and pay from wherever you are.

The question is: how do you know the store actually received the money?

There are two basic ways to solve this:

1. **Ask the store to notify you.** Tell the staff: "Whenever a payment comes in for this QR, call me to confirm." This is the equivalent of a webhook — the receiving side pushes a notification the moment the money arrives.
2. **Check in yourself.** If the staff forgets to call — and they usually do — you have to call them and ask, checking back at intervals until you get an answer. This is the equivalent of polling — you pull the status instead of waiting for it to be pushed to you.

You start to see the business opportunity here: you don't have to pay the store upfront at all. You can act as a dealer — front the goods to the customer, collect payment from them, and pay the store only once you've confirmed it's been received. The commission is yours for building the mechanism that makes that confirmation reliable.

## What "received" actually means

There are two main ways to know when the store has received the money — the webhook and the polling check — and in practice you usually need both. You can never fully trust that the staff will remember to tell you, so you combine the notification with your own follow-up check.

## How we handle it

The same logic applies directly to a real payment system. Treat the webhook as the fast path, and use polling as the fallback for when it doesn't arrive:

```
onWebhook(event => {
  if (event.type === "payment.settled") {
    markAsReceived(event.paymentId);
  }
});

// fallback, in case the webhook never arrives
everyInterval(() => {
  for (const payment of pendingPayments()) {
    const status = provider.getStatus(payment.id);
    if (status === "settled") markAsReceived(payment.id);
  }
});
```

## Takeaway

You can't fully trust a single signal to tell you money has arrived. A webhook is fast but can be missed; polling is reliable but slow and wasteful on its own. The systems — and the businesses — that get this right treat the webhook as the expected path and polling as the fallback that catches what it missed.
