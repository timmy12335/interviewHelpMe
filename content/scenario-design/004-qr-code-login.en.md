---
title: How does QR-code login work?
---

# Question

A user opens a website in a desktop browser and sees a QR code. They scan it with a mobile app where they are already logged in, tap "confirm", and the desktop is logged in automatically. Explain the design behind this: what's in the QR code, how the desktop learns that the phone confirmed, and how you stop attackers from abusing it.

## Core Answer

The core is a stateful, **one-time login ticket**. The desktop asks the server for a random, short-lived ticket ID (valid for, say, 2 minutes), encodes it in the QR code, and waits for status changes via long polling or a WebSocket. The ticket moves through "pending → scanned → confirmed → consumed", or "expired / cancelled". After scanning, the mobile app reports "scanned" using **its own login credentials**; when the user confirms on the phone, the server binds the ticket to that user and **issues a fresh token for the desktop**, which the desktop picks up on its next poll. The security keys are: the ticket is short-lived and single-use, the confirmation screen clearly shows which device and location is logging in, and the token is only handed to the desktop connection that created the ticket.

## Detailed Explanation

**What's in the QR code**: Only an unguessable ticket ID (or a URL containing it) — no user data. The server stores `qr:<id>` in Redis with the status, creation time and initiator details (IP, User-Agent, and a secret known only to that browser), with a TTL.

**How the desktop learns the status**: Short polling every second works but wastes requests. Long polling is the usual choice: the request is held on the server for up to 30 seconds and returns as soon as the status changes. WebSockets or Server-Sent Events also work. Because few people sit on the login page at once, long polling is usually enough.

**The phone's two steps — scan and confirm**: On scan, the app calls the "scan" endpoint with its own token; the server authenticates the app, marks the ticket "scanned" and records the user ID, and the desktop can show "please confirm on your phone". On confirm, the app calls the "confirm" endpoint; the server conditionally moves the ticket from "scanned" to "confirmed" and creates a brand-new session or token for the desktop. The two steps let the user see the login details before deciding, rather than logging in on scan.

**Why issue a separate token for the desktop**: The phone's token is bound to the mobile device and must not be copied to the desktop. A separate token gets its own lifetime, permissions and device metadata, and the user can sign out the desktop individually from a "logged-in devices" list.

**Preventing abuse**: The main attack is QR-code hijacking: an attacker generates a QR code on their own computer and tricks a victim into scanning and confirming it, which logs the attacker's computer into the victim's account. Defences: the confirmation screen states "you are logging in on browser X in city Y", tickets are short-lived and single-use, large location differences between scanner and initiator trigger extra verification, and users are taught not to scan login codes sent by others. Also, only a connection holding the initiator's secret can collect the token, so a leaked ticket ID can't be used to steal it.

## How to Answer

Use the state machine to walk through the flow: pending, scanned, confirmed, consumed, expired. Then describe what each of the three parties (desktop, phone, server) does, stressing that the phone proves identity with its own credentials and the server issues a separate desktop token. Finally, raise QR-code hijacking as a social-engineering attack and its defences yourself; that is what separates a senior answer from an ordinary one.

## Script

At the heart of QR login is a short-lived, single-use login ticket on the server.

Here's the flow. The desktop asks the server for a random ticket ID, turns it into a QR code, and long-polls for the result. When the mobile app scans it, it uses its own login credentials to tell the server: I've scanned this. The desktop then shows "please confirm on your phone". When the user taps confirm, the server binds the ticket to that user and issues a brand-new token for the desktop. On its next poll the desktop receives it and is logged in.

Two points matter here. First, the phone's token never goes to the desktop; the desktop gets its own credential, with its own lifetime, and can be signed out separately. Second, scanning and confirming are separate steps, so the user sees which device and where before approving.

The main threat is QR-code hijacking, where an attacker tricks you into scanning the code on their screen. So the confirmation page must show the login location clearly, tickets must be short-lived and single-use, and the token only goes to the connection that created the ticket.

## Follow-up Questions

### Why long polling instead of WebSockets, and how do you choose?

**Core answer**: QR login is a one-off, low-frequency status notification that rarely waits more than two minutes. Long polling is simple, works well through proxies and firewalls, and needs no long-lived connection infrastructure, so it's enough. WebSockets fit bidirectional, continuous, high-frequency interaction such as chat or live collaboration.

**Detailed explanation**: Long polling costs one new HTTP request roughly every 30 seconds and requires the server to hold requests without blocking threads (for example Spring's `DeferredResult` or async Servlets). With multiple instances, the status change happens on the instance handling the phone, while the desktop's poll may be parked on another, so you need Redis Pub/Sub or a message queue to notify every instance, or have the poller re-check Redis when it wakes. WebSockets have the same cross-instance problem and also need load balancers that support connection upgrades and stickiness. If the system already has a WebSocket push channel, reusing it is reasonable.

**How to answer**: Choose long polling from the traffic shape (one-off, one-way, short), then raise the multi-instance "change on A, waiter on B" notification problem to show you've thought about deployment.

### If someone photographs my QR code, can they log in?

**Core answer**: If they scan it with their own app, they log their own account into your browser — they don't get your account. The real risk is the reverse: an attacker gets you to scan the QR code on their computer, and when you confirm, their computer is logged in as you. So the defences are a confirmation screen that clearly shows the device and location, and tokens that only the initiator can collect.

**Detailed explanation**: The ticket ID carries no authority on its own; it binds to whoever scans it. A bystander scanning your code just puts their account in your browser, which is at most a nuisance, and you'd see it isn't your account. The dangerous case is the victim authorizing the attacker. Besides showing login details, you can compare the phone's and desktop's IP or location and demand extra verification when they're far apart, or restrict QR login to the same local network (some internal enterprise systems do this).

**How to answer**: First clarify the direction — whoever scans logs in their own account — then name the real threat (tricked authorization) and give the two defences: showing details and comparing locations.

### How do you keep ticket state consistent across server instances?

**Core answer**: Keep ticket state in shared storage such as Redis and make every transition atomic (a Lua script or compare-and-set). For example, only move to "confirmed" if the status is "scanned" and the confirming user is the one who scanned. Long-polling instances learn about changes via Pub/Sub or by re-checking.

**Detailed explanation**: If state lives in one instance's memory, it breaks as soon as the load balancer sends the phone and the desktop to different instances. Shared storage fixes visibility but not races: a user may tap confirm and cancel at once, or two phones may scan the same code. Wrapping "read current state, check preconditions, write new state" in one Lua script guarantees the state machine only follows legal paths. Collecting the token must also be an atomic "confirmed → consumed" transition so the token is handed out exactly once.

**How to answer**: Say "shared storage plus atomic transitions", give the two-phones-one-code race as an example, and note that token collection must also be a one-time transition.
