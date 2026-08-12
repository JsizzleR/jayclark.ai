---
title: Agreement Is Cheap
description: Eleven AI reviewers endorsed the design's worst idea. A year of receipts on why reviewer count exaggerates assurance, and what actually catches the mistakes AI-generated work makes.
date: 2026-08-12
---

# Agreement Is Cheap

*Eleven AI reviewers examined a design and endorsed its worst idea. The twelfth came from a
different lab and killed it in one pass. Two of its own four arguments were wrong too. A field report on correlated review, from a year-long
project where every review pass, verdict, and post-mortem was logged with receipts.*

---

## The eleven reviewers

The design under review fixed a real tenancy defect. On a multi-tenant box, a storage
directory was matched to its owning application by *name*, and names are reusable. Delete an
app, create a new one with the same name, and the new tenant can inherit the old tenant's
data. The proposed fix included a one-shot migration: at upgrade time, stamp every existing
storage tree with the identity of the live application whose name it matched.

I ran the design through an eleven-agent review: three independent design attempts, scoring
judges, and two dedicated adversarial refuters whose only job was to attack the winner. The
refuters found real problems the judges had missed. The judges argued. The transcript records
a disagreement over whether the design needed an operator recovery path. The disagreement was
noted and moved past. The structure had every appearance of adversarial rigor. All eleven
agents endorsed the migration.

Every one of them was the same model.

A single pass by a model from a different lab returned the finding none of the eleven had
reached: *the migration was the defect wearing a hat*. Stamping ownership onto a tree
because its name matches a live application is the same name-as-identity mistake that caused
the original bug. On any box where a name was ever reused, the fix converts a detectable leak
into a signed, permanent claim. It writes the new tenant's identity onto the previous tenant's
data, with no operator in the loop.

Do not conclude that the outside model is the hero of this story. Its verdict arrived with
four high-severity supporting arguments. I checked them against the code, and two were wrong.
One had a symmetry argument exactly backwards. The eleven-agent panel's *overall* ruling was
wrong in the opposite direction: it recommended building nothing at all, despite a live
cross-tenant leak. No reviewer in this story was reliable enough to trust without checking.
That is the subject of this essay.

## The thesis, narrowed

The short version: fan-out is not diversity. The lesson isn't that same-model review is
worthless, or that a different model is magic. It is narrower and more useful:
**reviewer count exaggerates assurance when the reviewers' errors are correlated.** Eleven
approvals from one model are worth more than one approval, but far less than eleven. The
misses concentrate exactly where the model's blind spots are. A blind spot sampled eleven
times produces eleven agreeing reviews and no coverage.

This matters now because fan-out is the easy axis. Every agentic tool makes it trivial to
spawn five reviewers with five different lenses, and the checkmarks feel like independent
opinions. The diversity they add is real but shallow. Different prompts vary what each
reviewer *looks at*. They do not vary the frame every reviewer inherits.

Here are the denominators, because stories without them are survivorship bias. The project logs
every decision with grep-able review receipts. The log holds 400+ numbered decisions, and 106
of them carry formal review receipts. The receipts record roughly 68 different-model passes,
53 multi-agent panels, 55 re-verifies of fixes, 19 mutation batteries, and 10 second-opinion
consults on judgment calls. A year of that produced three results worth naming. A cross-check
overturned **four design conclusions** that same-family review had endorsed. I checked five
reviewer claims against the code and found **all five false**. Maximum reasoning effort caught
**one defect** that every cheaper pass missed. Most passes returned nothing that changed the
outcome. The portfolio pays on the tail, and the tail is where the tenant data lives.

## Four rounds

The design that opened this essay went through four review rounds, and every round moved it.
The sequence is my cleanest evidence that breadth, diversity, and effort are different
resources. It is also the evidence that complicates any tidy story about them.

**Round one, the panel** (same family as the drafting model). It proposed a marker-file
mechanism, endorsed the migration unanimously, and ruled against building anything at all.
Wrong twice, in opposite directions: too permissive about the design's worst idea, too
conservative about fixing a live leak.

**Round two, a different-family pass** at its standard high-effort tier. It overturned the
build-nothing ruling and killed the migration, calling it the defect wearing a hat. It kept the
marker-file mechanism.

**Round three, a same-family model in a fresh session**, briefed to argue the design was
wrong. It rejected the mechanism itself, citing the project's own logged precedent. Both the
panel and the outside reviewer had walked past that precedent. **The catch that most
complicates the fan-out lesson came from the same model family.** It came from a clean context
and an explicit instruction to disagree. Model family is one source of frame diversity. A
fresh context plus an adversarial brief is another, and it is nearly free.

