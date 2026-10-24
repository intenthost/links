#!/usr/bin/env python3
"""
Deployment script for Intent Host Links (GitHub repository).
Author: Subh Mondal <git@subhmondal.com>
Repository: git@github.com:intenthost/links.git
"""

import os
import subprocess
import sys

GIT_AUTHOR_NAME = "Subh Mondal"
GIT_AUTHOR_EMAIL = "git@subhmondal.com"
REMOTE_REPO = "git@github.com:intenthost/links.git"
DEFAULT_BRANCH = "main"

def run_command(cmd, cwd=None, check=True):
    print(f"==> {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print(res.stderr.strip(), file=sys.stderr)
    if check and res.returncode != 0:
        sys.exit(res.returncode)
    return res

def main():
    commit_msg = sys.argv[1] if len(sys.argv) > 1 else "feat: streamline internal links app for Intent Host"
    workspace_root = os.path.dirname(os.path.abspath(__file__))

    print("=" * 60)
    print("🚀 Intent Host Links — GitHub Deploy Script")
    print(f"Author: {GIT_AUTHOR_NAME} <{GIT_AUTHOR_EMAIL}>")
    print(f"Commit: {commit_msg}")
    print("=" * 60)

    # Configure git author locally for this repository
    run_command(f'git config user.name "{GIT_AUTHOR_NAME}"', cwd=workspace_root)
    run_command(f'git config user.email "{GIT_AUTHOR_EMAIL}"', cwd=workspace_root)

    # Stage all changes
    print("\n📦 Staging changes...")
    run_command("git add -A", cwd=workspace_root)

    # Check status
    status = run_command("git status --porcelain", cwd=workspace_root, check=False)
    if not status.stdout.strip():
        print("✨ Working directory is clean, nothing to commit.")
    else:
        # Commit
        print("\n💾 Committing changes...")
        run_command(f'git commit -m "{commit_msg}"', cwd=workspace_root)

    # Push to origin main
    print(f"\n⬆️ Pushing to {REMOTE_REPO} ({DEFAULT_BRANCH})...")
    run_command(f"git push origin {DEFAULT_BRANCH}", cwd=workspace_root)

    print("\n✅ Successfully deployed to GitHub!")

if __name__ == "__main__":
    main()
