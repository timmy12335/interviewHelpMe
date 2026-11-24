---
title: What do you do when your SMS verification-code endpoint is being abused?
---

# Question

One morning you notice SMS costs have spiked. The "send login verification code" endpoint is being called heavily, targeting thousands of different phone numbers. How do you stop the bleeding right now, and how should the protection be designed for the long term?

## Core Answer

SMS endpoints are abused for two reasons: **SMS bombing** (using your endpoint to harass specific numbers) and **cost draining or fraud relay** (mass sending to many numbers). Protection must be layered, because any single layer can be bypassed. Layer one is **bot verification**: a CAPTCHA or behavioural check before sending, with a single-use pass bound to the phone number. Layer two is **multi-dimensional rate limiting** per phone number, IP, device fingerprint and global volume. Layer three is **business rules**, such as sending login codes only to registered numbers and disabling international SMS by default. Layer four is **monitoring and circuit breaking**: alert and degrade automatically when volume or cost exceeds the baseline. For the emergency, set a global cap and turn off international SMS first, then enforce bot verification.

## Detailed Explanation

**Emergency order of operations**: First set a daily total cap in the SMS provider's console or your gateway to stop the cost immediately. Next, look through the logs for shared traits (IP ranges, User-Agent, number prefixes, country codes) and block them with WAF or gateway rules. Finally, ship mandatory bot verification. The first two are minutes-long configuration changes; the third needs frontend and backend work.

**Doing bot verification right**: A common mistake is returning a reusable "passed" state after the CAPTCHA, so an attacker who solves it once can send forever. Instead, issue a single-use ticket bound to the phone number with a short expiry, and consume it when sending the SMS. CAPTCHA validation must happen on the backend; the frontend only displays it.

**Multi-dimensional rate limiting**: Same number once per 60 seconds and 10 per day; same IP 20 per hour; same device fingerprint 30 per day; global volume per minute capped at a few times the normal peak. Redis counters with a TTL or a sliding window are enough. IP alone is bypassed with proxy pools, and number alone can't stop many different numbers, so the dimensions must be combined.

**Business rules shrink the attack surface**: Send login codes only to registered numbers (and respond identically for unregistered ones so you don't leak registration status). Registration codes can require an invitation or stricter verification. International SMS is expensive and popular for fraud, so disable it unless needed, or allow only the countries you operate in.

**Monitoring and automatic circuit breaking**: SMS burns money directly, so monitor it in units of cost. Alert on week-over-week or day-over-day volume anomalies, a sudden jump in one country code's share, and sends that succeed while the verification success rate is very low (meaning the recipients aren't actually trying to log in). In severe cases, automatically restrict the SMS channel to an allow-list, or switch to voice calls or app push for verification.

## How to Answer

Start by distinguishing the attacker's motives, which shows you understand what they're after. Then answer in two parts: emergency response, which is about speed (total cap, blocking rules), and long-term protection, which is about layers (bot verification, multi-dimensional limits, business rules, monitoring and circuit breaking). Call out that the bot-verification pass must be single-use and bound to the number, and that verification success rate is a key signal — details only people who've handled this tend to mention.

## Script

When the SMS endpoint is being abused, I first work out what the attacker wants. Either they're using our endpoint to bomb a specific person, or they're mass-sending to many numbers to burn our money, or even using us as a relay for scam texts.

To stop the bleeding, step one is setting a daily total cap in the provider's console so the cost stops. Step two is finding shared traits in the logs, like IP ranges, country codes or number prefixes, and blocking them at the gateway. Step three is shipping mandatory bot verification.

Long term, protection has to be layered, because any one layer can be bypassed. Bot verification must be done right: passing it issues a single-use ticket bound to the phone number, consumed when the SMS goes out. Rate limits need several dimensions: same number, same IP, same device, plus a global total. On the business side, login codes only go to registered numbers, and international SMS stays off unless we need it.

Finally, monitoring. SMS costs money directly, so I alert in units of cost, and I watch the verification success rate. Lots of codes sent but almost nobody entering them means we're being abused.

## Follow-up Questions

### What if the attacker uses large proxy pools and CAPTCHA-solving services?

**Core answer**: Once every single rule can be bypassed, raise the attacker's cost and move to a combined risk score: device fingerprint, behavioural signals (drag trajectory, interaction timing), IP reputation and number reputation together. Demand harder verification or reject high-risk requests, and tune thresholds dynamically using outcome metrics such as verification success rate.

**Detailed explanation**: CAPTCHA-solving services cost a fraction of a cent per solve, and proxies are cheap, but the attacker's real metric is cost per successfully sent SMS. If your defences push that above their payoff (or above your SMS price), the attack stops making sense. A risk score turns weak signals into a strong one: a new device, a data-centre IP, a virtual-number range and suspiciously fast interaction are each insufficient to block alone, but together they justify a rejection. Commercial risk services also bring cross-platform blacklists.

**How to answer**: Admit single rules get bypassed, propose raising attacker cost with a multi-signal risk score, and mention feeding outcome metrics back in — that shows an adversarial mindset.

### Rate-limit counters live in Redis. What if Redis goes down?

**Core answer**: Rate limiting is a protective feature, so decide whether it fails open or fails closed. For an endpoint that spends money directly, lean towards failing closed or degrading to local rate limiting: briefly affecting some users is better than letting attackers send without limit during the outage. The provider-side cap is the last line of defence.

**Detailed explanation**: Many systems simply allow requests when Redis throws, to protect availability, but for SMS that opens an attack window. A middle ground is a coarse local token bucket in each instance — say at most 5 SMS per second per instance — to hold the line until Redis recovers, plus an independent daily cap in the provider console, which doesn't depend on your infrastructure at all. That is defence in depth: each layer assumes the one before it can fail.

**How to answer**: Name the fail-open vs fail-closed decision and choose by the nature of the resource, give local limiting and the provider cap as fallbacks, and close with defence in depth.

### How do you keep the "send code" endpoint from revealing whether a number is registered?

**Core answer**: Return the same message and the same response time whether or not the number is registered — for example "If this number is registered, you will receive a code". Only actually send to registered numbers, so unregistered ones get nothing, but an attacker can't tell the difference from the response.

**Detailed explanation**: Replying "this number is not registered" turns the endpoint into a pre-filter for credential stuffing, letting attackers sift out valid numbers. Timing can leak too: the registered branch does an extra database lookup and send, so it's slower; make both paths send asynchronously or pad the delay. The same principle applies to "forgot password" and login errors — always say "incorrect account or password" rather than which one was wrong.

**How to answer**: Cover both dimensions — identical content and identical timing — and extend it to password reset and login errors to show you understand account-enumeration attacks in general.
