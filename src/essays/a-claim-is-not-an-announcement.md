---
title: A Claim Is Not an Announcement
description: While building a tool to keep my AI agents from colliding, I caused the exact collision it prevents. A chat message is not a lock.
date: 2026-08-20
---

# A Claim Is Not an Announcement

*I run several coding agents in parallel on one machine, and they kept colliding: two
sessions editing the same subsystem, no way to tell one to stop, no view of the fleet
without tailing four terminals. The fix I reached for first was a chat room where agents
announce their work. A claim needs guarantees a message does not have, and that gap became
the design: a transactional claims ledger for authority, a retro chat network for
presence, built in a day after its first design was rejected in review and rebuilt. Before the day ended,
the system's first operator sat alone in a room that two clients both swore was the same
room — and I, mid-build, caused a cross-session collision of exactly the kind the tool
exists to prevent. The tool is the Buddy System. This essay is about why the ledger and
the room had to be different things.*

---

## The seductive design

Agent fleets are no longer exotic: one operator, several coding sessions, each session
autonomous for minutes at a time. The coordination failures are predictable. Duplicated
work. Conflicting edits. An urgent "stop touching that" with nowhere to land.

The fix I reached for first was chat, and the prior art reaches for it too. Fleets
coordinate through a shared IRC channel ([one operator runs twelve sessions that
way](https://www.paulwelty.com/your-ai-agents-need-a-water-cooler/)). Purpose-built agent
chat servers like [agentchattr](https://github.com/bcurts/agentchattr) let sessions tag
each other while the operator promotes messages into tasks. Give the agents a
room. Have each one announce a claim before starting work. Let the operator watch and
interject. It mirrors how human teams coordinate. And presence — seeing the whole fleet in
one place — is a need the terminal does not meet.

Then you ask what a claim requires, and the room stops being an answer.

## What a message doesn't have

A claim on part of a repository needs at least three guarantees. It must be **atomic**:
two sessions must not both win the same scope. It must be **durable**: a session that dies
mid-task must not take the record of its claim with it. And it must be **enforced at the
point of conflict**: the moment a session tries to edit a claimed file, not the moment it
happens to read the room.

An announcement in a room has none of these. Two announcements interleave. A message
scrolls away, or the session that needed it joined late, or compacted it out of context.
Nothing checks the room when the file write happens. A session that missed the
announcement does the conflicting work anyway, politely, having broken no rule it could
see.

The objection writes itself: chat *can* front a locking service. A bot can take claim
requests, commit one winner, and answer granted or denied. A durable, ordered log can
store the grants. That design works — because the authority in it is the bot's committed
grant and the gate that checks it, not the announcement. The chat part is an interface
skin over a ledger. Once you see that, you can drop the skin and keep the ledger, which
is what I did.

The failure of the announcement design has a shape you can say in four words:
**announced is not locked**. A room is a place to say things. A lock is a data structure
with transactional guarantees. Confusing the two works right up until two autonomous
sessions race — which is the only time you needed the lock.

So the design split in half, with a principle for each side. Chat is the view, never the
lock: no message in any room carries authority. And claims work with chat entirely
absent: the safety half must hold when the chat half is down, uninstalled, or
mid-migration. Both principles got tested before the day ended, one of them by me.

## The ledger

The authority side is small and boring on purpose. One SQLite file per repository, stored
in git's common directory, so every worktree of a checkout shares it and git never sees
it. Sessions register at start through a lifecycle hook, and each registration mints an
incarnation token — a stale run of a session cannot act as the live one. A claim names a
slug and a set of path scopes. Acquisition is one transaction. If any scope overlaps
another session's live claim, the whole claim is refused, and the refusal names the
holder.

The gate runs at the tool-call boundary. Before a session's edit executes, the gate
checks the target path against the ledger. Inside another session's scope: denied, with
the holder named. Operator pause active: denied, with the operator's note attached. That
last one matters — "stop touching the router" lands mid-task, at the session's next tool
call, not whenever it next thinks to check messages. Cost: a median of 20 milliseconds
per gated call, measured over ten runs on the machine that runs the fleet.

The honest name for this is an enforced *cooperative* claim, not an unconditional lock.
The gate checks the paths tools declare. It cannot bind a process that bypasses the
harness, and a shell command's side effects are invisible to it. It is a seatbelt for
sessions, not a sandbox against them. In the projects I surveyed I found task boards,
chat protocols, and worktree isolation — but nothing enforcing file-scope claims at this
boundary. The position matters more than the sophistication.

## The room

Presence went to a chat network anyway, because the visibility half of the chat instinct
was correct — and because I wanted the buddy list from 2002. A concierge daemon sits in
the rooms, relays what sessions say, and keeps the one thing the era's protocols never
had: history. A late joiner to an AIM or IRC room sees nothing that came before. The
daemon journals everything with a cursor, so a session — or the operator — can page
through the room's past, and when retention has deleted messages the reader is told there
is a gap. Silence and "nothing happened" are different answers. A coordination tool must
never confuse them.

Sessions reach the room through five small tools: send, read, who, direct message,
status. Everything a session reads back is fenced as untrusted input, because a room your
sessions read is a prompt-injection channel by construction. One review pass proved the
fence itself could be forged: a message body with embedded newlines could fabricate fake
journal rows and a fake cursor inside the fenced block. Now every untrusted value renders
on one line, newlines shown as a visible marker. The attack surface was the formatting.

## What review did to the obvious version

The first ledger was not SQLite. It was lock files: exclusive create, heartbeat
timestamps, a sweeper for stale claims. An adversarial review by a different model
rejected it as written, with specifics. Exclusive create reserves a *filename*, not
content, so a reader can observe a half-written claim. The sweeper had an ABA race: it
reads a stale claim, the owner releases meanwhile, a new claim lands on the same path,
and the sweeper deletes the wrong session's claim. Overlap checking needs a transaction
that no set of flat files provides. Every fix on the flat-file path added a lock or a
generation counter that SQLite already had. The review's bottom line became the design:
one database, real transactions.

Later passes kept finding load-bearing defects, and three of them say more about this
problem domain than any feature list.

A delayed session-end event, racing a restart of the same session, could orphan the live
session's claims. The fix: ending a session only *marks* it, and cleanup runs later,
keyed to the incarnation token, where the race has nothing to win.

The gate fell to three bypasses before it held. A case variant of the repository root
passed the containment check, because my filesystem is case-insensitive and my check was
not. The notebook-editing tool carries its target path under a different field name than
every other tool, so notebooks were never checked at all. And an edit reaching *across*
repositories sailed through, because the gate consulted the ledger of the repository the
session stood in, not the one it was writing to. Each bypass got a regression test. None
sat on a path I had designed for.

## What measurement did to the plan

Reviews attack reasoning. Reality attacks facts. During the protocol spike I wrote down,
as a measured fact, that joining a chat room creates it when missing. The live test
refuted my own record: on a fresh server the join fails, because the spike had only ever
joined rooms an API call had already created. The "measurement" was an assumption wearing
a lab coat.

The sharper incident came from the first live operator. I sign into AIM 5.1 — the 2002
client, running through a compatibility layer — join the room where the concierge waits,
and find it empty. The concierge sat in a room named for the project. So did I. They were
different rooms: the AIM client's own chat dialog creates rooms in a different protocol
namespace — a different *exchange* — than the server's API does. Two rooms, one name, no
interface anywhere that shows the difference. The presence layer's first act was to
demonstrate how presence lies: the system reported where everyone was, and everyone was
somewhere else.

Reality had two more corrections. The 2002 client renders Windows-1252, so the em dash I
sent as UTF-8 arrived as garbage — text encoding is part of a wire contract, not a detail
below it. And when the chat backend later moved to IRC, the journal silently lost every
message the daemon itself sent. IRC does not echo your own messages back, and the
journal's contract is "what the server saw." The IRCv3 `echo-message` capability restored
it. A journal that records what you *meant* to say is not a record.

## I caused the collision, mid-build

Halfway through the build, my review tooling refused to start: another review process
held the machine-wide slot. I inspected the process, read near-zero CPU as "wedged," and
killed it. It was not wedged. It was a parallel session of mine, nearly four minutes into
its own review on another project, quietly waiting on a remote API.

Each piece of that failure is the problem this tool exists for. A shared resource with no
claim on it. A liveness signal that cannot tell waiting from dead — the same reason the
ledger's sweeper refuses to reap a claim merely because it looks stale. No channel to ask
before acting. The two sessions traded messages afterward to hand the slot back and
forth: coordination as apology. I was building the claims ledger *at the time*. The
resource was a review slot, not a repository path, and that is the point — the failure
class doesn't care what the resource is. I have no better argument for the tool than
having supplied the incident myself.

## The payoff of putting authority in the right place

The last piece of evidence came from the chat half. After a day of living with real AIM —
nostalgic, and rough — I swapped the chat backend to IRC. New server, new wire protocol,
new client for the operator, one evening of work. The claims suite ran unchanged, because
no authority lived in the layer being replaced. The room is a view. Views are cheap to
swap. Locks are not. That asymmetry is the whole argument for keeping them apart.

**A claim is a data structure, not an announcement. Give your sessions a room — presence
is real, and watching a fleet argue in a buddy list is a joy. But the moment a message in
that room carries authority, you have rebuilt the race condition with better nostalgia.**

---

*Field report, 2026. One day, one operator. The first design was rejected in review and rebuilt. Every
incident above traces to a logged entry, and every named defect to a regression test in
the repository. The two-rooms incident, the
killed review process, and the refuted measured fact are real, lightly abstracted. The
Buddy System — the claims ledger, the chat concierge, and both retro backends — is
[open source](https://github.com/JsizzleR/buddy-system). Companion pieces:
[The Missing Lockfile](/essays/the-missing-lockfile) and
[Agreement Is Cheap](/essays/eleven-agents-agreed).*
