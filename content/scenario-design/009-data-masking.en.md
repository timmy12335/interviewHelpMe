---
title: "How do you mask sensitive data: displays, logs and test environments"
---

# Question

The system holds national ID numbers, phone numbers, credit card numbers, addresses and other sensitive data. Your manager says "mask it everywhere". Explain where you would mask data, how you'd implement each, and which places are easy to miss.

## Core Answer

Masking isn't one feature; it's handled separately at each exit along the data flow. **API responses** get dynamic masking by role (a phone number shows as `0912***678`), typically via a custom Jackson serializer plus a field annotation, so the rules are declared in one place. **Logs** are masked before output, using a custom Logback converter or by excluding sensitive fields from `toString()`. **Data in non-production environments** (testing, analytics, contractors) gets static masking: replace values with fake data or an irreversible transform at export time, rather than merely hiding them on display. Easy-to-miss places include exception messages and stack traces, third-party SDK request logs, exported reports, frontend analytics events, message-queue payloads, and cached data.

## Detailed Explanation

**Dynamic masking (API responses)**: Define a `@Sensitive(type = PHONE)` annotation on DTO fields and implement a Jackson `JsonSerializer` that applies the masking rule for each type during serialization. If masking depends on role (for example a support supervisor may see the full number), the serializer reads the current user's permissions from the security context. The rules then live with the DTO declarations instead of being scattered across controllers. Any "view plaintext" operation should be a separate endpoint that requires extra authorization and is audited.

**Designing masking rules**: Phone keeps the first four and last three digits, ID keeps the first letter and last two characters, card numbers show only the last four (which PCI DSS also requires), names keep the surname, and addresses show only the district. Rules must be consistent, because if different pages hide different positions, combining them reveals the full value.

**Log masking**: The most reliable approach is never printing it: exclude sensitive fields from DTO `toString()` (Lombok `@ToString.Exclude`) and never log whole request objects. The second line is a custom Logback `MessageConverter` or a Log4j2 `RewritePolicy` that uses regular expressions to replace ID- and phone-shaped strings before output. Regex is a backstop with a performance cost and false positives, so it can't be the only measure.

**Static masking (non-production)**: Test environments need realistic-looking data but must never contain real personal data. Replace values in the export pipeline: names become random fake names, phone numbers become fake numbers in the same format, and fields that must stay linked (the same user across tables) go through a keyed deterministic hash so relationships survive but values can't be reversed. Display-style masking (`0912***678`) isn't enough here, because masked data can still identify a person when combined with other fields.

**Commonly missed exits**: Exception messages that include parameters (`"user not found: " + idNumber`); HTTP clients for payment or SMS providers with full request logging turned on; Excel exports from the support console; frontend analytics that send form contents to an analytics platform; Kafka messages carrying full personal data consumed by downstream services that shouldn't see it; whole user objects cached in Redis. Do a data-flow inventory and check every exit one by one.

## How to Answer

First clarify that "masking" means different things at different points: hiding on display, hiding in logs, and replacing in non-production. Give a concrete implementation for each (an annotation-driven Jackson serializer, a Logback converter plus `toString` exclusion, fake-data replacement in the export pipeline). Finish by listing the exits people miss — the part that best shows hands-on experience — and mention "start with a data-flow inventory" as the method.

## Script

I'd split masking into parts first, because each place needs something different.

First, API responses. I'd define an annotation for sensitive fields, put it on the DTOs, and write a Jackson serializer that masks by type on output. Phones keep the first four and last three digits, card numbers only the last four. Viewing the full value goes through a separate endpoint that needs extra authorization and is audited.

Second, logs. The most reliable approach is never printing it in the first place. DTO toString methods exclude sensitive fields, and nobody logs a whole request object. Then I add a Logback converter that uses regular expressions to catch leftovers, but that's a backstop, not the main defence.

Third, test and analytics environments. Here you don't mask, you replace with fake data. Fields that need to stay linked go through a keyed hash, so they can't be reversed.

Finally, many leaks happen in places nobody thought of: exception messages containing an ID number, a third-party SDK with full logging on, exported reports, frontend analytics. So I'd start with a data-flow inventory and check every exit.

## Follow-up Questions

### What's wrong with masking all logs with regular expressions right before output?

**Core answer**: Three things: performance (every log line runs several regexes), false positives and negatives (non-standard formats slip through, while order numbers that look like IDs get masked), and false confidence (developers log whole objects because there's a safety net). It's suitable as a last backstop, not the main defence.

**Detailed explanation**: A busy service may write tens of thousands of lines per second; running five or six regexes on each costs noticeable CPU, and a badly written regex can even trigger catastrophic backtracking. False positives hide key information when debugging; false negatives are the real risk — a phone number with spaces or dashes, or inside escaped JSON. The main defence should be not printing it at the source, enforced through DTO design, code-review rules and static analysis (for example flagging log calls that pass objects containing sensitive fields).

**How to answer**: List the three problems with a concrete example each, then position it as "don't print at the source first, regex as a backstop".

### How is masking different from encryption, and when do you use each?

**Core answer**: Encryption is reversible: with the key you get the data back, and its purpose is protecting data at rest and in transit for legitimate users who need the full value. Masking is usually irreversible, and its purpose is to show people or systems that don't need the full value only what they need. They are often combined: store ciphertext, decrypt and then mask for display.

**Detailed explanation**: The deciding question is whether the recipient needs the full value. A payment service needs the full card number, so it's encrypted in transit; support only needs to confirm the last four digits, so it's masked on display; a test environment needs no real data at all, so it's replaced. There's also pseudonymization: replacing identifiers with a deterministic transform so analytics can still link the same user without identifying them directly. Regulations such as GDPR treat pseudonymized data (still personal data) differently from anonymized data (which may fall outside the rules).

**How to answer**: Distinguish them along two axes — reversible or not, and whether the recipient needs the full value — and use how a card number is handled at each stage as the example.

### Why do inconsistent masking rules cause data leaks?

**Core answer**: If page A hides the middle four digits of a phone number and page B hides the last four, anyone who can see both pages can combine them into the full number. Masking rules must be uniform across the system and produced by a shared component, not implemented page by page.

**Detailed explanation**: This "combination leak" is common in large systems because different teams implement masking separately and each believes theirs is fine. Likewise, a report that masks names but keeps birth date, postcode and gender may still uniquely identify people, since those three together are enough in many places. So masking can't look at single fields only; it has to assess how identifying combinations of fields are. Put the rules in a shared library and flag hand-rolled masking logic in code review.

**How to answer**: Use the intuitive phone-number-stitching example, extend it to quasi-identifier combinations, and give "one shared component with uniform rules" as the fix.
