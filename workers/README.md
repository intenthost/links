# Cloudflare Edge Worker & DNS Automation for Links

This setup replaces external Vercel DNS and complex custom pipelines with **native Cloudflare DNS automation, Edge Worker forwarding, and built-in Cloudflare Analytics Engine**.

---

## 1. Cloudflare Environment Variables Required

Add these to your `.env` (or production environment in Vercel/Hosting):

```bash
# Cloudflare API Token (Permissions needed: Zone.DNS (Edit), Workers KV (Edit))
CLOUDFLARE_API_TOKEN="your_cf_api_token"

# Zone ID of your domain (e.g. intenthost.com) in Cloudflare dashboard
CLOUDFLARE_ZONE_ID="your_cf_zone_id"

# Cloudflare Account ID (found on the right sidebar of Cloudflare dashboard)
CLOUDFLARE_ACCOUNT_ID="your_cf_account_id"

# (Optional) Cloudflare KV Namespace ID for sub-millisecond edge link caching
CLOUDFLARE_LINKS_KV_ID="your_kv_namespace_id"
```

---

## 2. Deploying the Cloudflare Forwarder Worker

The worker code is in [`workers/forwarder`](file:///Users/subh/Library/Mobile%20Documents/com~apple~CloudDocs/code/app/new/Links/workers/forwarder).

### Steps to deploy:
```bash
cd workers/forwarder
npm install

# 1. Create the KV namespace for edge links (optional but recommended for speed)
npx wrangler kv:namespace create LINKS_KV

# 2. Put the generated KV ID into wrangler.toml:
# id = "<YOUR_KV_ID>"

# 3. Deploy to Cloudflare
npx wrangler deploy
```

---

## 3. What This Does Automatically:

1. **Instant Automated DNS Provisioning**:
   - When a domain or subdomain (e.g. `go.intenthost.com` or `promo.yourdomain.com`) is added in your Links dashboard, the system invokes `addDomainToCloudflareDns(...)` via Cloudflare API.
   - It creates a proxied (`proxied: true`) CNAME record.
   - Cloudflare provisions the SSL certificate automatically. Zero manual DNS copying or verification delays.

2. **Native Cloudflare Metrics**:
   - The Cloudflare Worker logs every click, country, city, referrer, and user-agent into **Cloudflare Workers Analytics Engine** (`LINK_METRICS`).
   - Queryable via Cloudflare GraphQL or the Cloudflare dashboard without needing external services like Tinybird or separate log collectors.

3. **Sub-Millisecond Global Redirects**:
   - Edge Worker executes `302` redirects directly at the nearest Cloudflare data center.
