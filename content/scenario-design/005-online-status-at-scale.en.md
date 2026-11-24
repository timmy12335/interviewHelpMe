---
title: How do you track the online status of hundreds of millions of users?
---

# Question

An app with hundreds of millions of registered users needs to know whether a given user is online right now, how many users are online in total, and how many distinct users came online today. How would you design this, and roughly what do the data structures cost in memory?

## Core Answer

Split it into three different problems and use the best structure for each. **Is this user online?** is decided by heartbeats with an expiry: a Redis key with a TTL, or a ZSet scored by last heartbeat time. **How many are online now?** counts users with a heartbeat in the last N seconds, via sharded counters or a range count over the ZSet. **How many came online today?** is a distinct count: use a **Bitmap** for exact numbers (user ID as the bit offset, about 12 MB for 100 million users), or **HyperLogLog** when some error is fine (a fixed 12 KB with about 0.81% error). "Online" is decided by **heartbeats**, not connection events, because mobile networks often drop without sending a disconnect.

## Detailed Explanation

**Why heartbeats**: When an app goes to the background, switches networks or enters an elevator, the TCP connection may not close cleanly and the server never sees a disconnect. So "online" should mean "had a heartbeat within the last T seconds" — for example, a heartbeat every 30 seconds and offline after 90 seconds of silence (tolerating two lost packets).

**Single-user lookup**: The simplest is `SET online:<uid> 1 EX 90`, renewed on every heartbeat, with `EXISTS` to query. If 10 million of 100 million users are online, that's 10 million keys at roughly 50–70 bytes each in Redis, around 600 MB — acceptable, but it needs cluster sharding. Alternatively, hash users by ID into several Hashes with field = uid and value = last heartbeat time, and check whether that time is within 90 seconds. It uses less memory but needs a background cleaner for expiry.

**Live online total**: The direct approach is a ZSet scored by last heartbeat time: `ZCOUNT online now-90 now` gives the total, with periodic `ZREMRANGEBYSCORE` to drop stale members. A single ZSet with ten million members is a big key, so split it into N ZSets by uid and sum the counts. If an approximate number is enough, have each long-connection gateway report its connection count and add them up, without touching per-user data at all.

**Distinct users today**: A Bitmap uses uid as the offset: `SETBIT dau:20261124 <uid> 1`, then `BITCOUNT`. 100 million bits is 12.5 MB, and `BITOP AND/OR` gives consecutive-day logins or weekly actives. This assumes uids are dense integers; UUIDs or Snowflake IDs must first be mapped to sequential numbers, or sparse large offsets waste memory. With about 1% error acceptable, HyperLogLog needs just 12 KB per day via `PFADD` / `PFCOUNT`, and `PFMERGE` combines days.

**Overall architecture**: Heartbeats shouldn't hit Redis directly. A long-connection or API gateway receives them, merges them locally and writes to Redis in batches. Status transitions (for example offline → online) are published as events to the services that care, such as friend-online notifications.

## How to Answer

The key is splitting the requirement, because "is online", "online total" and "distinct today" need completely different structures. Explain why heartbeats define online, then give the structure and memory estimate for each requirement — and actually compute the numbers (12.5 MB, 12 KB), which is what the interviewer most wants to see. Finish with batched heartbeat writes and sharding to show you've considered write pressure and big keys.

## Script

I'd split this into three problems, because each needs a completely different data structure.

First, is a given user online? I don't rely on disconnect events, because mobile networks often drop without telling you. So I use heartbeats, about every thirty seconds, and treat ninety seconds of silence as offline. In Redis that can be a key with an expiry, renewed on each heartbeat, and the check is just whether the key exists.

Second, how many people are online right now? A sorted set works, scored by last heartbeat time, and you count the members from the last ninety seconds. With too many members it becomes a big key, so shard by user ID and add the counts. If an approximate number is fine, each gateway can just report its connection count.

Third, how many people came online today? That's a distinct count. For an exact answer I'd use a bitmap with the user ID as the offset, which is only twelve and a half megabytes for a hundred million users. If about one percent error is fine, HyperLogLog needs only twelve kilobytes a day.

Finally, heartbeat volume is huge, so I'd merge heartbeats at the gateway and write them to Redis in batches.

## Follow-up Questions

### Can you still use a Bitmap if user IDs are 64-bit Snowflake IDs?

**Core answer**: Not directly. A Bitmap's memory is set by its largest offset, and a 64-bit ID would require an impossible allocation. Map user IDs to dense sequential numbers starting from 0 (for example an auto-increment internal number assigned at registration), use a compressed structure for sparse data such as a Roaring Bitmap, or accept some error and use HyperLogLog.

**Detailed explanation**: `SETBIT key 2^40 1` would make Redis try to allocate a string of over a hundred gigabytes; Redis caps a single string at 512 MB, so it fails outright. The usual fix is a uid-to-sequence mapping assigned at sign-up, which other bitwise statistics can reuse. If IDs fall into a few ranges, split into one Bitmap per range. A Roaring Bitmap divides the integer space into containers of 65,536, using arrays when sparse and bitmaps when dense, and is available as a Redis module or in the application.

**How to answer**: State the principle — a Bitmap's cost is set by its largest offset — then offer sequence mapping, range splitting, Roaring Bitmaps and HyperLogLog, chosen by how exact you need to be.

### With heartbeats every 30 seconds and 10 million users online, can Redis keep up?

**Core answer**: Ten million users every 30 seconds is about 330,000 writes per second. A single Redis node handles on the order of 100,000 operations per second, so you need a sharded cluster, or the gateway merges heartbeats and writes in batches (for example a pipeline every 5 seconds), cutting Redis requests by an order of magnitude or more.

**Detailed explanation**: Heartbeats are highly repetitive; all you need is the last heartbeat time. The gateway can keep the last heartbeat for its local connections in memory and flush periodically. Going further, the gateway already knows which connections are alive, so it can write to Redis only on state changes (came online, timed out) and not at all in between. The cost is that when a gateway fails, its users' status is briefly wrong, and TTL expiry is what brings it back in line.

**How to answer**: Do the arithmetic first (330,000 per second), then offer batched writes and write-on-change as two ways to cut volume, and explain how state converges when a gateway fails.

### How do you efficiently show which friends in a friend list are online?

**Core answer**: Friend lists are usually a few hundred people, so fetch all statuses in one batch — `MGET` on the online keys, or a pipeline over the Hashes — rather than one call per friend. If friends need real-time "came online" alerts, switch to push: notify a user's online friends when they come online instead of having everyone poll.

**Detailed explanation**: In Redis Cluster, `MGET` fails if the keys span slots, so the client groups keys by slot and queries in parallel (hash tags don't help much since each friend is a different user). With push, one login fans out to every friend, and a celebrity may have tens of thousands, so limit pushes to online friends or fall back to fetching when the friend list is opened. It's the same push-vs-pull trade-off as a social news feed.

**How to answer**: Give the batch query and point out the cross-slot problem in a cluster, then discuss the push-vs-pull trade-off for live alerts and the celebrity fan-out effect.
