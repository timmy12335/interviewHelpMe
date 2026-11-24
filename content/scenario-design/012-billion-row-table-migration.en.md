---
title: How do you migrate a billion-row table with zero downtime?
---

# Question

A MySQL orders table has grown to 1 billion rows, and reads and writes are getting slower, so the team decides to move it to a new sharded cluster. The business requires no downtime and no data loss. Describe your migration plan, how you verify each stage, and how you roll back if something goes wrong.

## Core Answer

The standard zero-downtime flow is **full copy + incremental sync + verification + gradual read cut-over + write cut-over + a preserved rollback path**. First set up the incremental channel (CDC on the old database's binlog, or application-level dual writes) and record its starting point, then do the full copy, so changes made during the copy aren't lost. Once the full copy finishes, the incremental stream catches up and keeps both sides in sync. Next, **verify the data** (row counts, aggregated hashes per key range, sampled row-by-row comparison). When it passes, **gradually cut reads over**, sending a small share of traffic to the new database and comparing results. Once stable, **cut writes over** so the new database is primary, and set up reverse sync from new to old so the old database stays a viable rollback target for a while. Every step is behind a switch that can be flipped back within seconds.

## Detailed Explanation

**Choosing the incremental sync**: Application-level dual writes (writing to old and new together) are intuitive, but the two writes can't share a transaction, so a failure on either side causes inconsistency that needs compensation and verification; you also have to change every write path and may miss some. Binlog-based CDC (such as Canal or Debezium) doesn't touch business code and captures every source of change (including manual fix-up SQL), so it's the more common choice. The binlog must be in ROW format and retained long enough to cover the full copy.

**The full copy**: Read in primary-key ranges, say 10,000 rows per batch, advancing with `id > ? ORDER BY id LIMIT` cursors and recording progress so it can resume after interruption. Read from a replica and throttle to protect production. Route writes to the new cluster by the sharding rule. At 20,000 rows per second, 1 billion rows takes about 14 hours, so estimate it and schedule it for off-peak time. Rows touched by both the full copy and the incremental stream must be written idempotently (upsert by primary key, comparing update timestamps) so old data never overwrites newer data.

**Verification**: Three levels. Coarse: compare row counts per segment. Medium: hash the contents of every row in a primary-key range, aggregate and compare, and subdivide ranges that differ. Fine: sample individual rows and compare. Since data keeps changing during incremental sync, verification must tolerate brief "still syncing" differences and re-check mismatched rows after a delay.

**Gradual read and write cut-over**: Move 1% of reads first, reading both sides and logging differences (shadow reads), then ramp to 100% once confirmed. Cutting writes is the riskiest step: briefly pause writes (seconds) or rely on version checks, confirm the incremental stream has fully caught up, switch writes to the new database, and start reverse sync from new to old at the same time.

**Rollback design**: Keep reverse sync running for days to weeks after the write cut-over. If problems appear in the new database, switch reads and writes back to the old one, whose data is complete. Only after the new database has run stably and reconciliation is clean do you stop reverse sync and retire the old database. A migration without a rollback path is a one-way bet.

## How to Answer

Lay out the full sequence of stages first so the interviewer sees you have the whole picture. Stress why the incremental channel comes before the full copy, and the advantages of CDC over dual writes. Then cover verification stage by stage: the three levels of checking and shadow-read comparison. Put the emphasis at the end on rollback: reverse sync after the write cut-over is what many people miss, and it's the most important insurance. A numeric estimate (about 14 hours for 1 billion rows) makes it more convincing.

## Script

For a zero-downtime migration I follow this order: set up incremental sync, do the full copy, verify, cut reads over gradually, cut writes over, and keep a rollback path.

The order matters. I hook up binlog-based CDC first and record where it starts, and only then begin the full copy. That way nothing written during the copy is lost. Compared with dual writes in the application, CDC needs no business-code changes and even captures manual fix-up SQL. The full copy goes in primary-key batches, throttled, with progress recorded. At twenty thousand rows a second, a billion rows takes about fourteen hours.

After the copy comes verification. First compare row counts, then hashes for each primary-key range, subdividing any range that doesn't match, and finally sample individual rows.

Then reads move over gradually. I start with one percent, read from both sides and compare, and ramp up if it's clean. Cutting writes is the riskiest step, so I only do it once the incremental sync has completely caught up.

The most important part is rollback. After cutting writes, I run reverse sync from the new database back to the old one for a few weeks. If the new database has problems, I can switch back at any time with complete data.

## Follow-up Questions

### Why set up incremental sync before the full copy? What happens the other way round?

**Core answer**: The full copy takes over ten hours, and the old database keeps changing the whole time. If you start incremental sync only after the full copy, every change between the start of the copy and the start of sync is lost. Recording the binlog position before copying and replaying from there covers everything that changed during the copy.

**Detailed explanation**: During replay you'll hit cases where the full copy already moved a newer version and the stream delivers an older event — for example a row updated twice before the copy read it. So incremental writes must be idempotent and able to tell old from new: upsert by primary key and only overwrite when the update time or version is newer. Delete events must be handled correctly too, or deleted rows linger in the new database. That's also why the binlog must be in ROW format: you need full before and after images.

**How to answer**: Use a timeline to show the gap that would be lost, then cover idempotency and newer-wins logic during the overlap, plus delete events.

### At the moment of the write cut-over, how do you avoid losing or duplicating writes?

**Core answer**: The usual approach is a very short write freeze: a switch makes the application pause writes (or queue them, or briefly ask clients to retry); once incremental lag reaches zero and both sides match, switch the write target to the new database, start reverse sync, and lift the freeze. The whole window is measured in seconds.

**Detailed explanation**: Without a freeze, both sides may accept writes for a while, causing dual-write conflicts. A finer-grained variant cuts over user by user or shard by shard, freezing only that batch's writes to shrink the impact. Protection against duplicates comes from idempotency: writes upsert by business key, so a row synced twice doesn't become two rows. The switch itself must be managed centrally (for example in a config center) so every instance flips at once, and it should be rehearsed beforehand.

**How to answer**: Give the four steps — freeze, catch up, switch, unfreeze — explain that without a freeze you get dual-write conflicts, and add the shard-by-shard cut-over and idempotent writes.

### After sharding, orders are queried both by user ID and by order ID. How do you choose the shard key?

**Core answer**: Use the dimension with the most traffic and the strictest latency needs as the shard key, usually user ID (users viewing their own orders). For the other dimension, use the **gene method**: embed the user ID's shard information in the order ID (for example its last few digits) so the shard can be computed from the order ID too, or maintain an order-ID-to-user-ID mapping table. Merchant-side queries go through CDC to a separate copy sharded by merchant ID, or to a search engine.

**Detailed explanation**: The shard key decides which queries route precisely to one shard; everything else becomes a broadcast to all shards, with high latency and resource cost. With the gene method, when generating an order ID you take the user ID modulo the shard count and embed it in the order ID's last few digits, so both IDs compute the same shard. This requires planning the shard count up front and keeping the modulus compatible with future growth (for example scaling by powers of two). Back-office multi-criteria searches and reports shouldn't be forced onto the sharded database; sync them to Elasticsearch or a data warehouse instead.

**How to answer**: Explain how to pick the shard key, present the gene method and why it works, and hand multi-dimensional and reporting queries to a heterogeneous copy — showing you know sharding isn't a cure-all.
