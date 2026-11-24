---
title: How do you prevent overselling and underselling inventory under high concurrency?
---

# Question

When a limited item goes on sale, tens of thousands of requests try to decrement the same item's stock at once. How do you guarantee you never oversell (sell more than you have)? And how do you avoid underselling (stock that is available but can't be sold, or that stays reserved and is never released)?

## Core Answer

**Overselling** happens because "read stock, check, write back" is not atomic. The fix is to merge the check and the decrement into one atomic operation: in the database, a conditional update `UPDATE stock SET num = num - 1 WHERE sku = ? AND num >= 1`; under heavy load, preload hot stock into Redis and use a Lua script to "check and decrement" in one step, then persist asynchronously. **Underselling** comes from stock that was decremented but never became a sale: an order creation that failed without returning stock, unpaid orders holding stock, or Redis and the database drifting apart. The fix is "reserve + release on timeout + reconcile": each decrement carries the order ID so it can be returned idempotently, unpaid orders release stock on timeout, and a periodic job reconciles Redis against the database.

## Detailed Explanation

**Why overselling happens**: The classic bug is `select num` returning 1, checking `num > 0`, then `update num = 0`. Two threads both read 1, both pass the check, both write, and two units are sold. A JVM-level `synchronized` doesn't help across multiple instances; a distributed lock is correct but serializes the whole item and destroys throughput.

**Database conditional update**: `UPDATE ... SET num = num - ? WHERE sku = ? AND num >= ?`. The check and the decrement are in one statement, made atomic by the row lock; zero affected rows means out of stock. It is correct and simple, but updates to the same row queue on its lock, so one hot SKU tops out at a few hundred to a thousand or so updates per second.

**Redis + Lua reservation**: Load stock into Redis before the sale and run a Lua script: `if tonumber(redis.call('get', KEYS[1])) >= tonumber(ARGV[1]) then return redis.call('decrby', KEYS[1], ARGV[1]) else return -1 end`. Redis executes scripts on a single thread, so it is atomic, and one node handles tens of thousands of calls per second. On success, publish a message so the order service creates the order asynchronously, and the database applies its own conditional decrement as the final source of truth.

**Bucketing to spread the hotspot**: A single key is still a single point. Split 1,000 units into 10 sub-keys of 100 each, route requests randomly or by user hash, and try other buckets when one sells out. The cost is that leftover units can end up scattered across buckets, so you need a "consolidation" step to avoid underselling.

**Three sources of underselling and their fixes**: First, Redis decremented but order creation failed — return the stock, idempotently keyed by order ID so it isn't added back twice (which would cause overselling). Second, orders that are placed but never paid — release stock via timeout cancellation. Third, a Redis failover lost some decrements — a periodic reconciliation job corrects stock using database orders as the truth. Only with all three can you claim stock is "always sellable and never oversold".

## How to Answer

Split the problem into overselling and underselling up front; many candidates miss the second half. For overselling, name the root cause (read–check–write isn't atomic) and give three layers by concurrency level: database conditional update, Redis Lua reservation, bucketing. For underselling, cover idempotent returns, timeout release and reconciliation. Close with "Redis absorbs the traffic, the database holds the final truth" to show you understand each layer's role.

## Script

The root cause of overselling is that reading the stock, checking it, and writing it back aren't atomic. Two requests both see one unit left, both decide they can buy, and you sell two.

So the fix is to merge the check and the decrement into one step. At modest volume, a conditional update in the database does it: only decrement if the stock is at least the quantity, and zero affected rows means sold out. But updates to the same row queue on its lock, so a hot item can't keep up. Then I'd preload stock into Redis and use a Lua script to check and decrement in one go, and on success send a message to create the order asynchronously. If a single key is still too hot, I split the stock into several buckets.

The other half people forget is underselling. If Redis decremented but the order failed, add the stock back, idempotently by order ID. If someone orders and never pays, timeout cancellation releases it. If Redis loses data in a failover, a periodic reconciliation corrects it, using database orders as the truth.

In one line: Redis takes the traffic, the database keeps the final truth.

## Follow-up Questions

### Can you just use Redis DECR and add the stock back if it goes negative?

**Core answer**: It roughly works but isn't recommended. DECR is atomic, and adding back on negative keeps the final number right; the problems are that other readers see a wrong state while it's negative, a failed add-back permanently undersells, and every useless request still rewrites the stock value.

**Detailed explanation**: With decrement-then-check, every request after sell-out still runs a DECR and an INCR, turning wasted traffic into two writes. If the process crashes between DECR and INCR, that unit is lost forever — underselling. Any frontend or service that reads the key to show remaining stock will see a negative number. Wrapping "check then decrement" in a Lua script means requests after sell-out only read, and the logic is clearer. You can go further with a local "sold out" flag that rejects requests in the application before they even reach Redis.

**How to answer**: Acknowledge DECR is atomic, then name the three side effects: visible intermediate state, underselling on crash, and amplified writes. Offer Lua check-then-decrement plus a local sold-out flag.

### How does optimistic locking (a version number) differ from a conditional update for preventing overselling?

**Core answer**: Optimistic locking reads a version and compares it on update; on conflict the whole request must retry. A conditional update conditions directly on the quantity and succeeds as long as enough stock remains. In a high-contention sale, optimistic locking has a huge retry rate and most requests fail for nothing, so the conditional update is far more efficient.

**Detailed explanation**: With versions, 100 requests read version=5 and only one can move it to 6; the other 99 fail and must re-read and retry, creating a retry storm. They fail even when there is plenty of stock, which is itself a form of underselling. A conditional `WHERE num >= 1` doesn't care whether someone else changed the row, only whether enough stock remains, so queued requests succeed one after another while stock lasts. Optimistic locking suits low-contention updates whose new value depends on what was read, such as editing a document; for a commutative counter like stock, a conditional update is the natural choice.

**How to answer**: Explain the different conditions (did the version change vs is there enough quantity), then use "100 requests, 1 success" to show the retries and underselling optimistic locking causes under contention.

### Why not just take a distributed lock on the item and then decrement?

**Core answer**: A distributed lock is correct, but it fully serializes every request for that item and adds two network round trips (lock and unlock) per decrement. In a flash sale, throughput is capped by lock hold time, and you also have to deal with lock expiry, renewal and deleting someone else's lock — far more cost than one atomic Lua script.

**Detailed explanation**: A distributed lock protects a critical section with multiple steps that cannot be expressed as one atomic command. A stock decrement can already be one atomic operation via a conditional update or Lua, so a lock adds nothing. If you lock anyway, the hold time covers the read, check, write and maybe a database query; at 5 ms per hold, one item maxes out at 200 per second, far below what a single Redis key can do. Locks are for more complex flows, such as decrementing several SKUs while validating bundle rules — and even then, moving the logic into one Lua script is usually better.

**How to answer**: Say that locks protect multi-step critical sections while a stock decrement can be a single atomic step, then convert hold time into a throughput ceiling to show you judge options with numbers.
