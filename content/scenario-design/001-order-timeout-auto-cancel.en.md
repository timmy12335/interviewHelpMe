---
title: How do you auto-cancel orders that are not paid in time?
---

# Question

An e-commerce platform requires that an order be cancelled automatically, and its stock released, if it is not paid within 30 minutes. How would you design this timeout-cancellation mechanism, and what are the trade-offs between the options?

## Core Answer

This is a delayed-task problem: "run one check at a future point in time". There are four common approaches, from simple to sophisticated: **scheduled table scans** (look for overdue unpaid orders every minute), a **Redis sorted set** (score = deadline, poll for due members), **delayed messages** in a message queue (publish a message that becomes visible 30 minutes later), and a **timing wheel** (efficient in-memory scheduling on a single node). Whatever you pick, the cancellation itself must be a **conditional update** — `UPDATE ... SET status='CANCELLED' WHERE id=? AND status='UNPAID'` — so that it converges correctly with a user who pays in the very last second. You also need a low-frequency table scan as a **safety net**, because every asynchronous channel can lose messages.

## Detailed Explanation

**Scheduled table scan**: The most direct option. A job runs every minute: `SELECT id FROM orders WHERE status='UNPAID' AND created_at < NOW() - INTERVAL 30 MINUTE LIMIT 500`. It needs no extra infrastructure and is naturally re-runnable. The downsides are that precision is bounded by the scan interval, and at high volume the scan itself loads the database, so you need a composite index on `(status, created_at)` and must process in batches. It fits systems with up to tens of thousands of orders per day.

**Redis sorted set**: On order creation, `ZADD order:timeout <deadline> <orderId>`. A background thread uses `ZRANGEBYSCORE` to fetch due members and `ZREM` to claim each one (only process it when `ZREM` returns 1, so multiple instances don't double-process). You get second-level precision with zero database load; the cost is that Redis persistence and failover can lose data, so it cannot be the only source of truth.

**Delayed messages**: RocketMQ supports arbitrary delays (since 5.x); RabbitMQ can use the delayed-message plugin or a "TTL + dead-letter exchange" combination. Publish on order creation, and the consumer checks the order 30 minutes later. It scales horizontally and decouples the logic, but many pending delayed messages consume broker storage, and if the user pays at minute 5 the message still arrives at minute 30 — so the consumer must always check the status before acting.

**Timing wheel**: Netty's `HashedWheelTimer` or Kafka's hierarchical timing wheel give O(1) insert and fire, which suits large numbers of short delays. But it lives in a single process's memory and disappears on restart, so it can only be an acceleration layer, never the reliable layer.

**The key to correctness — conditional updates and a safety net**: Cancelling and paying are two concurrent state transitions. A conditional update in the database (or an optimistic-lock version) guarantees only one of them wins. Release stock and return coupons only after the cancellation succeeds, and make those follow-up actions idempotent. Finally, keep an hourly scan that picks up anything "past the deadline but still UNPAID". That is what makes the design production-ready.

## How to Answer

Open by classifying it: "this is a delayed-task problem". Then list the scan, Redis ZSet, delayed message and timing wheel approaches in order of complexity, giving one strength, one cost and the scale each fits. The real points come in the second half: raise the payment-vs-cancellation race yourself, give the conditional-update SQL, and add that every asynchronous channel needs a scanning safety net. The interviewer wants to see that you know where it breaks, not how many options you can recite.

## Script

At its core this is a delayed task: thirty minutes after an order is placed, check it once, and cancel it if it hasn't been paid.

There are roughly four ways to do it. At low volume, a job that scans the table every minute is enough, as long as you have a composite index on status and creation time. With more volume, I'd use a Redis sorted set with the deadline as the score, and a background thread that pulls out whatever is due. If I want decoupling and horizontal scale, I'd use delayed messages in the message queue. A timing wheel is the fastest, but it lives in memory and is gone after a restart.

Correctness matters more than the choice of tool. A user might pay in the last second, so the cancellation has to be a conditional update: only flip to cancelled if the order is still unpaid. Then only one of payment or cancellation can win. Release stock and return coupons only after the cancel succeeds, and make those steps safe to repeat.

Finally, any asynchronous channel can drop messages, so I keep a low-frequency scan as a safety net to catch what slipped through.

## Follow-up Questions

### What are the pitfalls of using RabbitMQ TTL plus a dead-letter queue for delayed cancellation?

**Core answer**: Queue TTL is only evaluated at the head of the queue. If messages carry different expirations, a 30-minute message at the front blocks a 5-minute message behind it; the shorter one only moves to the dead-letter queue after the longer one expires, so the delay becomes badly inaccurate.

**Detailed explanation**: RabbitMQ checks message TTL when the message reaches the head of the queue, to avoid scanning the whole queue. That makes "TTL + dead letter" suitable only when every message in a queue has the same delay. With multiple delays, the usual fixes are one queue per delay level (for example 1, 10 and 30 minutes), or the official delayed-message plugin, which stores messages in a Mnesia table and publishes them to the target queue when they become due. Also handle consumer failures on the dead-letter queue, or cancellation tasks will silently pile up.

**How to answer**: Name the "head-of-queue only" mechanism, give the 30-minute-blocks-5-minute example, and offer the two ways out: one queue per fixed delay, or the delayed-message plugin.

### What if the user pays at the exact moment the order is being cancelled?

**Core answer**: Conditional updates make the two transitions mutually exclusive, so only one succeeds. If the payment callback arrives after the order was cancelled, run a compensation flow for "money received on a cancelled order": refund automatically or re-reserve the stock. Never just ignore the money.

**Detailed explanation**: Payment is a fact in an external system; the platform cannot stop the payment provider from charging the user, so letting cancellation win in your own database is not the end of it. Cancel with `WHERE status='UNPAID'`, and mark paid with `WHERE status='UNPAID'` too. If the payment update fails because the status is CANCELLED, log the anomaly and trigger an automatic refund (or restore the order if stock is still available). Two preventive measures help: query the payment provider once before cancelling, and give the payment session an expiry slightly shorter than the order timeout so the two windows never overlap.

**How to answer**: Start with conditional updates for mutual exclusion, stress that money is an external fact and therefore needs a refund compensation, and finish with the "payment expiry shorter than order timeout" preventive design.

### Is a scheduled table scan still viable at tens of millions of orders per day?

**Core answer**: A naive full scan won't hold up, but scanning doesn't have to go. Scan per shard or time partition in parallel, only scan a recent time window, and paginate with a cursor instead of deep offsets. More commonly, delayed messages or a ZSet drive the main flow and the scan becomes a low-frequency safety net.

**Detailed explanation**: Scan cost comes from the range scanned and lock contention. Shrink the range with the `(status, created_at)` index and by only scanning orders created 30 to 90 minutes ago; if the data is already sharded, give each shard its own scanner. Process in batches with `id > last max id` cursor pagination so `OFFSET` doesn't slow down. Cancel each order with its own conditional update rather than one huge `UPDATE` that becomes a long transaction. Once the main flow is message-driven, an hourly safety-net scan is fine because it only handles a handful of stragglers.

**How to answer**: Don't just say "it won't work". Explain where the bottleneck is, how to shrink it, and propose "messages for the main flow, scanning as the safety net" to show you can combine approaches.
