---
title: "Building this blog took longer than it should have"
publishDate: 2026-08-24
description: "Domain, name, template, DNS — the small decisions that ate the time on a 'simple' blog setup."
tags: [meta, blogging]
---

I thought setting up a personal blog was a half-hour job. Domain, code, deploy, done. Turns out it wasn't — not because any single part was hard, but because almost every step made me stop and actually decide something.

## No Visa

The first thing that stopped me was buying the domain. Most international registrars — Namecheap, Cloudflare — only take Visa or Mastercard, and I don't have one. I figured I'd have to go open a new card just for this, another day lost.

Then I found [iNET](https://inet.vn/dang-ky-ten-mien?aff=703522) — a local registrar that takes bank transfer in VND, simple interface. Got `taewoo.me` for about $8 for the first year. The problem felt bigger than it was, mostly because I didn't know there was another option.

*(That link above is a referral link — costs you nothing extra, but I get a small cut if you sign up through it.)*

## "Taewoo" sounds like "Daewoo"

Right before I locked in the name, someone pointed out that "Taewoo" sounds close to "Daewoo" — the old Korean car brand. I sat with that for a bit, wondering if I should pick something else.

I kept it. It's the name I already go by — my sister, studying in Korea right now, uses something similar so we can find each other online. Changing it now would've traded a bit of consistency for something marginally more "optimized," but foreign to me.

## Not building it from scratch

I originally planned to build the blog on Astro from zero. Then I dropped that and used an open-source template instead.

Simple reason: I have enough technical background to write new posts, edit things, and deploy without needing to understand every line of the underlying code. Posts are plain markdown — open, write, save, deploy. No real reason to rebuild something someone else already got right.

## Mixing up Nameservers and DNS Records

Pointing the domain to the host is where I actually got stuck. I couldn't figure out why entering an IP address into the "Nameserver" field kept throwing "invalid format" errors.

Turns out those are two different things. Nameservers are the overall DNS routing system for a domain (they look like domain names themselves, e.g. `hoian.vclouddns.com`) — you leave those alone, exactly as the registrar sets them. A DNS Record is where you actually point the domain somewhere — an A record, name `@`, value being the IP of wherever your site is hosted. Two different screens, names close enough to trip you up.

## What I'd take from this

If someone's about to do exactly what I just did — buy a domain, set up a personal blog for the first time — two things feel more worth saying than any technical walkthrough.

One: don't commit long when you're still testing the waters. A one-year domain for a few dollars is enough to find out whether you'll actually keep writing. No need to prepay for two or three years just because the math looks better on paper.

Two: when you're stuck, just ask. AI can read a screenshot now and spot the problem in an unfamiliar interface faster than digging through docs yourself. The hard part was never knowing everything up front — it's stopping to ask at the right moment instead of guessing and getting it wrong.
