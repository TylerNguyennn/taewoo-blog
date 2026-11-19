---
title: "Accepting Payments in Vietnam: A Developer's Guide"
publishDate: 2026-11-19
description: "Stripe doesn't support Vietnam. How VietQR bank transfers, VNPay, MoMo and ZaloPay work, how each one signs its webhooks, and where they trip you up."
tags: ["payments", "vietnam", "integration", "webhooks"]
draft: false
---

You're launching a product in Vietnam, you open the Stripe dashboard, and Vietnam isn't on the list of [supported countries](https://stripe.com/global). Your customers pay with bank-app QR codes and e-wallets anyway, so you need a different plan.

This post is for developers outside Vietnam (or new to payments) who need to accept Vietnamese payments. You'll get a map of the two main ways money moves, how each provider proves a notification is really from them, and the mistakes that cause most failed integrations. Everything technical here comes from each provider's public docs, which are linked inline. Where I couldn't find something public, I say so.

## There are two roads, and they feel very different

Most payments in Vietnam take one of two roads: a **direct bank transfer** using a QR code, or a **payment gateway** such as VNPay, MoMo or ZaloPay.

Think of a market stall. On the first road, the customer drops money straight into your cash box and you check the box to see who paid. On the second, a cashier service takes the money for you and then phones you: "order 1042 is paid." The cash box is cheaper and simpler. The cashier tells you exactly which order was paid, but you have to sign a contract with them first.

![Two flows. Path A: customer scans a VietQR code in their bank app, money goes through Napas 247 into your bank account, and a service like SePay or Casso watches the account and sends your server a webhook. Path B: your server creates a signed order, the customer pays on the gateway page, and the gateway sends your server a signed notification.](./_assets/vietnam-payment-paths.svg)

Before you read on, guess which road most small Vietnamese online shops start with. It's usually the cash box, because there's nothing to sign up for.

## Road A: VietQR bank transfers are cheap, but matching is your job

A VietQR code tells the customer's bank app where to send money, how much, and what to write in the transfer note. **VietQR** is the shared QR brand that Napas, the interbank network, launched with Vietnam's banks, and it [complies with the international EMVCo QR payment standard](https://bizhub.vietnamnews.vn/vietqr-launched-to-promote-digital-transformation-in-banking-sector-post325152.html). Money arrives through **Napas 247**, the instant transfer system, which only takes [transactions under VND 500 million](https://en.napas.com.vn/napas-fastfund-247-with-vietqr-code-service). Since April 2026, banks no longer split bigger transfers into several instant ones, so a transfer of VND 500 million or more goes through the slower interbank channel and can take hours ([Tiền Phong](https://tienphong.vn/sap-toi-chuyen-khoan-tu-500-trieu-tro-len-khong-con-nhanh-247-can-luu-y-gi-post1836712.tpo), in Vietnamese).

You don't need to build the QR yourself to get started. VietQR.io offers a [quick link](https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/) that returns a QR image from a URL like `https://img.vietqr.io/image/<bank>-<account>-compact.svg?amount=150000&addInfo=DH1042`. Their page lists a rate limit of 10 codes per 10 seconds per IP address, so cache the images or generate the QR yourself if you have real traffic.

The catch is that your bank doesn't call you when money arrives. You need someone to watch the account. Services like **SePay** and **Casso** connect to your bank account and send your server a **webhook** (an HTTP request saying "money arrived") for every transfer.

That turns matching into your problem. The only link between a transfer and an order is the note the customer typed or the QR pre-filled, such as `DH1042`. Customers edit notes, pay the wrong amount, or pay twice. Plan for all three:

- Put a short, unique order code in the note and parse it out. SePay does this for you and returns it in a `code` field, which is `null` when no code was found ([SePay docs](https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook)).
- Compare the amount. Never mark an order paid just because the code matched.
- Keep a queue of unmatched transfers for a human to review.

## Road B: gateways tell you which order was paid, but each one signs differently

With a gateway, your server creates an order, the customer pays on the gateway's page or app, and the gateway sends your server a server-to-server notification. VNPay and MoMo call it an **IPN** (instant payment notification); ZaloPay calls it a **callback**. Each one adds a **signature**: a code computed from the message and a secret only you and the gateway know. Your server recomputes it, and if the two don't match, you ignore the message.

They all use **HMAC** (a keyed hash), but the details differ in ways that break integrations:

| Provider | What gets signed | Algorithm | What you must reply |
|---|---|---|---|
| VNPay | All `vnp_` query parameters, sorted by name | HMAC-SHA512 in the demo code | JSON with `RspCode` (`00` confirmed, `02` already confirmed, `97` bad signature…) |
| MoMo | `key=value&…` string of specific fields | HMAC-SHA256 | See MoMo's IPN page; I couldn't verify the exact status code |
| ZaloPay | The raw `data` string, signed with `key2` | HMAC-SHA256 by default | JSON with `return_code` (`1` success; per ZaloPay's sample code, `0` asks for a retry, up to 3 times) |
| SePay | `timestamp.raw_body` when you pick HMAC | Your choice: HMAC-SHA256 (recommended), API key, OAuth 2.0, or none (testing only) | HTTP 200/201 with `{"success": true}` within 30 s |
| Casso | Timestamp + `.` + the whole body as JSON, keys sorted A→Z | HMAC-SHA512, hex | HTTP 200 within 5 s |

Sources: [VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [MoMo](https://developers.momo.vn/v3/docs/payment/api/other/signature/), [ZaloPay](https://docs.zalopay.vn/docs/developer-tools/knowledge-base/callback/), [SePay](https://developer.sepay.vn/en/sepay-webhooks/xac-thuc), [Casso](https://github.com/CassoHQ/casso-webhook-v2-verify-signature).

Two traps are worth calling out:

- **ZaloPay has two keys.** `key1` signs what you send; `key2` checks what they send you. Sign the raw `data` string exactly as it arrived. If you parse the JSON and re-serialize it, the bytes change and the signature won't match.
- **VNPay amounts are multiplied by 100.** VND 10,000 is sent as `1000000`, and VNPay's responses use the same format ([VNPay docs](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)). Forget this once and every amount check fails, or worse, passes when it shouldn't.

<details>
<summary><b>For engineers: verifying a Casso and a ZaloPay webhook in Ruby</b></summary>

```ruby
require "openssl"
require "json"

# Casso: header looks like "t=1734924830020,v1=<hex>"
def casso_valid?(raw_body, signature_header, secret)
  parts = signature_header.split(",").to_h { |p| p.split("=", 2) }
  # Casso signs the whole body ({"error":..., "data":{...}}), keys sorted A→Z
  sorted = deep_sort(JSON.parse(raw_body))
  message = "#{parts['t']}.#{JSON.generate(sorted)}"
  expected = OpenSSL::HMAC.hexdigest("SHA512", secret, message)
  Rack::Utils.secure_compare(expected, parts["v1"])
end

def deep_sort(obj)
  case obj
  when Hash then obj.keys.sort.to_h { |k| [k, deep_sort(obj[k])] }
  when Array then obj.map { |v| deep_sort(v) }
  else obj
  end
end

# ZaloPay: sign the raw `data` string with key2, never a re-serialized copy
def zalopay_valid?(params, key2)
  expected = OpenSSL::HMAC.hexdigest("SHA256", key2, params["data"])
  Rack::Utils.secure_compare(expected, params["mac"])
end
```

Check the sort order against Casso's sample code for your language. How nested objects and Unicode are serialized is exactly where signatures quietly stop matching: Casso's own Python and PHP samples escape Vietnamese characters as `\uXXXX` while its JavaScript sample doesn't, so test with a real transfer whose note has diacritics.

</details>

## Every provider will send you the same message twice

Duplicates are normal on both roads, so your handler must be **idempotent**: safe to run twice with the same input.

The docs say so directly. SePay [retries failed deliveries](https://developer.sepay.vn/en/sepay-webhooks/xu-ly-loi) (up to 8 attempts over about half an hour) and lets admins replay old ones, and recommends a unique constraint on its transaction `id`. ZaloPay [warns that duplicate callbacks can happen](https://docs.zalopay.vn/docs/developer-tools/knowledge-base/callback/) and tells you to call its QueryOrder API if no callback arrives 15 minutes after the order was created. VNPay calls your IPN up to 10 times in total, 5 minutes apart, until you return `00` or `02`. Any other code, or a timeout, triggers another call.

The pattern is the same everywhere:

1. Verify the signature. If it fails, reject and log.
2. Insert the provider's transaction ID into a table with a unique constraint. If it already exists, reply "success" and stop.
3. Check the order exists, is still pending, and the amount matches.
4. Mark it paid in the same database transaction, then reply.
5. Do slow work (emails, fulfilment) in a background job, because Casso times out after 5 seconds and SePay after 30.

Replying "success" to a duplicate looks wrong, but it's correct. If you reply with an error, the provider keeps retrying a message you've already handled.

## Sandboxes exist, but onboarding is the slow part

VNPay has a [self-serve sandbox registration](https://pay.vnpaytest.vn/dev-registration) that emails you test credentials. ZaloPay has a sandbox, and its sandbox merchant portal shows callback logs. MoMo has a separate test environment. SePay and Casso connect to a real bank account, so test with tiny real transfers.

The harder part is getting production credentials. **I couldn't find a public page from VNPay, MoMo or ZaloPay listing what a foreign company needs to sign with them directly**, and none of them publish standard fees in the developer docs I read. Ask each provider early whether they can contract with a company that has no Vietnamese entity.

There is at least one public route around that. Antom (Ant International) lists [MoMo](https://docs.antom.com/ac/antomop/momo.md) and [ZaloPay](https://docs.antom.com/ac/antomop/zalopay.md) for merchants registered in Singapore, Hong Kong, the US, the UK or the EEA, with Vietnamese buyers. Pricing there is also by quote. Otherwise your options are a local entity, a local partner, or a merchant-of-record service. That decision usually takes longer than the code.

## What each road costs you

- **VietQR plus a bank-watching service:** almost no paperwork and money lands in your own account. In return you handle matching, wrong amounts and refunds by hand, and you depend on the watcher service staying connected to your bank.
- **Gateway:** exact order matching, cards and e-wallets, and refunds through an API. In return you sign a merchant contract, pay negotiated fees, and maintain one signature scheme per provider.

Many teams start with VietQR to launch quickly and add a gateway once volume makes manual matching painful.

## Takeaways

- Vietnam has two payment roads: direct VietQR bank transfers (cheap, you match payments) and gateways (contract, they match for you).
- Every provider signs notifications differently. Sign the raw bytes, use the right key, and watch VNPay's ×100 amounts.
- Expect duplicates everywhere: dedupe on the provider's transaction ID and reply "success" to repeats.

If you're integrating Vietnamese payments and something here doesn't match what you're seeing, or you'd like help with the integration, [email me](mailto:tainh.work@gmail.com).
