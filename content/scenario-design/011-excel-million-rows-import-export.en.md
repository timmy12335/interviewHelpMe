---
title: How do you import and export a million rows of Excel data?
---

# Question

The operations team needs to export 1 million orders to Excel in one go, and to import a 500,000-row product spreadsheet. The current code either runs out of memory (OOM) or the HTTP request times out. How would you rework it?

## Core Answer

Both problems share the same roots: **loading all the data into memory at once**, and **doing long work inside a synchronous request**. Exports must **stream**: read from the database in batches with a cursor or primary-key pagination, and write Excel with POI's `SXSSFWorkbook` or EasyExcel, which keep only a few rows in memory and spill the rest to a temp file; a single sheet holds about 1.04 million rows, so split across sheets or files beyond that. Imports should use **event-driven row-by-row parsing** (SAX mode), validating and batch-inserting every 1,000 rows instead of reading the whole file into a List first. Turn both into **asynchronous jobs**: the request just creates a job and returns its ID immediately; the background worker puts the result in object storage and offers the download and an error report via notification or a job list.

## Detailed Explanation

**Why it runs out of memory**: POI's `XSSFWorkbook` parses the entire xlsx into a DOM object tree, where one cell can take over a hundred bytes; 1 million rows × 20 columns is 20 million objects, easily several gigabytes. Add a `SELECT *` that loads 1 million rows into a List first, and memory blows up twice over.

**Streaming exports**: Don't read with `LIMIT offset, size`, since deep pagination gets slower and slower. Use cursor pagination with `WHERE id > ? ORDER BY id LIMIT 5000`, or a JDBC streaming result set (MySQL needs `fetchSize = Integer.MIN_VALUE` or cursor mode). On the write side, `SXSSFWorkbook(100)` keeps only the latest 100 rows in memory and flushes older ones to a temp file. EasyExcel adds further memory optimizations and a simpler API. If users accept it, exporting CSV is the cheapest option of all.

**Row-by-row parsing and batched inserts**: EasyExcel's `ReadListener` calls back once per parsed row; accumulate 1,000 rows, validate them, `batchInsert`, then clear the buffer. Turn on JDBC batching on the database side (MySQL's `rewriteBatchedStatements=true`), which speeds up inserts by one to two orders of magnitude compared with row-by-row inserts.

**Error handling and resumability**: Some hundreds of the 500,000 rows may be malformed. Don't fail the whole batch for one bad row; collect the failing rows (row number, column, reason) into an error report users can download, fix and re-upload. Whether it must be all-or-nothing depends on the business: if it needs atomicity, import into a staging table and move everything to the real table only after it all validates; otherwise commit batch by batch and record progress so an interrupted job can resume where it stopped.

**Async jobs and protecting resources**: Large files take minutes, which must not tie up HTTP requests or hit gateway timeouts. Track state in a job table (queued, running, succeeded, partially failed), run jobs on dedicated workers, and cap concurrent jobs so ten people exporting at once can't flatten the database. Export queries should ideally hit a read replica so they don't compete with live transactions.

## How to Answer

Diagnose the root causes first: loading everything into memory and doing it synchronously. Then cover export and import separately, each with streaming on the read side and the write side, mentioning details like the deep-pagination trap and the JDBC batching flag. Finish with async jobs, error reports, concurrency caps and read replicas, upgrading the answer from "no OOM" to "a feature you can operate".

## Script

Both problems have the same root. One, all the data gets loaded into memory at once. Two, long work happens inside a synchronous request.

Take export first. When reading from the database, don't load a million rows into a list, and don't paginate with a large offset, which gets slower the further you go. I'd use the primary key as a cursor and fetch five thousand rows at a time. When writing Excel, use a streaming writer like SXSSF or EasyExcel that keeps about a hundred rows in memory and spills the rest to a temp file. And remember a single sheet tops out at just over a million rows, so beyond that you split into more sheets.

Now import. Don't read the whole file into objects first. I'd parse row by row with an event-driven reader, validate every thousand rows, and insert them as a batch. With MySQL, turn on rewriteBatchedStatements; it makes a huge difference. Bad rows shouldn't fail the whole batch; collect them into an error report for the user.

Finally, make both of them asynchronous jobs. The request just returns a job ID, and the background worker puts the file in object storage and sends a notification. Cap concurrency, and run export queries on a read replica so they don't compete with live transactions.

## Follow-up Questions

### What's wrong with LIMIT-offset pagination when exporting a million rows?

**Core answer**: `LIMIT 900000, 5000` makes the database scan and discard the first 900,000 rows before returning 5,000, so each page is slower than the last and the total cost approaches O(n²). Use primary-key cursor pagination, `WHERE id > last batch max id ORDER BY id LIMIT 5000`, which locates each page directly via the index at a steady speed.

**Detailed explanation**: Deep pagination is slow because the offset can't be skipped; the database must count past those rows (and if it needs to go back to the table for each, it costs more). Cursor pagination exploits the ordering of the B+ tree index, so `id > ?` jumps straight to the starting point. Its limitation is that you can only move forward in cursor order and can't jump to arbitrary pages, which is fine for an export that reads sequentially anyway. If you sort by a non-unique column (such as creation time), use a composite cursor `(created_at, id)` so rows sharing a timestamp aren't skipped or repeated.

**How to answer**: Explain that the offset must be scanned and discarded, give the cursor-pagination SQL, and add that a non-unique sort column needs a composite cursor.

### How do you stop the same file from being uploaded twice and duplicating data?

**Core answer**: Handle it at two levels. At the file level, hash the uploaded file and warn when the same file is already being processed or has succeeded. At the data level, upsert or rely on a unique index on the business key (such as the product code) so duplicate rows update instead of insert. The data level is the real guarantee, because a user may change one character and re-upload.

**Detailed explanation**: File hashing only catches byte-identical files, so it's a user-experience nicety. Real idempotency comes from the data: every row should have a business identifier enforced by a unique index, written with `INSERT ... ON DUPLICATE KEY UPDATE` or merge logic. If the data has no natural unique key (such as a ledger of transactions), require users to provide an external reference in the file, or record at the job level which rows of the batch were imported and skip them on retry.

**How to answer**: Distinguish file-level and data-level deduplication, stress that a data-level unique key is the real fix, and cover what to do when there's no natural key.

### Why export from a read replica, and what are the downsides?

**Core answer**: Large exports occupy the database's IO and buffer pool for a long time, evicting hot data and hurting transaction latency; a read replica isolates that impact. The cost is replication lag: the replica may be seconds behind the primary, so the export should state its data timestamp, and reconciliation-style exports that need real-time consistency deserve separate consideration.

**Detailed explanation**: InnoDB manages its buffer pool with an LRU variant that resists full-scan pollution (newly read pages start in the old sublist), but sustained heavy scanning still causes IO pressure and lower hit rates. Ideally dedicate a replica to reports and exports so it doesn't interfere with the replicas serving online reads. If exports are so large that even a replica struggles, export from a data warehouse or an analytics database fed by CDC instead of the transactional database.

**How to answer**: Explain buffer-pool pressure and the benefit of isolation, be upfront about replication lag, and extend to a dedicated reporting replica and the data warehouse.
