---
title: "In Japan, You Can Buy Something Online and Pay for It in Cash at 7-Eleven"
publishDate: 2026-09-27
description: "Konbini payment lets Japanese shoppers check out online and pay in cash at a convenience store. Why it works, and what it means for payment system design."
tags: ["payments", "japan", "konbini", "payment-methods"]
draft: false
---

The first time I heard how this works, I thought someone was joking.

You shop online. At checkout, instead of typing in a card number, you pick "pay at a convenience store." You get a code. Then you walk to your nearest 7-Eleven or Lawson, hand over cash, and your order ships.

I work on payment systems for a living, and I still couldn't picture it. So I went to YouTube. [This short guide](https://youtube.com/shorts/nHDVYzUmUA8) is the one I watched, and it's worth 30 seconds if you want to see the whole thing in action.

<iframe src="https://www.youtube-nocookie.com/embed/nHDVYzUmUA8" title="How konbini payment works in Japan" style="display: block; width: 100%; max-width: 315px; aspect-ratio: 9 / 16; margin: 1.5rem auto; border: 0;" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>

It sounds like a step backwards. It turns out to be one of the smartest payment ideas I've come across.

## What it is

In Japan, convenience stores are called _konbini_, and paying there is a huge deal. Konbini payment is the second most-used online payment method in the country, at around 10% of purchases, and people use it for phone bills, online orders, games and tickets at one of roughly 55,000 stores.

Here's how it works:

1. You buy something online and choose konbini payment.
2. You receive a payment code, by email, text or printout.
3. You pay in cash at a convenience store.
4. The shop gets notified and sends your order.

Each chain does it slightly differently. At 7-Eleven, the cashier can scan your code directly. At Lawson, you first scan it at a self-service kiosk, print a ticket, and hand that to the cashier.

## Why would anyone pay this way?

**Not everyone has, or wants, a credit card.** Konbini opens online shopping to people without cards, including younger shoppers who don't have one yet.

**You never type payment details online.** No card number to leak, no account to hack. You pay with the money in your wallet.

**It fits busy lives.** Konbini payment suits people who aren't home during the day. Stores are open late, often 24 hours, and there's one around almost every corner.

**It's safe for shops too.** Since sellers don't ship until the cash is confirmed, there's no card to dispute and chargebacks effectively disappear. For a small online store, that's a big deal.

## The part that surprised me most

Most of us think of paying as instant: tap, done. Konbini flips that. When you check out, you haven't paid yet. You've made a promise to pay, and the payment happens later, in the physical world, on your schedule.

That small change means the whole system has to be patient. The shop has to wait. Codes have to expire if nobody shows up. Refunds are trickier too, because there's no card to send money back to.

As someone who builds payment systems, I find this fascinating. We usually design around the card: fast, digital, reversible. Konbini is a reminder that there's no single "right" way to pay. The best payment method is the one that fits how people actually live, and in Japan, a lot of people live next to a convenience store.

## The takeaway

Next time you hear that cash is dying, remember Japan. The country found a way to bring cash into online shopping by putting the payment counter in a place people already visit every day.

Sometimes the best technology isn't the newest. It's the one that meets people where they already are.
