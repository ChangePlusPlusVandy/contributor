# Git & GitHub Workflow Guide

A simple guide for version control and collaboration on The Contributor project.

## Table of Contents

- [Working on Your Branch](#working-on-your-branch)
- [Syncing Your Branch with Main](#syncing-your-branch-with-main)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Resolving Merge Conflicts](#resolving-merge-conflicts)
- [Common Git Commands](#common-git-commands)

---

## Working on Your Branch

Always create a new branch for your work. Never commit directly to `main`.

### Create a New Branch

```bash
# Create and switch to a new branch (give it a related name)
git checkout -b your-name/your-feature

# Examples:
# git checkout -b shashi/user-authentication
# git checkout -b alice/fix-login-bug
```

### Make Changes and Commit

After making your changes:

```bash
# Check what files changed
git status

# Stage your changes
git add .

# Or stage specific files
git add path/to/file.py

# Commit with a clear message
git commit -m "Add: brief description of what you did"

# Push your branch to GitHub
git push origin your-name/your-feature
```

### Commit Message Format

Use clear, descriptive commit messages:

```bash
git commit -m "Add: user login endpoint to FastAPI"
git commit -m "Fix: button alignment on home screen"
git commit -m "Update: MongoDB connection logic"
git commit -m "Remove: unused imports from auth module"
```

---

## Syncing Your Branch with Main

Before submitting a PR or when working on a long-running feature, sync your branch with the latest changes from `main`.

### Method 1: Rebase (Recommended)

Rebase keeps your commit history clean:

```bash
# Make sure all your changes are committed
git status

# Switch to main and update it
git checkout main
git pull origin main

# Switch back to your branch
git checkout your-name/your-feature

# Rebase your branch on top of main
git rebase main

# If there are no conflicts, push your updated branch
git push origin your-name/your-feature --force-with-lease
```

### Method 2: Merge

Merge creates a merge commit:

```bash
# Make sure all your changes are committed
git status

# Update main
git checkout main
git pull origin main

# Go back to your branch
git checkout your-name/your-feature

# Merge main into your branch
git merge main

# Push your updated branch
git push origin your-name/your-feature
```

### Quick Sync Without Switching Branches

```bash
# While on your feature branch
git fetch origin main
git merge origin/main

# Or with rebase
git fetch origin main
git rebase origin/main
```

---

## Submitting a Pull Request

### Steps to Create a PR

1. Push your branch to GitHub:
   ```bash
   git push origin your-name/your-feature
   ```

2. Go to the repository on GitHub

3. Click "Pull requests" then "New pull request"

4. Select your branch to merge into `main`

5. Fill out the PR template with:
   - **What you changed**: List of features/fixes
   - **Why you changed it**: Problem you solved
   - **How to test it**: Steps to verify your changes work

6. Click "Create pull request"

### PR Guidelines

**You can author and merge your own PRs for:**
- Regular features and improvements
- Bug fixes
- Documentation updates
- Minor refactoring

**Contact the project lead or mentors before merging if:**
- The change affects core functionality (authentication, database, API routes)
- You encounter a breaking merge conflict
- You're unsure about the impact
- The change affects multiple team members' work

---

## Resolving Merge Conflicts

### When Do Conflicts Happen?

Conflicts occur when:
- You and someone else edited the same lines in the same file
- Your branch is behind main and changes overlap

### How to Resolve Conflicts

#### Step 1: Fetch Latest Changes

```bash
# Make sure you're on your branch
git checkout your-name/your-feature

# Update main
git checkout main
git pull origin main

# Go back to your branch
git checkout your-name/your-feature

# Merge main into your branch
git merge main
```

#### Step 2: Identify Conflicts

Git will tell you which files have conflicts:

```
Auto-merging backend/main.py
CONFLICT (content): Merge conflict in backend/main.py
Automatic merge failed; fix conflicts and then commit the result.
```

#### Step 3: Open Conflicted Files

Look for conflict markers in the file:

```python
<<<<<<< HEAD
# Your changes
def login_user(email: str):
    return authenticate(email)
=======
# Changes from main
def login_user(email: str, password: str):
    return authenticate(email, password)
>>>>>>> main
```

#### Step 4: Resolve the Conflict

Edit the file to keep the correct code and remove the markers:

```python
# Resolved version
def login_user(email: str, password: str):
    return authenticate(email, password)
```

#### Step 5: Complete the Merge

```bash
# Stage the resolved files
git add backend/main.py

# Or stage all resolved files
git add .

# Complete the merge
git commit -m "Resolve merge conflicts with main"

# Push the updated branch
git push origin your-name/your-feature
```

### If Conflicts Are Breaking

**If the merge conflict is breaking the application or you're not sure how to resolve it:**

1. **Stop immediately** - Don't force push or continue
2. **Save your work**:
   ```bash
   git merge --abort  # Cancel the merge
   ```
3. **Create a backup**:
   ```bash
   git branch backup/your-name/your-feature
   ```
4. **Contact mentors** with:
   - What you were trying to do
   - Which files have conflicts
   - What you already tried

---

## Common Git Commands

### Checking Status

```bash
# See what files changed
git status

# See what branches exist
git branch

# See commit history
git log --oneline

# See what changed in a file
git diff path/to/file.py
```

### Switching Branches

```bash
# Switch to an existing branch
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# Switch to main
git checkout main
```

### Undoing Changes

```bash
# Discard changes in a file (before staging)
git checkout -- path/to/file.py

# Unstage a file (after git add)
git reset HEAD path/to/file.py

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Undo last commit (discards changes)
git reset --hard HEAD~1
```

### Updating Your Local Repository

```bash
# Get latest changes from GitHub
git fetch origin

# Update your current branch
git pull origin your-branch-name

# Update main branch
git checkout main
git pull origin main
```

### Cleaning Up

```bash
# Delete a local branch
git branch -d branch-name

# Delete a remote branch
git push origin --delete branch-name

# Remove untracked files
git clean -fd
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Create branch | `git checkout -b your-name/feature` |
| Check status | `git status` |
| Stage changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin branch-name` |
| Update main | `git checkout main && git pull origin main` |
| Sync with main | `git merge main` or `git rebase main` |
| Abort merge | `git merge --abort` |
| View branches | `git branch` |
| Switch branch | `git checkout branch-name` |

---

## Best Practices

1. **Commit often** - Small, frequent commits are better than large ones
2. **Write clear messages** - Future you will thank you
3. **Pull before you push** - Always sync with main before pushing
4. **Test before committing** - Make sure your code works
5. **One feature per branch** - Keep branches focused
6. **Delete merged branches** - Keep your workspace clean
7. **Ask for help** - Better to ask than to break something

---

## Getting Help

If you're stuck:
1. Check this guide first
2. Search the issue on Google or Stack Overflow
3. Ask in the project chat/Slack
4. Contact project mentors



