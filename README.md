<div align="center">

# Intent Host Links

**High-performance URL shortening, custom domain routing, and real-time link analytics infrastructure for Intent Host.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![IntentDB](https://img.shields.io/badge/Database-IntentDB-0066FF?style=for-the-badge)](https://intenthost.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)

</div>

---

## ⚡ Overview

**Intent Host Links** is the dedicated link infrastructure engine designed and maintained for **Intent Host**. It delivers ultra-low-latency short link redirects, custom branded domain mapping, detailed traffic telemetry, and QR code generation without third-party SaaS rate limits or feature locks.

---

## ✨ Features

- 🔗 **Lightning-Fast Link Shortening**: Instant short URL generation with custom slugs, password gates, and optional expiration dates.
- 🌐 **Custom Branded Domains**: Connect and verify custom domains with automatic DNS status checks and edge-speed routing.
- 📊 **Real-Time Click Telemetry**: Live click counts, geographic insights (countries, cities, continents), device breakdowns, browsers, operating systems, and referrer tracking powered by Tinybird and IntentDB.
- 📱 **QR Code Engine**: Built-in dynamic and downloadable QR code generation for every managed link.
- 🏷️ **Tagging & UTM Builder**: Organize links with multi-tagging and streamlined UTM parameter templates.
- ⚡ **Streamlined Internal Workflow**: Dedicated single-organization authentication with Better Auth — zero public registrations, no tiers, no paywalls, and unlimited capacity.
- 🎨 **Modern Design System**: Clean typography, dark mode support, and icons powered by **Hugeicons**.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: [TypeScript 5](https://www.typescriptlang.org)
- **Database**: [IntentDB](https://intenthost.com) (Serverless PostgreSQL over HTTPS gateway)
- **ORM / Client**: [Prisma](https://www.prisma.io) with IntentDB adapter
- **Telemetry & Cache**: Tinybird & Upstash Redis
- **Icons**: Hugeicons Core & React
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS & Radix UI primitives

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- IntentDB connection string

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:intenthost/links.git
cd links
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env.local
```

Key environment variables:

```ini
# Database (IntentDB)
DATABASE_URL="https://KEY@linksdb.intenthost.com/intent_host"

# Authentication
BETTER_AUTH_SECRET="your-secure-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Telemetry & Redis (Optional / Production)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
TINYBIRD_API_KEY=""
```

### 3. Generate Database Client

```bash
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build

```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```text
├── prisma/               # Database schema definition
├── public/               # Static assets & brand icons
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   │   ├── (root)/       # Public redirect & entry routing
│   │   ├── api/          # Internal and v1 API endpoints
│   │   ├── app/          # Dashboard & workspace app interface
│   │   └── custom-domain/# Custom domain verification & parked pages
│   ├── components/       # UI components & Hugeicons integration
│   ├── constants/        # Navigation, configuration, and app constants
│   ├── lib/              # Shared utilities, auth client, & telemetry
│   └── server/           # Database clients, actions, and IntentDB adapter
└── vercel.json           # Vercel deployment & region configuration (sin1)
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
