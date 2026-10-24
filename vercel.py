#!/usr/bin/env python3
"""
Vercel Deployment and Management Script for Intent Host Links.
Project: links (prj_xkmyfTavl8GHVdK4HBUIrnLOS2sZ)
Team: team_eSfmthul2SzPr6Mx8aF4ADLF
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

def load_env_val(key):
    val = os.environ.get(key)
    if val:
        return val
    workspace_root = os.path.dirname(os.path.abspath(__file__))
    for fname in [".env.local", ".env"]:
        p = os.path.join(workspace_root, fname)
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith(f"{key}="):
                            return line.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return None

# Configuration (read from environment or .env.local without hardcoding secrets)
AUTH_TOKEN = load_env_val("CLOUD_API_TOKEN") or load_env_val("VERCEL_API_TOKEN") or load_env_val("VERCEL_TOKEN")
TEAM_ID = load_env_val("TEAM_ID") or "team_eSfmthul2SzPr6Mx8aF4ADLF"
PROJECT_ID = "prj_xkmyfTavl8GHVdK4HBUIrnLOS2sZ"
PROJECT_NAME = "links"
BASE_URL = "https://api.vercel.com"

def api_request(endpoint, method="GET", data=None):
    separator = "&" if "?" in endpoint else "?"
    url = f"{BASE_URL}{endpoint}{separator}teamId={TEAM_ID}"
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            return json.loads(err_msg)
        except Exception:
            return {"error": {"message": err_msg, "code": e.code}}
    except Exception as e:
        return {"error": {"message": str(e)}}

def get_project_status():
    print(f"🔍 Fetching project details for {PROJECT_NAME} ({PROJECT_ID})...")
    res = api_request(f"/v9/projects/{PROJECT_ID}")
    if "error" in res:
        print(f"❌ Error fetching project: {res['error']}")
        return

    print("\n" + "=" * 60)
    print(f"📦 Project: {res.get('name')}")
    print(f"🆔 Project ID: {res.get('id')}")
    print(f"🏢 Framework: {res.get('framework')}")
    print(f"📅 Created: {res.get('createdAt')}")
    print(f"🌐 Node Version: {res.get('nodeVersion')}")

    # Fetch latest deployments
    dep_res = api_request(f"/v6/deployments?projectId={PROJECT_ID}&limit=5")
    deployments = dep_res.get("deployments", [])
    print(f"\n🚀 Recent Deployments ({len(deployments)}):")
    for d in deployments:
        state = d.get("state")
        url = d.get("url")
        created = d.get("createdAt")
        target = d.get("target") or "preview"
        print(f"  • [{state.upper()}] {url} ({target}) - {created}")
    print("=" * 60)

def deploy_project():
    print(f"🚀 Triggering deployment for {PROJECT_NAME}...")
    workspace_root = os.path.dirname(os.path.abspath(__file__))

    # Check if vercel CLI is installed
    cli_check = subprocess.run(["which", "vercel"], capture_output=True, text=True)
    if cli_check.returncode == 0:
        print("⚡ Using Vercel CLI with Team and Token...")
        cmd = [
            "vercel",
            "--prod",
            "--token",
            AUTH_TOKEN,
            "--scope",
            TEAM_ID,
            "--yes",
        ]
        res = subprocess.run(cmd, cwd=workspace_root)
        if res.returncode == 0:
            print("\n✅ Vercel production deployment succeeded!")
        else:
            print(f"\n❌ Vercel CLI exited with code {res.returncode}")
        return

    # Fallback to API deployment trigger
    print("⚡ Triggering deployment via Vercel REST API...")
    res = api_request(
        f"/v13/deployments",
        method="POST",
        data={
            "name": PROJECT_NAME,
            "project": PROJECT_ID,
            "target": "production",
            "gitSource": {
                "type": "github",
                "repo": "intenthost/links",
                "ref": "main",
            },
        },
    )

    if "error" in res:
        print(f"❌ Deployment API returned error: {res['error']}")
    else:
        print(f"✅ Deployment triggered successfully!")
        print(f"  URL: https://{res.get('url')}")
        print(f"  ID: {res.get('id')}")
        print(f"  Status: {res.get('readyState', res.get('status'))}")

def sync_env():
    workspace_root = os.path.dirname(os.path.abspath(__file__))
    env_file = os.path.join(workspace_root, ".env")
    if not os.path.exists(env_file):
        print("❌ .env file not found.")
        return

    print("🔄 Reading .env file...")
    local_vars = {}
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                local_vars[k.strip()] = v.strip().strip('"').strip("'")

    print(f"📋 Found {len(local_vars)} local environment variables.")
    existing_res = api_request(f"/v9/projects/{PROJECT_ID}/env")
    existing_envs = {e["key"]: e for e in existing_res.get("envs", [])}

    for key, value in local_vars.items():
        if not value:
            continue
        if key in existing_envs:
            env_id = existing_envs[key]["id"]
            print(f"  ✏️ Updating {key}...")
            api_request(
                f"/v9/projects/{PROJECT_ID}/env/{env_id}",
                method="PATCH",
                data={"value": value, "target": ["production", "preview", "development"]},
            )
        else:
            print(f"  ➕ Creating {key}...")
            api_request(
                f"/v10/projects/{PROJECT_ID}/env",
                method="POST",
                data={
                    "key": key,
                    "value": value,
                    "type": "encrypted",
                    "target": ["production", "preview", "development"],
                },
            )

    print("✅ Environment variables synchronized with Vercel!")

def pull_env():
    print(f"📥 Pulling environment variables from Vercel project {PROJECT_NAME}...")
    res = api_request(f"/v9/projects/{PROJECT_ID}/env")
    if "error" in res:
        print(f"❌ Error: {res['error']}")
        return

    envs = res.get("envs", [])
    print(f"📋 Retrieved {len(envs)} environment variables:")
    for e in envs:
        targets = ",".join(e.get("target", []))
        print(f"  • {e.get('key')} [{targets}]")

def main():
    parser = argparse.ArgumentParser(description="Intent Host Links Vercel Deploy & Management Tool")
    parser.add_argument("--status", action="store_true", help="Check project status and recent deployments")
    parser.add_argument("--deploy", action="store_true", help="Deploy production build to Vercel")
    parser.add_argument("--sync", action="store_true", help="Sync local .env to Vercel")
    parser.add_argument("--pull", action="store_true", help="Pull environment list from Vercel")

    args = parser.parse_args()

    if args.status:
        get_project_status()
    elif args.sync:
        sync_env()
    elif args.pull:
        pull_env()
    elif args.deploy:
        deploy_project()
    else:
        # Default: show status and deploy
        get_project_status()
        deploy_project()

if __name__ == "__main__":
    main()
