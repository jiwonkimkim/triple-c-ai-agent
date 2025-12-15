# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Triple C Marketing Contents Agent** (Contents · Copy · Creative)

AI-powered service that helps individual creators and marketing teams generate, edit, and export product detail pages and promotional creatives. Target: Create professional-level product detail pages within 1 hour → under 10 minutes.

### Core Features
- Detail page auto-generation from product images and text (2 versions per request)
- Brand-consistent copy/visuals via RAG-based brand analysis
- Editor with text/image editing, background removal, prompt-based image generation
- Multi-format export: HTML, images, GIF, MP4 (video via Runway)
- B2C (individual) and B2B (team/workspace) support

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Deployed on Vercel

### Backend
- Next.js API Routes (initial backend)
- REST/JSON API endpoints
- Option to split AI engine to FastAPI/Go later

### AI & External APIs
- **Text generation**: OpenAI / Anthropic
- **Image generation**: nanobanana API
- **Video generation**: Runway API (gen4_turbo, 5 credits/sec)

### Data & Storage
- **Vector DB**: Pinecone or Chroma (RAG)
- **Object Storage**: S3-compatible (images, GIFs, videos, editor JSON)
- **Auth**: JWT-based sessions or NextAuth

## Architecture

### Key Data Models
- `User` - B2C/B2B user with email verification, trial credits
- `Workspace` - B2B team workspace with roles (OWNER, ADMIN, EDITOR, VIEWER)
- `BrandProfile` - Brand identity, tone, keywords, URLs for RAG
- `Project` - Links to workspace and brand profile
- `DetailPageVersion` - Generated page with hook message and sections
- `Template` - System/user templates by category (FASHION, FOOD, BEAUTY, DIGITAL, GENERIC)
- `MotionJob` / `VideoJob` - Async job tracking for GIF/video generation

### API Endpoints Structure
```
/api/auth/*          - signup, login, verify-email
/api/me              - current user
/api/projects/*      - CRUD, draft, history
/api/generate/*      - detail-page generation
/api/brands/:id/*    - ingest-url, upload-doc, chunks
/api/templates/*     - system and user templates
/api/motion-jobs/*   - GIF generation jobs
/api/video-jobs/*    - Runway video jobs
```

### RAG Pipeline
1. Input: Brand profile, website URL, Instagram URL, uploads
2. Crawl → clean text → chunk (500-1000 chars)
3. Embed and store in vector DB (partitioned by brandProfileId)
4. Retrieve top-k chunks at generation time

## Sprint Roadmap

### Sprint 1 - Core
- Account & membership (B2C/B2B onboarding)
- Project & brand profile management
- Detail page auto-generation (basic)
- Hook message & section copy generation
- Basic editor v1 (text, image, auto-save 30s)
- Brand analysis RAG (basic)

### Sprint 2 - Templates & Motion
- Sample templates (3-5 reference templates)
- Motion/GIF generation (zoom-in, fade, slide presets)
- Project history & versioning

### Sprint 3+ - Video & Advanced
- Short ad video generation (5-15 sec via Runway)
- Real-time progress indicator
- Image quality options (draft/HD)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run single test file
npm test -- path/to/test.ts

# Lint
npm run lint
```

## Key Technical Notes

- Copy length options: short / medium / long
- Section types: HERO, FEATURES, SOCIAL_PROOF, HOW_TO_USE, FAQ, CUSTOM
- Motion presets: ZOOM_IN, FADE, SLIDE
- Auto-save interval: 30 seconds
- Performance targets: text gen <10s, bg removal <5s, GIF <20s (async)