**Round four, the different-family reviewer again, at its maximum reasoning setting.** It
found that two operations at the heart of the corrected design required serialization that
nothing provided. The sharp detail: the racing operations belonged to *different application
identities*, so no per-app lock can cover them. The panel passed it. The standard-effort pass
passed it. Only the deepest setting, free of the design's framing, reached it.

Breadth found arguments. Diversity of family and of framing found the wrong premises. Effort
found the race. I don't claim these categories are laws. I sorted the catches into bins after
they happened, not before. But a year of receipts kept filling the same three bins, and no
cheaper resource ever covered an adjacent bin.

## What breadth is for

I told a short version of this story in
[The Compounding Loop](/essays/the-compounding-loop): a security guard, carefully reviewed,
bypassed by a call site the diff never touched. The full version shows what a panel is
actually for.

The change, a descendant of the design above, added an ownership guard in front of a storage
path. The review was thorough by any normal standard: two separate different-model passes,
then a re-verify of the fixes. All green. The defect sat elsewhere. A second call site,
serving the *default* configuration of a common deployment shape, built the same storage path
inline and never called the guard. The guard was live, tested, and reviewed, and it was off
for the most common case. Worse: the operator-facing status command reported those trees as
covered.

The different-model passes missed it because of the one practice that makes deep review work
at all. A reviewing model with repo access spends its whole budget exploring. I once watched
three consecutive review runs time out with nothing produced: twenty-seven minutes of dead
reasoning, because the reviewer kept reading the codebase instead of judging it. So I inline
the code under review directly in the prompt, state the external facts as givens, and forbid
tools. Reviews come back in minutes and find real defects. But inlining draws a boundary
around the reviewer's world. A reviewer that sees only what you pasted cannot find the call
site you didn't know to include. And "the call site you didn't know about" is exactly what a
bypass is. The deep reviewer's power and its blindness are the same property.

That is the job description for breadth. A panel of agents was pointed at the question no
inlined reviewer can answer: *find every site that builds this path, and check whether each
one goes through the guard*. Three of the five found the bypass independently. Same model
family, no family diversity at all. It didn't matter, because the task was coverage of
territory, not correctness of frame.

> **The rule this earned:** when a change adds a guard, the review scope is every site that
> *bypasses* the guard, never the diff. Enumerate every constructor of the guarded thing with
> grep before any reviewer runs, and hand the panel that list. Pointed this way, breadth
> answers "where else?". It was not asked whether the mechanism was right, and it did not
> volunteer an opinion.

## Every review output is a claim

The layers above review the code. Two more audits close the loop, and both exist because of
specific failures. The tools that verify the reviews also lie. So do the reviewers. So does
your own log.

**Mutation testing reviews the tests.** Patch a deliberate bug in. If the suite stays green,
the test was theater. I treat it as mandatory for agent-written code on this project. A
vacuous test is invisible to its author, and an AI agent is a prolific author of confident
tests. But the battery itself produced false verdicts three ways before I trusted it. A
first-match text substitution landed on the *doc comment above* the target line, because good
comments quote the code they explain. The mutant compiled, changed nothing, and was reported
as a surviving defect. I spent a session hardening a test that was never weak. The guarded
step existed in four nearly identical copies across one file, and mutants kept landing in a
copy the test never exercises. Each one compiled, survived, and raised a false alarm. And two
guarded steps in sequence masked each other's mutants in *both* directions. The inspect step
refused bad input before the create step saw it, and the create step refused what the inspect
step let through. You can delete either guard and the suite stays green. The fix that worked
was a test per step, each with input shaped to pass the other step cleanly. The harness now
verifies three things about every mutant: it compiled, it changed a non-comment line, and it
landed in the function it aimed at. A "survivor" is a claim, not a verdict.

The mirror-image lesson cost me a comfortable assumption: a battery is not a substitute for
review *of* the tests. A different-model pass read two test functions that had already
survived a mutation battery. It found five real weaknesses. One assertion located its target
by first-match, so a wider wrong answer also passed. One test derived its expected value *by
calling the function under test*, so implementation and expectation drift together and the
property vanishes without a failure. A test whose oracle is the code it tests has no oracle.
A battery only proves the tests fail on the mutants you thought to write. You write mutants
with the same blind spots that shaped the tests.

