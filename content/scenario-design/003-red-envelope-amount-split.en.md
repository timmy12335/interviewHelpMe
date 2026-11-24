---
title: How do you design the amount-splitting algorithm for a red-envelope (lucky money) feature?
---

# Question

Someone in a group chat sends a 100-dollar "lucky draw" red envelope split into 10 shares. Each share must be random, at least 0.01, and the shares must add up to exactly 100. How would you design the splitting algorithm? And when do you split — all at once when the envelope is sent, or on the fly as people grab it?

## Core Answer

The most common approach is the **double-average method**: each draw picks a random value in `[0.01, remaining amount / remaining people × 2]`, and the last person takes whatever is left. It gives every share the same expected value, a guaranteed minimum, and an exact total. Do all arithmetic as integers in cents to avoid floating-point error. An alternative is **line-segment cutting**: pick n-1 distinct random cut points in (0, total), sort them, and the gaps between neighbours are the shares; the distribution feels more natural and allows very large shares. As for timing, **pre-splitting** into a Redis List and `LPOP`-ing on grab is the more robust design: grabbing becomes one atomic dequeue, and the amounts are auditable.

## Detailed Explanation

**Why work in cents**: 100 dollars is 10,000 cents, and integer arithmetic has no `0.1 + 0.2 != 0.3` problem. With `double`, ten shares may sum to 99.99999 and reconciliation breaks. Divide by 100 only for display. `BigDecimal` also works in Java, but integer cents are the simplest to store and compare.

**Why double-average is fair**: With remaining amount M and remaining people N, the mean is M/N. Drawing uniformly from `[1, 2M/N)` has an expected value of exactly M/N, so everyone has the same expectation regardless of order. The upper bound 2M/N also guarantees that the remaining N-1 people can each still get at least one cent. The drawback is that no share exceeds twice the current mean, so the distribution is fairly concentrated and the "luckiest" share is never extreme.

**Line-segment cutting**: Treat 10,000 cents as a line and pick 9 distinct integers between 1 and 9999 as cut points; sort them and take neighbouring differences. As long as the cuts are distinct, each share is at least one cent. It allows one share to be very large, which adds excitement, but you must handle de-duplication, and random-number quality shapes the distribution.

**Pre-split vs on-the-fly**: On-the-fly means each grab reads the remaining amount and count, computes, and writes back — three steps that must be made atomic (a Lua script), and any algorithm change affects live envelopes. Pre-splitting computes all 10 amounts when the envelope is sent and pushes them into a Redis List; each grab `LPOP`s one, which is atomic and O(1), and the envelope's amounts are fixed at send time, which helps auditing. The cost is a bit more memory, and refunding what's left when the envelope expires.

**Separate grabbing from crediting**: In practice, "winning a share" and "crediting the account" are split. A Lua script in Redis atomically checks that the user hasn't grabbed yet and pops a share; then a message credits the account in the database asynchronously. Users learn their result in milliseconds while ledger writes are smoothed out.

## How to Answer

State the constraints first — random, minimum 0.01, exact total — and immediately say "integers in cents", the detail that most often costs points. Introduce the double-average method and explain why its expectation is fair, then contrast it with line-segment cutting. Finish with the architecture: pre-split into a Redis List, `LPOP` on grab, and a Lua script that stops the same user grabbing twice.

## Script

I'd start by stating the three constraints: amounts are random, everyone gets at least one cent, and the total is exact.

The first detail is units. I always compute in cents, so a hundred dollars is ten thousand cents, all integer math, so floating-point error can never unbalance the books.

The usual algorithm is the double-average method. Each draw picks a random amount between one cent and twice the remaining average, and the last person takes everything left. Since the expected value of that range equals the average, grabbing early or late gives the same expected amount. Capping at twice the average also guarantees the people after you still get at least a cent. If you want more surprise, use line-segment cutting: make nine random cuts on a line, and each piece is a share.

As for when to split, I prefer computing everything when the envelope is sent and pushing it into a Redis list. Grabbing pops one item, which is atomic by nature. A Lua script also checks the person hasn't grabbed before, and then a message credits the account asynchronously.

## Follow-up Questions

### With the double-average method, are later grabbers at a disadvantage?

**Core answer**: No. Each round's range has an expected value equal to the current remaining average, and that average stays M/N in expectation, so every position has the same expected amount. Later positions just have higher variance; the last person takes the remainder, which can be unusually large or small.

**Detailed explanation**: With total M and N people, the first person expects M/N, leaving M(N-1)/N in expectation for N-1 people — still an average of M/N. By induction, every position expects M/N. What differs is the shape: later upper bounds depend on everyone else's random draws, so variance accumulates. The belief that "the last one gets more" comes from remembering extreme cases. If the product wants a flatter distribution, shrink the multiplier (say 1.5×) at the cost of less randomness.

**How to answer**: Use the expectation argument to say "no disadvantage", then add the variance point to show you understand the distribution, not just the conclusion.

### How do you stop a user who double-clicks from getting two shares?

**Core answer**: Put "has this user grabbed?" and "take a share" in the same Lua script, tracking grabbers in a Redis Set or Hash, so the check and the take are atomic. A unique index on `(envelope_id, user_id)` in the database's grab-record table is the last line of defence.

**Detailed explanation**: If you `SISMEMBER` first and `LPOP` afterwards, two concurrent requests can both pass the check. Running `SISMEMBER`, `LPOP` and `SADD` in order inside one Lua script leaves no intermediate state. Even if a Redis failover causes a rare duplicate, the database unique index rejects the second write during asynchronous crediting, and you return that share to the envelope. Frontend debouncing improves the experience but is not a correctness guarantee.

**How to answer**: Say the check and the take must be one atomic operation, give the order of the three commands in the Lua script, and finish with the database unique index as the backstop.

### What happens to the money if the envelope isn't fully claimed within 24 hours?

**Core answer**: Register a delayed task due 24 hours after sending. When it fires, mark the envelope expired with a conditional update (so it can't race with a last-second grab), sum the unclaimed shares, refund them to the sender's balance, and clear the remaining Redis data.

**Detailed explanation**: Don't compute the refund as "total minus claimed", which concurrency can skew; use the shares still in the Redis List or the unclaimed shares in the database, and switch the status to "expiring" first to block new grabs. The refund is a ledger operation: write a journal entry and use the envelope ID as the idempotency key so a retried task doesn't refund twice. The delayed task can reuse the order-timeout design, plus a daily scan as a safety net.

**How to answer**: Stress three things: block grabs first, compute the refund from remaining shares, and make the refund idempotent. Point out it's the same class of delayed-task problem as order timeouts.
