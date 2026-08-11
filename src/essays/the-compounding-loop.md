---
title: The Compounding Loop
description: A field manual for running AI coding agent sessions that get better every week instead of starting from zero every morning.
date: 2026-08-11
---

# The Compounding Loop

*A field manual for agentic engineering: how to run Claude and Codex sessions that get better
every week instead of starting from zero every morning. Distilled from a year-long project with
400+ logged decisions, for you to bootstrap in an afternoon.*

---

## Contents

- [00 · The thesis](#00--the-thesis)
- [01 · The five documents](#01--the-five-documents)
- [02 · The session loop](#02--the-session-loop)
- [03 · Receipts](#03--receipts)
- [04 · Review layers are disjoint](#04--review-layers-are-disjoint)
- [05 · Evidence rules](#05--evidence-rules)
- [06 · Two tiers of decision](#06--two-tiers-of-decision)
- [07 · The flywheel rule](#07--the-flywheel-rule)
- [08 · The starter file](#08--the-starter-file)
- [09 · Day one](#09--day-one)

---

## 00 · The thesis

**You are not prompting an assistant. You are staffing a rotating crew of amnesiac senior
engineers.**

Every session, a very capable engineer shows up with zero memory of yesterday. The naive response
is to write better prompts. The response that compounds is to build the **institutional memory**
that makes any competent engineer effective on day one: a handbook they must read, a log of every
decision already made, a ledger of known problems, and gates that mechanically refuse work that
skips the process.

Three beliefs underneath everything else:

- **A rule that depends on being remembered is not a rule.** If a lesson matters, it becomes a
  line in a file the agent is forced to read, or better, a script that fails the commit.
  Prompting harder is not a mechanism.
- **Recorded is not queued.** A problem noted in prose inside an old log entry is effectively
  lost — nobody re-reads old entries. Known problems live in one structured ledger that gets read
  whole, every session.
- **The process must be falsifiable.** "I reviewed it" is a claim. A grep-able receipt in the
  commit, checked by a pre-push script, is evidence. Everything below is built so that skipping a
  step is *visible*, not just discouraged.

> Don't copy another project's earned rules — copy the machine that earns them. Rules you didn't
> earn will get routed around; the machine will grow your own.

## 01 · The five documents

The whole system is five files in the repo. The discipline is that each has one job, and content
that lands in the wrong file is effectively deleted.

| File | Job | Read discipline |
| --- | --- | --- |
| `CLAUDE.md` / `AGENTS.md` | **The standing authority.** The only file guaranteed to be read every session. Session protocol, invariants, and every durable rule the project has earned. If a rule binds future sessions, it lives here or it doesn't exist. | Loaded automatically, every session. |
| `docs/status.md` | **Where the build is right now** and the single next step. New state is appended to the top; old chronology moves to an archive file so the doc stays within one read. | Read first, every session. |
| `docs/decisions.md` | **Append-only log of every judgment call**, numbered (D-001, D-002…). Rationale included. Nothing in it is ever relitigated — a session that disagrees flags it to the human instead. | Grep by number or keyword. Never read whole; it grows unbounded. |
| `docs/residuals.tsv` | **The known-unfixed ledger.** One row per deferred defect or open question, tab-separated, numbered (R-001…), with a state and a tier. This is the backlog; prose is not. | Short by design. Read whole, every session. |
| `scripts/check-*.sh` | **Executable definitions of done.** Every work item has a done-check script; "done" means the script exits green, not that the agent says so. A registry file lists them all with a tier (hermetic / integration) so none can be silently orphaned. | Run before every commit. |

Two of these deserve emphasis because they're the ones people skip. The **decisions log** is what
stops the most expensive failure mode in agentic work: a fresh session confidently re-deciding
something that took three sessions to settle. The **residuals ledger** is what stops the second
most expensive one: real defects noted mid-session and then lost forever in scrollback.

## 02 · The session loop

**One item, one done-check, stop.** Every working session has the same shape, and the kickoff
prompt is nearly identical every time:

```
Read docs/status.md and docs/residuals.tsv. Execute the next work item only.
Stop when its done-check is green.
```

1. **Orient.** Read status, read the residuals ledger whole, grep decisions for anything touching
   the item.
2. **Surface assumptions before building.** State the interpretation, the competing ones, and a
   brief step→verify plan. Push back if a simpler approach exists. Ambiguity is never
   self-authorization.
3. **Evidence before fix.** Reproduce the failure (a red test, a measured exploit) before writing
   the fix. A fix without a prior red is a hypothesis with a commit hash.
4. **Build surgically.** The smallest *complete* change that satisfies the item, its done-check,
   and the invariants. Every changed line traces to the item. No drive-by improvements, no
   speculative abstraction, no unrequested configurability.
5. **Gate.** Run the check suite. Run the review the change class demands (§04). Commit at each
   green sub-step, small and described.
6. **Close the books.** Update status.md, append the decision entry with its receipts (§03),
   ledger any residual the work created — *in the same commit* — then stop. Don't start the next
   item; the human decides the sequence.

> **Field note — the vacuous test.** A test that needed a child process to reach a state before a
> deadline was tuned with a snug timeout. The fork alone cost ~200ms on that machine, so the
> deadline killed the child before the precondition existed — and the test *passed*, for a reason
> unrelated to the property. Nothing noticed until a mutation battery reported the guarded defect
> as a survivor. The rule it earned: a test's precondition must be *observable* (have the fake
> stamp a marker file and stat it), and any test that can pass vacuously eventually will.

## 03 · Receipts

**Process claims you can grep for.** Every decision entry (and its commit body) carries one-line,
machine-checkable receipts. A tiny pre-push script greps for them and refuses the push if one is
missing. This sounds bureaucratic; in practice each is one line, and each exists because its
absence caused a real loss.

```
DG: D-142 panel+codex+reverify      # what review this change got, or "DG: none (docs only)"
RESIDUALS: R-071                    # deferred work ledgered in THIS commit, or "none"
DURABLE: CLAUDE.md "count before and after"   # the lesson, promoted verbatim, or "none"
JG: codex — ship-unfixed call UPHELD          # a judgment call shown to a 2nd model, or "none"
```

- **DG (diverse-gate)** answers: *was the code reviewed, and by what layers?*
- **RESIDUALS** answers: *did anything this change deferred get written into the ledger?* "None"
  is legitimate and must be said explicitly.
- **DURABLE** answers: *if this taught a lesson that binds future sessions, did it land in the
  standing authority?* The gate greps the named file for the verbatim phrase, so the receipt
  can't rot into an unchecked claim.
- **JG (judgment-gate)** answers the subtlest one: *when you decided to ship a known defect,
  decline a reviewer's remedy, or descope adjacent work — did anyone but the author ever see the
  reasoning?* Give the second model the strongest case *against* your call, then verify its
  load-bearing claims yourself.

> The pattern generalizes: any process step you care about gets a grep-able receipt and a script
> that fails without it. Culture is what the pre-push hook enforces.

## 04 · Review layers are disjoint

**Run more than one.** Measured repeatedly on real defects: each review layer catches things the
others structurally cannot, so "we reviewed it" means naming *which layers*.

- **A same-model multi-agent panel** buys breadth — many eyes on many files at once. It does not
  buy diversity: eleven agents from one model family share one blind spot, and they have
  unanimously endorsed a mechanism that was simply wrong.
- **A different-model pass** (Claude reviews Codex's work; Codex reviews Claude's) buys *frame*
  diversity. This is the mandatory gate for anything touching security boundaries, concurrency,
  or data mutation/deletion. Practicalities that matter: inline the code under review directly in
  the prompt (a reviewer allowed to explore burns its whole budget reading), state external facts
  as givens, ask 4–6 numbered questions, and keep it foreground where you can watch it.
- **A re-verify of the fixes** is its own layer. Fixes-to-review-findings are repeatedly
  themselves insufficient, and only a second pass over the fix catches it.
- **Mutation testing** reviews the *tests*: patch a deliberate bug in, and if the suite stays
  green, the test was theater. It is the only layer that finds vacuous tests, because a vacuous
  test is invisible to its author, to reviewers, and to itself.

> **Field note — the bypassed guard.** A security guard was added at one call site and carefully
> reviewed — two different-model passes plus a re-verify, all green. The defect: a *second* call
> site built the same path inline and never called the guard. Every reviewer was scoped to the
> diff, and the diff didn't contain the bypass. The rule it earned: a guard's review scope is
> every site that *bypasses* it, never the diff. Before review, grep for every constructor of the
> thing being guarded and hand the reviewers that list.

## 05 · Evidence rules

**What counts as knowing.**

- **Measure the interface.** Before integrating anything you don't control — a CLI, an API, a
  wire format — verify the actual contract by running it. A design doc's description of an
  external interface is a hypothesis; a test written against the assumption stays green while
  reality differs. (One integration was planned on five assumed facts about a third-party tool.
  All five were wrong. A thirty-minute clone-and-read caught it.)
- **A search that matches nothing looks exactly like "nothing left to do."** Broken regex flavor,
  un-split shell variable, byte-oriented tool on UTF-8 — each returns empty, and empty reads as
  success. The defense is never remembering the traps: **count occurrences before and after** and
  require the counts to reconcile.
- **Verify a gate fires on a defect you didn't design it around.** Your test of your own check
  will be tuned to your own pattern. Write the probe as the mistake an *unaware* author would
  make. Prefer counting an inventory ("exactly N call sites, named") over grepping for a shape.
- **Prefer fail-closed instruments.** A count inflated by noise goes red and gets looked at; a
  count silently deflated by a parsing quirk hides a real defect forever. When two failure modes
  conflict, pick the one that complains.
- **Test the configuration you ship**, not the one that's convenient in the harness. And when a
  claim matters, demand verbatim quotes and commands from any agent reporting it — a summarizing
  agent is a fabricating agent.

> **Field note — the silent sensor.** A nightly full-suite run on a second machine went red four
> nights in a row. Nobody saw, because the reporting channel had quietly broken — and a silent
> sensor hides an unbounded number of reds. Now a hook prints the nightly verdict at the top of
> every session, and *"no report" is treated as worse than "red."* The rule it earned: sensors
> get sensors. Any automated check whose failure is silent isn't a check.

## 06 · Two tiers of decision

**And the agent knows which is which.** Every open question carries a tier. **Session-tier**
questions are within a working session's authority: the agent decides, logs the decision, moves
on. **Owner-tier** questions — anything touching product direction, security posture, spending,
external commitments, or accepting a known defect as permanent — are *queued for the human*,
never decided, no matter how obvious the answer looks.

The phrase that does the work, verbatim in the standing authority: *ambiguity is never
self-authorization*. An agent that hits an ambiguous owner-tier question stays inside settled
scope, writes a ledger row tagged `tier=owner`, and continues with what is unambiguous. You then
answer owner rows in batches, and the answers become decision-log entries the next hundred
sessions inherit.

This tiering is what makes it safe to let sessions run long and autonomous: the blast radius of
agent judgment is bounded by construction, not by hoping the model is appropriately humble that
day.

## 07 · The flywheel rule

**Every failure becomes structure, in the same commit.** This is the rule that makes the system
compound rather than merely operate. When something goes wrong — a bug escapes, a review misses,
a shell one-liner silently does nothing — the response has three mandatory parts, and they land
in the *same commit*:

1. **Fix the defect**, with a reproduced red first.
2. **Add a gate that would have caught it** — a test, a check script clause, a receipt — and
   verify the gate actually fires, on a breakage you didn't design it around.
3. **Promote the lesson to the standing authority.** Ask: *would this force a future session to
   re-derive what I know right now?* If yes, it becomes a line in CLAUDE.md (with the DURABLE
   receipt); if it's a fact, it becomes a memory note; if it's an open question, a ledger row.
   Prose in a log entry is where lessons go to die.

"Same commit" is load-bearing. Deferred documentation doesn't happen; a lesson written down next
week is a lesson lost. The result, after a few months, is a CLAUDE.md where nearly every line is
a scar with a number attached — and new sessions that simply do not make last quarter's mistakes.

## 08 · The starter file

Paste this as `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex) at the repo root, fill the
brackets, and create the three docs plus one check script it references. It is deliberately
short: everything project-specific gets *earned* into it via the flywheel.

```markdown
# <project> — Agent Conventions

## What this is
<Two sentences: what the project is, and the single north-star capability
that defines "done enough to matter.">

## Read this first, every session
1. docs/status.md — where the build is and the single next step.
2. docs/residuals.tsv — the known-unfixed ledger. Read it whole. `state=open`
   rows are the backlog; `tier=owner` rows are BLOCKED on a human ruling and
   must never be decided by a session.
3. docs/decisions.md — append-only log of settled judgment calls (D-numbers).
   Grep it by number/keyword; never read it whole. Do NOT relitigate anything
   in it — a session that disagrees flags the human instead.

## Session protocol
- Execute exactly ONE work item per session. Kickoff: "Read docs/status.md
  and docs/residuals.tsv; execute the next item only; stop when its
  done-check is green."
- Every item has a done-check script (scripts/check-*.sh). Done = the script
  is green, nothing else. If a check can't run in this environment, say which
  step is blocked, run the closest proxy, and ledger the residual — never
  silently downgrade.
- Done-check green → update docs/status.md + append docs/decisions.md →
  commit → STOP. Small, described commits at each green sub-step.

## Session conduct
- Simplicity first: the smallest COMPLETE change satisfying the item, its
  done-check, and the invariants. No single-use abstractions, no unrequested
  configurability.
- Surgical changes: every changed line traces to the item. No drive-by fixes;
  mention what you noticed, ledger it if real, don't fix it.
- Evidence before fix: reproduce the red (failing test / measured exploit)
  before fixing; else record pre-fix evidence and a regression criterion.
- Surface assumptions and a brief step→verify plan before non-trivial work;
  push back when a simpler approach exists. Ambiguity is never
  self-authorization on an owner-tier question — queue a `tier=owner` row.
- Measure the interface: before integrating anything external, verify its
  ACTUAL contract by running it. The spike gates the plan.

## Review gate — standing, not optional
- Changes touching security boundaries, concurrency, or data
  mutation/deletion get BOTH a multi-agent adversarial review AND a
  different-model pass (<Codex reviews Claude's work, or vice versa>), THEN a
  re-verify of the fixes. Scope every reviewer to the diff — EXCEPT a guard,
  whose scope is every call site that bypasses it.
- Inline the code under review in the reviewer's prompt; state external facts
  as givens; ask 4–6 numbered questions.

## Receipts — every decisions.md entry carries these, grep-able
- DG: <what review this got>            or  DG: none (<reason>)
- RESIDUALS: <R-numbers ledgered>       or  RESIDUALS: none
- DURABLE: <file> "<verbatim phrase>"   or  DURABLE: none (<reason>)
- JG: <model — call, verdict>           or  JG: none (<reason>)
  (JG is required when shipping a known defect, declining a reviewer's
  remedy, or descoping adjacent work.)
- scripts/check-receipts.sh greps for these and fails the push if missing.

## The flywheel — same commit, always
When something goes wrong: (1) fix it with a prior red; (2) add a gate that
would have caught it and VERIFY the gate fires on a breakage you didn't
design it around; (3) promote the lesson here if it binds future sessions.
Test: "would this force a future session to re-derive what I know now?"

## Invariants — never violate; flag if code would
<Start with 3–5 you actually hold, e.g.:>
- <e.g. "All user input is hostile: validate paths, cap sizes, never let
  config values reach a shell.">
- <e.g. "Secrets never transit the repo and are never logged.">
- <e.g. "The deploy path is append-only / blue-green / reversible.">

## Environment gotchas (earned — starts empty)
<Every verified machine-specific fact lands here so no session re-derives it.>
```

## 09 · Day one

1. **Create the substrate** (~30 min): the starter file above, an empty `docs/status.md` with the
   current state and next step, `docs/decisions.md` with entry D-001 ("adopted this process"),
   `docs/residuals.tsv` with a header row (`id  state  tier  summary`), and a
   `scripts/check-receipts.sh` that greps the newest decision entry for the four receipts.
2. **Wire the second model.** Install whichever of Claude Code / Codex CLI you don't main, and
   script the review invocation once (`scripts/review.sh <prompt-file>`) so every session calls
   it the same correct way instead of re-deriving flags.
3. **Run the loop on something small.** Pick a real item, write its done-check first, run the
   kickoff prompt, and insist on the full close-out (status + decision + receipts) even though it
   feels like ceremony at n=1. The habit is the product.
4. **Feed the flywheel from the first failure.** Something will go wrong in week one. That's the
   system's first meal: fix, gate, promote — same commit. Six months of this is the difference
   between a prompt and a practice.
5. **Batch your owner rulings.** Once ledger rows tagged `tier=owner` accumulate, sit down
   periodically and rule on them in batches. Your answers become decision entries — which is how
   *your* judgment, not just the model's, ends up encoded in the repo.

Two warnings from experience. First: the documents are load-bearing only if the read discipline
holds — status stays short, decisions stay grep-only, residuals stay a ledger and never a diary.
Second: resist importing another project's scar tissue wholesale. A forty-rule CLAUDE.md on day
one is noise the agent learns to skim; a rule earned from your own failure, landed the same day
with its gate, is one the system actually keeps.

---

*Distilled 2026 from a live single-operator project: ~400 logged decisions, a residual ledger,
nightly full-suite runs on a second machine, and a pre-push hook that greps for receipts. Shared
freely; adapt freely.*