**Reviewers are wrong specifically and confidently**, and so are you. The verdict that killed
the migration came with four supporting arguments, and two were false. On the enforcement
change described below, two more reviewer claims were false: one from the breadth panel, one
from the second-opinion pass. I checked both against the code, and checking them changed what
shipped.

The most instructive failure in the whole log is mine. I once shipped a judgment call alone,
with a log entry that said a pipeline stage ran with no time bound. I marked the entry
"verified." The process later required a second opinion on exactly that kind of call. Two
models were briefed with the standing instruction: *default to arguing I am wrong.* One
refuted my entry with the code. The stage bounded its own timeout internally, five lines below
the line my entry cited. I read the call site, never the callee, and wrote "verified." The
other model's counterargument was *also* wrong, and I found that only by checking it too. The
log's own post-mortem line is the takeaway: that is the argument for running both, rather
than either.

## One change, five layers, five findings

The capstone came on the change that flipped the tenancy guard from observing to enforcing. A
default-flip like that can take a production box down if any edge is wrong. Every layer ran.
Every layer found something real. No two found the same thing.

The **panel** found the migration was triggerable by hostile input. A failed push can plant a
record that softens the guard for an attacker-chosen name. The **fresh-context second
opinion** found that my box-wide staging fallback was a ratchet that re-arms itself. I wrote
"its worst case equals today's default." That was false. The permissive arm can mint new
instances of its own trigger condition, forever. The **different-family pass at maximum
effort** found two edge cases in the shipped fix. An app authorized to mount another app's volume
was never evaluated when the owner wasn't running. And the bulk remedy read from a
collapsed view that dropped the exact records that disqualify a tree. The **re-verify of the
fixes** found a status report that lied: one arm reported a binding as carried while it
carried nothing. The **mutation battery** found that two of the fixes had no test that fails
when the fix is reverted.

I don't claim that each defect was findable by its layer alone. I claim that none of the other
four layers found it. Trust any single layer as "the review" and real defects ship. Which
defects ship depends on which layer you happened to trust.

## The stack

What runs now, ordered by cost. Each layer is named for the failure class it exists to catch.
I built each piece once: the panel orchestration, the scripted different-model invocation, and
the mutation harness with its own honesty checks. The review script verifies the run header,
so a silent model downgrade can't turn the diverse gate into a same-family review.
Each piece has paid for itself monthly since.

1. **Mechanical enumeration before any review.** Grep out every constructor and call site of
   the thing being changed. Free, and it defines the panel's territory.
2. **Same-family panel, one lens per agent, pointed at territory.** Catches bypasses, missed
   sites, and attack surface.
3. **Different-model pass.** Scripted, artifact inlined, facts as givens, numbered questions,
   briefed to argue you're wrong. Catches wrong premises, wrong framing, and instruments
   wired to the wrong pipe.
4. **Maximum reasoning effort**, reserved for concurrency, security boundaries, and data
   destruction, on a scope cut to fit. Catches races and deep interactions.
5. **Re-verify of the fixes, always.** Fixes to review findings are repeatedly themselves
   insufficient. This layer caught my regressions and, once, a report that lied.
6. **Mutation battery on the tests, with the battery's own claims verified.** Catches vacuous
   tests, including the ones a reviewer just made you write.
7. **Author verification of every load-bearing claim**: reviewer claims, battery survivors,
   your own log. Catches false premises with authority behind them.

Test-only changes take the same review their class demands. The five-weaknesses story above
had no production diff at all, and the first call to skip review on those grounds was itself
overruled. Assertions are load-bearing artifacts. Their weakness is invisible to their author
and to the battery that author configured.

This generalizes past code review, and that is why I care about it. A production agent system
is AI-generated work that never stops being generated, so the review has to run forever. Eval
sets mined from real failures are the mutation battery. Drift checks are the re-verify. A
second model judging live transcripts is the diverse pass. Same discipline, longer clock.
That is the subject of the next essay.

Agreement is cheap. Coverage is bought one mechanism at a time: one more model family, one
more fresh context briefed to disagree, one more artifact class under test, one more claim
checked against the code. Teams that get reliable systems out of AI-generated work will be
able to say, for each layer they run, which failure class it exists to catch. Unanimous
approval isn't
reassurance. It's a reminder of what hasn't been measured yet.

---

*Field report, 2026, from a year-long single-operator project: 400+ logged decisions, 106
review receipts, and every incident above traceable to a numbered entry. The eleven-agent
panel, the bypassed guard, the doc-comment mutant, and the five-layer capstone are all real,
lightly abstracted. Companion piece:
[The Compounding Loop](/essays/the-compounding-loop).*
