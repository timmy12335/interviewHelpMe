---
title: How do you run fuzzy searches on encrypted phone numbers?
---

# Question

To comply with privacy regulations, users' phone numbers are stored AES-encrypted in the database. But the customer-support console needs to find a user by "the last four digits" or by the full number. You can't run `LIKE` on ciphertext. How would you design this?

## Core Answer

The key is **not to query the ciphertext at all, but to store separate index columns that are searchable yet irreversible**. For exact lookups, use a **blind index**: store an extra column `HMAC(key, full number)`, and at query time compute the same HMAC on the input and do an equality match. For fuzzy lookups, decide up front which query patterns you support and build a blind index for each — for "last four digits", store `HMAC(key, last four)`; to support any 4-digit substring, split the number into every length-4 sliding window, HMAC each, and store them in an index table. The costs are more storage and low selectivity for short fragments, which invites frequency analysis, so use a separate key, restrict who can query, and keep an audit log.

## Detailed Explanation

**Why not decrypt inside the database and search**: `WHERE AES_DECRYPT(phone, key) LIKE '%1234'` decrypts every row and can't use an index, so it's a full table scan. Worse, the key has to be handed to the database, and SQL logs or slow-query logs may capture the key or the plaintext, defeating the point of encryption.

**Why HMAC rather than a plain hash**: The space of phone numbers is tiny (around 100 million mobile numbers in Taiwan), so a plain SHA-256 can be brute-forced back to the number in minutes. HMAC needs a key; an attacker with only the database can't enumerate. Keep this key separate from the AES encryption key and manage it in a KMS.

**Tokenized index for fuzzy search**: For `0912345678`, supporting any 4 consecutive digits means generating `0912`, `9123`, `1234`… — 7 fragments — HMAC-ing each and writing them to `phone_token(user_id, token_hash)` with an index on `token_hash`. To search `1234`, compute `HMAC(key, '1234')` and look up user IDs. For 5 or more digits, split the query into several 4-digit fragments, intersect the results, then decrypt the candidates to confirm.

**Selectivity and leakage risk**: Four digits have only 10,000 possibilities, so each token hash maps to many users, and an attacker who knows some users' numbers can infer that others share the same fragment. This is an irreducible trade-off between searchability and secrecy. Reduce the risk by supporting only the patterns the business truly needs (for example only the last four digits, not arbitrary fragments), separating permissions on the index table from the main table, requiring login and auditing every query, and still masking numbers in results.

**Alternatives**: With heavy query volume and many patterns, keep plaintext only in a dedicated, tightly controlled search service (such as a permission-isolated Elasticsearch cluster) while the main database stores ciphertext. Or narrow candidates with other criteria first (name, order number) and decrypt the small candidate set in memory to compare.

## How to Answer

Explain why you can't decrypt and search in the database (performance and key exposure), then present the core idea of a separate searchable index. For exact search, describe the blind index and stress HMAC over a plain hash; for fuzzy search, describe sliding-window tokens. Finish by raising the leakage risk from low selectivity and how to control it, showing you see this as a security-vs-functionality trade-off rather than a puzzle with a perfect answer.

## Script

You can't run LIKE on an encrypted column. If you decrypt inside the database to compare, every row gets decrypted, no index can help, and the key has to be handed to the database, so plaintext may end up in its logs.

So my approach is to store a separate index column that's searchable but can't be reversed. For exact lookups I use a blind index: an extra column holding an HMAC of the full number. At query time I compute the same HMAC of the input and do an equality match. It has to be a keyed HMAC, not a plain hash, because there are only about a hundred million possible phone numbers, and a plain hash can be brute-forced in minutes.

For fuzzy search, I first decide which patterns to support. For any four consecutive digits, I split the number into every four-digit fragment, HMAC each one, and store them in an index table. A query computes the HMAC of its input and finds the matching users.

I'm honest about the cost, though. Four digits only have ten thousand combinations, so selectivity is low and there's a risk of inference. So I only enable the patterns the business really needs, give the index table its own permissions, and audit every query.

## Follow-up Questions

### Why not just use the database's Transparent Data Encryption (TDE)?

**Core answer**: TDE encrypts data files and backups on disk, protecting against stolen disks or backup files. Once the database reads the data it's plaintext, so any account with query rights, an application bug or SQL injection can still get full phone numbers. Regulations usually expect field-level protection and least privilege; TDE is only one layer.

**Detailed explanation**: TDE's threat model is "physical media leaks". Application-level field encryption's threat model is "database accounts, DBAs or application vulnerabilities leak": even an attacker who can run arbitrary SQL only gets ciphertext. They solve different problems and are usually combined — TDE for files at rest, field encryption for sensitive columns, plus masking and access auditing. The price of field encryption is lost queryability, which is exactly what this question is about.

**How to answer**: Answer in terms of different threat models: say clearly what TDE protects against and what it doesn't, and explain using both together.

### When the HMAC key is rotated, what happens to the existing blind indexes?

**Core answer**: Blind-index values depend on the key, so rotating it invalidates all of them and they must be recomputed. Add a versioned index column, have a background job decrypt each row and recompute with the new key, query against both columns (hashing the input with both keys) during migration, and drop the old column and key once everything is migrated.

**Detailed explanation**: It's the expand-contract migration pattern: expand (add the new column and dual-write), migrate (backfill in the background), contract (remove the old column). New writes must dual-write both index versions from the start of the expand phase. The backfill should run in batches, be resumable and be throttled to protect production. The tokenized index table is several times the size of the main table, so recomputing it is even more expensive — one more reason to limit fuzzy-search patterns.

**How to answer**: State plainly that the index depends on the key and must be recomputed, then apply expand-contract to describe the zero-downtime steps.

### Encrypted numbers still need a uniqueness check (one registration per number). How?

**Core answer**: Put a unique index on the full-number blind-index column. The same number with the same key always produces the same HMAC, so the unique index enforces uniqueness without decrypting. Note that if AES uses a random IV, the same number encrypts differently each time, so you can't put a unique index on the ciphertext column.

**Detailed explanation**: This is often missed: secure modes like AES-GCM use a random IV every time, so ciphertext is non-deterministic and can't be compared or constrained. Some teams switch to a fixed IV or ECB mode so they can compare, which makes identical plaintexts produce identical ciphertexts and leaks the data distribution — the wrong fix. The right split: ciphertext provides secrecy and reversibility, the blind index provides matching and uniqueness. Normalize numbers before HMAC-ing (strip spaces, unify the country-code format), or `+886912…` and `0912…` count as different numbers.

**How to answer**: Give "a unique index on the blind index", point out the random-IV trap and why you must not switch to a fixed IV, and mention normalization.
