---
title: "Design patterns aren't a catalog — they're a way to predict where change will hurt"
description: "A payment infrastructure engineer's notes on applying Chain of Responsibility, Adapter, Strategy, and Observer to a real virtual account creation flow."
publishDate: 2026-08-25
tags: ["ruby", "rails", "design-patterns", "payments", "architecture"]
---

## Why this post exists

Most design pattern content stops at "here's what a Factory is." That's fine for a quiz, but it doesn't help you when you're staring at a real codebase deciding how to structure the fifth integration you've onboarded this year.

I spent a recent afternoon deliberately drilling on pattern recognition — not memorizing names, but learning to ask the right question before writing code. This post is the distilled version, applied to a problem a lot of backend engineers eventually hit: onboarding a new external partner whose rules, data formats, and failure modes don't quite match the ones you already built for.

The specific partners here are placeholders. The shape of the problem is real, and you don't need a finance background to follow it — swap "PSP" for "payment provider," "shipping carrier," or "auth provider" and the same reasoning applies.

## The setup

Imagine you're integrating with three outside partners — call them Partner A, Partner B, and Partner C. Each one has its own quirks:

- Each requires some kind of upfront check before you're allowed to proceed — but the pass/fail rules differ.
- Each wants identity or ID data in a different format.
- Each exposes a completely different API — different endpoint names, different field names, and a different way of signing requests.
- Each needs different things to happen afterward: a log entry, a notification to your ops team, a cache update.

None of that is exotic — it's the everyday reality of "we support multiple vendors now." The naive approach is one big service class with a long `case` statement branching on partner name. It works fine at first. It stops working the moment you onboard Partner D and discover that adding one new check means touching a 150-line method that three other partners also depend on.

## The questions that actually matter

Before reaching for a pattern name, here's the mental shift that made the real difference for me: **a pattern isn't defined by how many steps there are, or whether there's a conditional. It's defined by what changes independently, and who owns the interface.**

Three questions I now ask myself before writing the code:

1. **Can this step stop the next one from running?** If yes, you're looking at a chain, not just a sequence.
2. **Did I design this interface myself, or am I adapting to one that already exists?** If the shape came from someone else's API, you're translating (Adapter). If you invented the interface so several implementations can be swapped in, you're choosing behavior (Strategy).
3. **When this step finishes, do several independent things react without needing to agree with each other — or is exactly one thing supposed to happen?** Independent, uncoordinated reactions is Observer. Picking exactly one behavior out of several is Strategy — even if, confusingly, the code that *does the picking* looks a lot like a Factory.

That third question is the one I got wrong the most, so it's worth sitting with for a second. A conditional that picks between objects doesn't tell you the pattern. What the object *does next* does.

With that in mind, here's how the four steps of the flow actually map out.

## Mapping the flow, step by step

**Steps 1 & 2 — the upfront checks → Chain of Responsibility**

Both checks can halt everything downstream. The first check fails → stop, skip the second check, never call the partner's API. The second check fails → stop, never call the API. That veto power over the rest of the flow is the defining trait of Chain of Responsibility: each step is independent, and any one of them can end the whole thing.

```ruby
class FirstCheck
  def call(context)
    return context.fail!(:first_check) unless passes?(context)
    context
  end
end

class SecondCheck
  def call(context)
    return context.fail!(:second_check) unless passes?(context)
    context
  end
end

CHAIN = [FirstCheck.new, SecondCheck.new]
CHAIN.each { |check| context = check.call(context); break if context.failed? }
```

It's easy to confuse this with Template Method, which also runs a fixed sequence of steps. The difference is authority: Template Method is one class where a subclass fills in the steps, but no individual step gets to cancel the whole flow. If your steps can independently veto everything after them, that's the tell for Chain of Responsibility.

**Step 3 — calling the partner's API → Adapter, with Strategy hiding inside it**

Each partner's API is a shape *they* defined, not you. Different field names, different endpoints — that's the textbook case for Adapter: translate a shape you don't control into the one your own application wants to depend on.

```ruby
class PartnerAAdapter
  def create_account(params)
    # translate params to Partner A's field names, call their endpoint
  end
end
```

But how you sign the request — one scheme vs. another — is a separate decision, sitting one layer inside the adapter. You designed that interface yourself, and more than one implementation can be swapped in at runtime. That's Strategy, even though it physically lives inside an Adapter.

```ruby
class HmacSigner
  def sign(payload); end
end

class PartnerAAdapter
  def initialize(signer: HmacSigner.new)
    @signer = signer
  end
end
```

The lesson here: a single step in a flow can need two patterns stacked on top of each other. Don't force one pattern to cover a whole step just because it's "step 3" — ask the diagnostic question separately for the outer shape (talking to the partner) and the inner behavior (how you sign).

**Step 4 — what happens afterward → Observer**

Logging, notifying ops, updating a cache — three independent reactions to "the account was created," and none of them need to know the others exist, and none of them are chosen over the others.

```ruby
class AccountCreatedBroadcaster
  LISTENERS = [AuditLogger.new, OpsNotifier.new, CacheUpdater.new]

  def self.broadcast(event)
    LISTENERS.each { |listener| listener.call(event) }
  end
end
```

This is the one most often confused with Strategy, and the confusion isn't really about "how many branches run" — it's about coordination. Strategy picks *one* behavior for a task. Observer runs *all* reactions to an event, with zero coordination between them. Counting branches is a symptom, not the cause.

## What this actually cost me to learn

I want to be honest about the parts I got wrong, because the mistakes taught me more than the correct answers did.

I reached for Builder any time I saw "multiple steps" — even when the steps were really a validation chain that could halt midway, nothing like a builder object with `.set_x` methods. I reached for Factory any time I saw a conditional picking an object, even when the object being picked was really doing Strategy's job and the conditional was incidental. I reached for Adapter for two interfaces I'd designed myself from scratch, when there was nothing to translate — that was Strategy the whole time.

The fix wasn't memorizing more examples. It was swapping "what does this look like" for "what changes independently, and who owns the interface." That question works on code I haven't seen yet, which is really the whole point of learning a pattern in the first place.

## Where this goes next

This is the first post in a series working through everyday infrastructure problems as they actually show up in backend systems — idempotency, race conditions, deadlocks, and reconciliation are next. Same approach every time: not "here's the definition," but "here's the messy case where the textbook answer didn't quite fit, and what I had to work out instead."

If your codebase is turning into a wall of `case` statements every time you onboard something new, a pattern name isn't the fix by itself. The three questions above are what actually help you find the seam before you write the code.
