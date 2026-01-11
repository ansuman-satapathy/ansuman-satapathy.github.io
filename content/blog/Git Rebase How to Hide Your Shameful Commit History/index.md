---
title: "Git Rebase: How to Hide Your Shameful Commit History"
date: 2026-01-11T22:12:03+05:30
draft: false
toc: false
categories: [Git, DevOps]
tags: [git, rebase]
series: [Git]
---

Let’s be real for a second. Your actual development process involves roughly 45 commits named "wip", "fixing typo", "minor fix", "ffs why isn't this working", and finally, "this time it works i think."

Now, I can't be the only one who has nightmares about juniors laughing at my commit history? Right? ...Right? You never want this to happen. You want to look like a disciplined, experienced engineer who writes perfect code in a single, surgical commit.

Your savior is here: **Git Rebase**.

It’s the tool that lets you effectively gaslight your colleagues into thinking you got it right the first time. Let's learn how to rewrite history without deleting your entire repo by accident.

## The "Base" in "Rebase"

To understand Rebasing, you first need to understand what a **Base** actually is.

When you create a new branch from `main`, the specific commit you start from becomes your **Base**. It is the foundation of your work. While you are busy coding your feature, `main` keeps moving forward because your teammates are also busy breaking things. Suddenly, your foundation is out of date.

You have two options to fix this:

1. **The Merge**
2. **The Rebase**

## Path 1: Git Merge

Most developers do this without realizing it. When you run `git pull origin main`, Git is actually running a `fetch` followed by a `merge`.

**The Commands:**

```bash
git checkout my-feature
git pull origin main

```

_Alternatively, if you already fetched:_ `git merge main`

**What happens under the hood:**
Git looks for the common ancestor. It takes all the new work on `main` and all your work on `feature` and ties them together with a brand new **Merge Commit**, usually titled: `Merge branch 'main' into my-feature`.

**The Result:**
You get a "diamond" shape. The history is split, then forced back together. It’s a permanent scar that says, "I was out of sync here."

```text
          A --- B --- C  (my-feature)
         /             \
--- D --- E --- F --- G --- H (main)
                            ^
                      Merge Commit (The Join)

```

## Path 2: Git Rebase

Instead of joining the branches, you are moving the starting point of your work to the tip of the current `main`. You are essentially "teleporting" your commits so they sit on top of the latest changes.

**The Commands:**

```bash
git checkout my-feature
git pull --rebase origin main

```

_Alternatively, if you already fetched:_ `git rebase main`

**What happens under the hood:**

1. Git temporarily "pops" your commits (A, B, C) and puts them in storage.
2. It brings in the new commits from `main` (F, G), updating your base.
3. It **re-applies** your commits one by one on top of the new base (G).

### Warning !!!

Because Rebase reapplies commits one by one, you might hit conflicts. If you have 10 commits that touch the same file, Git will pause and ask you to fix the conflict for **every single commit**.
You’ll be sitting there, resolving the same merge conflict for the 4th time in ten minutes, pretending your mental health is intact while your terminal screams at you.

<img src="this-is-fine.jpg" alt="This is fine" style="width: 100%; height: auto; border-radius: 8px;">

**The Result:**
A perfectly linear history. Since your commits are re-played, they get new IDs (hashes), shown as A', B', and C'.

```text
Before Rebase:
      A---B---C (my-feature)
     /
D---E---F---G (main)

After Rebase:
                  A'--B'--C' (my-feature)
                 /
D---E---F---G (main)

```

## When to use which?

If Rebase is so clean, why do we still have Merge? Because they serve different masters.

| Situation                      | Use This            | Why?                                                                         |
| ------------------------------ | ------------------- | ---------------------------------------------------------------------------- |
| **Updating local branch**      | `git pull --rebase` | Maintains a linear history and eliminates "Merge branch..." clutter.         |
| **Merging a PR into Main**     | `git merge`         | Provides a permanent record that a feature was officially added.             |
| **Working on a shared branch** | `git merge`         | **NEVER rebase a shared branch.** You will break everyone else's local repo. |

### Pro-Tip

To stop typing `--rebase` every ten minutes, set it as your global default:

```bash
git config --global pull.rebase true

```

## Concluding

Although it is important to understand rebase, don't think that it is a sin to use merge. A linear history makes maintaining huge projects easier because you can pinpoint the exact change that caused a bug using `git bisect`.

But if your team is small or you are working alone, it's fine to use merge. Don't overthink it. The goal is to build reliable systems, not to have the world's most aesthetic Git graph. Use the tool that makes the most sense for your workflow.
