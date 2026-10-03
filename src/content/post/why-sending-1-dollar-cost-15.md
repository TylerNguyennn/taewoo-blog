---
title: "Why Sending $1 Cost Me $15, and the Workarounds I See Back Home"
publishDate: 2026-10-03
description: "A $1 wire cost me $15; $78 in USDT cost under $3. Fees belong to the rail, not the amount, and Vietnam's payment workarounds show what fintech could build."
tags: ["payments", "fees", "stablecoins", "cross-border", "vietnam"]
draft: false
---

## The \$15 dollar

Last month I made two transfers a few days apart. The first moved about \$78 out of my Binance account. I sent it as USDT, a stablecoin pegged 1:1 to the US dollar, over the TRON network. The fee was somewhere between \$1 and \$3.

The second was a test payout: \$1 to a US account through a licensed European banking partner. The fee was \$15. I paid fifteen times the amount I sent.

My first reaction was the obvious one: crypto is cheap, banks are expensive. That reaction is wrong, or at least badly incomplete. The real lesson is that **fees are a property of the rail, not the amount**. Once you see transfers that way, you can start designing around them.

I work on payment integrations for a living. But some of the most useful lessons came from outside work. Back home in Vietnam, I see people work around payment friction every day.

## Why the fee depends on the rail

Every transfer fee mixes a fixed part, a percentage part, and an FX spread that rarely shows up as a "fee". A wire is mostly fixed. My partner has no US routing number, so a US payout travels the SWIFT chain, and banks along the way take their cut.

A stablecoin transfer is cheap on-chain, but the cost does not disappear. It moves to the edges, where you buy and sell the coin.

## All-in cost: fiat in, fiat out

The fair comparison is the total cost from fiat to fiat. The figures below are approximate ranges. On a fixed-fee rail, the cheapest option flips as the amount grows.

| Rail | Cost structure | \$1 | \$78 | \$1,000 | Typical speed |
|---|---|---|---|---|---|
| SWIFT wire | Fixed + correspondent fees + FX spread | \~\$15–45 | \~\$15–45 | \~\$20–60 | 1–5 days |
| Pre-funded local payout (Wise-style) | Small fixed + \~0.4–1.5% | \~\$1 | \~\$1–2 | \~\$5–15 | Minutes to 1 day |
| Stablecoin sandwich (fiat → USDT/USDC → fiat) | On-chain fee + ramp spread 0.5–2% + withdrawal fees | \~\$2–4 | \~\$2–5 | \~\$6–25 | Minutes on-chain, ramps vary |
| Domestic ACH (US only) | Near-zero fixed | < \$1 | < \$1 | < \$1 | 1–3 days |

Two patterns stand out. Fixed-fee rails punish small amounts: my \$1 wire carried a 1,500% fee. Percentage-heavy rails punish large amounts. No single rail wins everywhere, and that is the opening for engineering.

## The workarounds I see back home

In Vietnam, I keep running into the same pattern: when the official way to pay is expensive or awkward, people build their own.

- **Cheaper YouTube Premium.** Sellers offer subscriptions well below the official price, often by splitting one family plan across several buyers.
- **Cheaper AI API credits.** Sellers offer API access below list price. One person pays the platform, then resells usage in small pieces.
- **My own USDT transfer.** I moved \$78 through Binance on TRON instead of a bank, because the bank was the expensive path.

I am not claiming every Vietnamese user does this. Many of these resale deals also break the platforms' terms, and buyers carry the risk. But the pattern taught me something: the friction is not only fees. It is price, access to international cards, and minimum top-ups.

## What fintech can learn from them

Each workaround points at a product that has not been built well yet.

| Workaround I see | Friction it avoids | The fintech version |
|---|---|---|
| Shared YouTube family plans | High price per person, one card payment | Batching: spread one fixed cost across many users |
| Resold AI API credits | No international card, large minimum top-ups | Pooled accounts with small-ticket billing |
| My USDT transfer on TRON | High fixed fee on small amounts | Stablecoin settlement between entities |
| Me choosing USDT over a wire | Unknown all-in cost | Least-cost routing inside the platform |

The insight: users already batch and route money themselves, and they take on all the risk. A platform that does it for them, legally and reliably, can keep the savings and remove the risk. The hard part is the part users skip: compliance, held funds, and failed transfers.

## Cheapest is not the same as best

My \$15 dollar was not a rip-off. It was the price of a rail built for large, regulated, auditable transfers, used for a job it was never designed to do.

The value in payments is matching each transfer to the right rail. Sometimes that is the cheapest rail. Sometimes it is the most reliable rail, or the one your compliance team can defend to a regulator. Fees you can see are only part of the cost. The rest shows up as failed payouts, frozen funds and support tickets.

If you build payment systems, look at the workarounds your users already invented. Each one is a product someone has not built properly yet.
