---
title: How do you deduplicate ten billion order IDs?
---

# Question

There are two scenarios. One: an online system creates hundreds of millions of orders a day and must quickly check, at creation time, whether an order ID already exists. Two: an offline data warehouse has accumulated about 10 billion order IDs (16 bytes each), and you need to find every duplicate. How would you handle each?

## Core Answer

The scenarios have different requirements and therefore different solutions. **Online, real-time checks** need low latency and correctness: a unique index in the database is the final guarantee, and in front of it a **Bloom filter** quickly rejects the majority of IDs that definitely don't exist; only on "might exist" do you confirm against the database or cache, because a Bloom filter can give false positives but never false negatives. **Offline batch duplicate-finding** needs to process data far larger than memory with limited memory: 10 billion × 16 bytes is about 160 GB. Use **hash partitioning** to split the IDs by hash into, say, 1,000 files; identical IDs always land in the same file, and each file of about 160 MB fits in memory, where a HashSet finds duplicates. Or use a distributed engine's `GROUP BY ... HAVING COUNT(*) > 1`, which does the same partitioning underneath.

## Detailed Explanation

**Online: the unique index is the floor**: However many layers you add in front, the unique index on `order_no` stays; it's the only reliable duplicate check under concurrency. A unique-key violation on insert means a duplicate. After sharding, though, a unique index only holds within one shard, so the shard key must be the order ID (or derivable from it) so identical IDs land on the same shard.

**Online: what the Bloom filter does**: It maps each element to k positions in a bit array using k hash functions. If any position is 0 on lookup, the element definitely doesn't exist; if all are 1, it "might exist". For 1 billion elements at 1% false positives you need about 1.2 GB (roughly 9.6 bits per element), far less than storing the raw data. It shines when most lookups are "doesn't exist", saving most database queries. Limits: no deletion (use a counting Bloom filter or a Cuckoo filter instead), and capacity must be estimated — past it, false positives climb fast.

**Offline: why hash partitioning**: 160 GB won't fit in one machine's memory. An external sort (sort chunks, then k-way merge) lets you spot adjacent duplicates during the merge, at O(n log n) with several passes over disk. Hash partitioning reads the source once, writes the partitions once and reads each partition once, and partitions can be processed in parallel, so it's usually faster. The hash must be uniform; if some IDs repeat so often that one partition is too large, re-split that partition with a different hash function.

**Offline: distributed engines**: In Spark or Hive, `SELECT order_no FROM orders GROUP BY order_no HAVING COUNT(*) > 1` triggers a shuffle that routes rows by the hash of order_no to different nodes, each counting locally — hash partitioning in essence. Data skew is handled the same way: salt the keys and aggregate in two stages.

**Preventing duplicates at the source**: Duplicate order IDs usually come from a poorly designed ID generator (timestamp + random number colliding under load, or Snowflake clocks moving backwards). A Snowflake generator that handles clock rollback, or database segment allocation, guarantees uniqueness at generation time, leaving deduplication as a defensive measure.

## How to Answer

Point out the essential difference first (online needs latency and correctness; offline needs to handle huge data in limited memory), then answer each. Online: stress that the unique index is the floor and the Bloom filter only accelerates, and explain "false positives, never false negatives". Offline: compute the data size (160 GB) first, then explain the principle of hash partitioning — identical values always land in the same partition. End by mentioning prevention at the ID generator to show you look for root causes.

## Script

This is really two problems, and I'd separate them first. Online duplicate checks at order creation need low latency and absolute correctness. Offline duplicate-finding needs to handle far more data than fits in memory.

Online, the floor is a unique index in the database; under concurrency it's the only thing you can trust. If the data is sharded, the shard key must be derivable from the order ID so identical IDs land on the same shard. In front of that I can add a Bloom filter. If it says an ID doesn't exist, it definitely doesn't; only "might exist" goes to the database. For a billion IDs at one percent false positives, that's about one point two gigabytes.

Offline, I start with the size: ten billion times sixteen bytes is about a hundred and sixty gigabytes, too big for one machine. I'd use hash partitioning, splitting by the hash of the order ID into a thousand files. Identical IDs always go to the same file, each file is around a hundred and sixty megabytes, and a HashSet in memory finds the duplicates. Running GROUP BY in Spark works on the same principle underneath.

Finally, I'd ask why there are duplicates at all. It's usually the ID generator, and fixing it at the source beats deduplicating afterwards.

## Follow-up Questions

### How do you estimate a Bloom filter's false-positive rate, and how do you choose the bit-array size and number of hash functions?

**Core answer**: With n elements, m bits and k hash functions, the false-positive rate is about (1 - e^(-kn/m))^k, and the optimal k is about (m/n) × ln2. In practice, given n and a target rate p, the required bits are m = -n × ln(p) / (ln2)²; at p = 1% that's about 9.6 bits per element with k ≈ 7.

**Detailed explanation**: Intuitively, a bigger array means fewer collisions; too few hash functions make each element's fingerprint weak, and too many fill the array quickly, so there's an optimum in between. You rarely compute this by hand: Guava's `BloomFilter.create(funnel, expectedInsertions, fpp)` and Redis's `BF.RESERVE key error_rate capacity` work it out. What really matters is estimating expectedInsertions generously; if you insert twice as many as planned, the false-positive rate degrades from 1% to roughly 15%. RedisBloom supports auto-scaling by stacking filters to hold the rate.

**How to answer**: Give the formula and the handy "about 9.6 bits for 1%" figure, then stress the practical point that underestimated capacity makes false positives shoot up.

### With a single 4 GB machine, how do you find the 100 most frequent order IDs among 10 billion?

**Core answer**: Hash-partition again: split by hash into enough small files (say 1,000) that each fits in memory. For each file, count with a HashMap and keep that file's top 100 in a min-heap of size 100; then merge the candidates from all files and pick the global top 100 with another min-heap.

**Detailed explanation**: Correctness comes from identical IDs always being in the same file, so each ID's count is complete within its file and never split. Each file's top 100 is a superset of candidates for the global top 100. The min-heap trick: the root is the current 100th place, and a new element replaces it only if larger, giving O(n log 100) overall. If skew still leaves a file too big, re-split it with another hash function. This is the classic "Top K over massive data" pattern, reusable for top search terms, most common IPs and so on.

**How to answer**: Describe the three steps — partition, count, min-heap — stress that "identical values share a file so counts are complete" is what makes it correct, and mention re-splitting under skew.

### If order IDs come from a Snowflake generator, can they still collide?

**Core answer**: Yes. Common causes are clock rollback (NTP moves the server clock backwards, reproducing past timestamps) and worker-ID conflicts (two machines configured with the same workerId). Countermeasures: refuse to generate or wait to catch up when rollback is detected, use reserved sequence bits to absorb short rollbacks, and assign workerIds dynamically via a registry or database.

**Detailed explanation**: A Snowflake ID combines a timestamp, a machine ID and a sequence. Uniqueness rests on two assumptions: timestamps on each machine increase monotonically, and machines have distinct IDs. Clock rollback breaks the first; fixed config files for workerId in containerized deployments easily duplicate IDs when scaling out, breaking the second. Common improvements: at start-up, register with ZooKeeper or a database to obtain a unique workerId and report the time periodically, refusing to start if the local clock is behind the last report; or switch to database segment allocation, which doesn't depend on clocks at all.

**How to answer**: State the two assumptions behind uniqueness, then map each failure mode to its fix — showing you understand the algorithm's assumptions, not just its bit layout.
