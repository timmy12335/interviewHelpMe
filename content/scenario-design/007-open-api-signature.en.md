---
title: "Designing a public API for partners: signatures, replay protection and permissions"
---

# Question

Your company is opening order lookup and order creation to external partners. How would you secure this public API? How do you confirm who is calling, make sure the request wasn't tampered with, and stop an intercepted request from being sent again?

## Core Answer

The standard approach is **AppKey + AppSecret + an HMAC signature**. The platform issues each partner a public AppKey and a secret AppSecret. To call, the partner builds a string-to-sign from the HTTP method, path, sorted parameters, a hash of the body, a **timestamp** and a **nonce**, computes HMAC-SHA256 over it with the AppSecret, and sends the signature in a header. The server recomputes it with the same rules and compares, which proves **identity** (only the secret holder can produce it) and **integrity** (change any parameter and the signature no longer matches). **Replay protection** comes from the timestamp plus nonce: reject requests whose timestamp is more than ±5 minutes off, and store nonces seen within those 5 minutes in Redis, rejecting duplicates. Everything runs over HTTPS, with IP allow-lists, permission scopes, per-AppKey rate limits and full audit logs on top.

## Detailed Explanation

**Why HTTPS alone isn't enough**: HTTPS protects data in transit, but it doesn't prove which partner is calling, and it can't stop a request from being replayed after a partner's system or logs leak. A signature binds identity to the request content at the application layer.

**Designing the string-to-sign**: Sort parameters by key and join them in a fixed format, or differing serialization order on each side breaks the signature. Don't put the body itself in the string; use its SHA-256 hash to avoid processing large bodies. Spell out empty values and encoding rules (such as URL-encoding case) in the docs — that's where integrations most often go wrong. Compare signatures in constant time to avoid timing attacks.

**Two conditions for replay protection**: With only a timestamp, an attacker can still replay within 5 minutes. With only a nonce, you'd have to keep every nonce forever. Together, nonces only need to be kept for the window (`SET nonce:<appKey>:<nonce> 1 NX EX 300`), because anything older is already rejected by the timestamp. This requires both sides' clocks to be roughly in sync.

**Permissions and quotas**: Bind each AppKey to the endpoints it may call (scopes) and the data it may see (only its own orders), and enforce this centrally at the gateway. Rate-limit per AppKey so one partner's bug can't take down the platform. Write endpoints like order creation should also require a business idempotency key (such as the partner's external order number) so the partner's own retries don't create duplicates.

**Secret lifecycle**: Show the secret once at creation and store it encrypted on the platform side. Allow two active secrets at once for seamless rotation, and support immediate revocation if one leaks. Higher-security cases switch to asymmetric signatures (the partner signs with a private key, the platform verifies with the public key, so the platform never holds the partner's secret), or use mTLS or the OAuth 2.0 client-credentials flow.

## How to Answer

Map the problem to three security goals — identity, integrity and replay protection — and explain which one the HMAC signature and the timestamp-plus-nonce each solve. In the details, mention sorting parameters, hashing the body, constant-time comparison and keeping nonces only for the window; these are pitfalls you only know from building it. Finish with scopes, per-AppKey rate limits, idempotency keys and secret rotation to widen the answer from "a signing algorithm" to "designing an open platform".

## Script

For a public API, I map security to three goals: confirm who's calling, make sure the content wasn't changed, and stop requests from being replayed.

The most common approach is an AppKey and AppSecret plus an HMAC signature. The platform gives each partner a key and a secret. When calling, the partner builds a string from the method, the path, the sorted parameters, a hash of the body, a timestamp and a random nonce, signs it with the secret, and puts the signature in a header. The server recomputes it with the same rules. If they match, that proves both identity and integrity.

Replay protection needs the timestamp and the nonce together. Anything more than five minutes off is rejected outright. Nonces within those five minutes go into Redis, and a repeat is blocked. That way nonces only need to be kept for five minutes instead of forever.

There are a few practical pitfalls. Always sort the parameters, sign a hash of the body rather than the body, and compare signatures in constant time. And don't forget the surrounding pieces: each key gets a permission scope, rate limits are per key, order creation requires an idempotency key, and secrets must be rotatable.

## Follow-up Questions

### How is an HMAC request signature different from a JWT, and why do open platforms prefer signatures?

**Core answer**: A JWT is an identity token the server issues to the client; it proves who the holder is but isn't bound to any particular request, so a stolen token can be used for any request. An HMAC request signature covers the exact content of each request and breaks if anything changes; with a timestamp and nonce, an intercepted request can't be altered or replayed.

**Detailed explanation**: Open-platform callers are servers talking to servers, and both sides can store a shared secret safely, so per-request signing is affordable and buys stronger integrity. JWTs suit user sessions where the client is a browser or app that can't safely keep a long-lived secret. The two can be combined: obtain a short-lived access token via OAuth 2.0 client credentials, and additionally require request signatures on high-sensitivity endpoints.

**How to answer**: Contrast "a token proves identity" with "a signature proves this specific request", and explain where each fits based on the type of caller (server vs browser).

### A partner says their signatures keep failing verification. How do you debug it?

**Core answer**: On failure, have the platform log the string-to-sign it computed (never return it to the caller), and ask the partner for theirs to compare character by character. The usual causes are parameter ordering, URL-encoding case, empty-value handling, a framework re-serializing the body, and timestamp units (seconds vs milliseconds).

**Detailed explanation**: A signature is a hash, so you can't see where it differs; only comparing the raw strings pinpoints the problem. The external response just says "invalid signature" — returning the server's string-to-sign would help attackers debug. The best prevention is an official SDK plus a sandbox "signature debugger" where partners enter parameters and see the canonical string. A complete worked example with inputs and the expected signature in the docs also cuts integration effort dramatically.

**How to answer**: Describe comparing strings-to-sign, list common causes, stress that debugging info must not go back to the caller, and suggest an SDK and debugging tool as prevention.

### If a partner's AppSecret leaks, how do you handle it without breaking their service?

**Core answer**: The platform should allow two valid secrets per AppKey. On a leak, issue a new secret, let the partner switch, then revoke the old one; if abuse is confirmed, revoke immediately and accept a brief outage. Use audit logs to investigate suspicious calls made during the exposure.

**Detailed explanation**: With only one secret allowed, rotation always leaves a gap where the old one is dead and the new one isn't deployed yet, so nobody wants to rotate. With two, verification tries both, rotation becomes a painless routine, and you can even enforce periodic rotation. Audit logs must record the AppKey, source IP, endpoint and result for every call so you can assess impact afterwards. If the partner is also bound to an IP allow-list, a leaked secret is hard to use from anywhere else — the value of defence in depth.

**How to answer**: Lead with dual-secret seamless rotation, then cover emergency revocation and audit, and finish with IP allow-lists to limit the blast radius of a leak.
