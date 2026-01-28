# TRD – Triple C Marketing Contents Agent (EN)

## 1. Technical Overview

### 1.1 System Architecture

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS, shadcn/ui for UI components
- Deployed on Vercel

**Backend**
- Next.js API Routes as the initial backend
- Option to split AI engine to a separate service later (e.g., FastAPI/Go)
- REST/JSON API endpoints

**AI Engine**
- Text generation: OpenAI / Anthropic models
- Image generation: nanobanana API
- Video generation: Runway API (Model: gen4_turbo, 5 credits/sec)
- Prompt engineering layer and model selection logic

**Data & RAG**
- Vector DB (e.g., Pinecone / Chroma)
- Retriever algorithms:
  - Initial: cosine similarity
  - Later: MMR / hybrid search
- Brand documents, crawled web/Instagram content, and uploaded materials

**Storage**
- Object storage (e.g., S3-compatible)
  - Product images
  - Generated images
  - GIFs and MP4 videos
  - Template and editor JSON

**Auth & Account**
- JWT-based sessions or NextAuth-based auth
- User roles and workspace structure for B2B

---

## 2. Implementation Plan by Sprint

### 2.1 Sprint 1 – Core Auth, Project, Basic AI Generation

#### 2.1.1 Auth & User Management

**Responsibilities**
- 🙋‍♂️ User: Sign up, log in, manage profile.
- 🛠️ Platform: Authenticate and authorize requests.

**Technical Specifications**
- Supported login methods:
  - Email/password
  - OAuth (Google, etc.)
- Email verification using signed tokens.
- Free trial credits stored as numeric field on user record.

**Example Data Model (TypeScript)**

```ts
type UserType = 'B2C' | 'B2B';

interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name?: string;
  nickname?: string;
  industry?: string;
  userType: UserType;
  emailVerified: boolean;
  trialCredits: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**B2B Company & Workspace**

```ts
interface CompanyInfo {
  id: string;
  name: string;
  domain: string; // example: company.com
  businessNumber?: string;
  size?: 'SMB' | 'Mid' | 'Enterprise';
  industry?: string;
  monthlyContentVolume?: number;
  createdAt: Date;
}

type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

interface Workspace {
  id: string;
  companyId: string | null; // null for B2C personal workspace if needed
  name: string;
  ownerId: string;
  members: {
    userId: string;
    role: Role;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

APIs
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `GET /api/me`

---

#### 2.1.2 Projects & Brand Profiles

**Responsibilities**
- 🙋‍♂️ User: Create projects and define brand profiles.
- 🛠️ Platform: Persist and serve project/brand data.

**Data Models**

```ts
interface BrandProfile {
  id: string;
  workspaceId: string | null;
  name: string;          // Brand name
  identity: string;      // Brand identity/positioning
  toneAndManner: string; // Tone & style description
  imageKeywords: string[];
  websiteUrl?: string;
  instagramUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  ownerId: string;
  workspaceId?: string | null;
  brandProfileId?: string | null;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}
```

APIs
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

---

#### 2.1.3 Detail Page Generation API (🤖)

**Responsibilities**
- 🙋‍♂️ User: Provide input and choose a version.
- 🤖 AI: Generate 2 versions of the page.
- 🛠️ Platform: Orchestrate calls, store results.

**API Design**

- `POST /api/generate/detail-page`
  - Request body:
    - `projectId: string`
    - `productImages: string[]` (already uploaded URLs)
    - `productName: string`
    - `category: string`
    - `keyFeatures: string[]`
    - `targetAudience: string`
    - `copyLength: 'short' | 'medium' | 'long'`
  - Response body:
    - `versions: DetailPageVersion[]` (2 items)

```ts
type SectionType =
  | 'HERO'
  | 'FEATURES'
  | 'SOCIAL_PROOF'
  | 'HOW_TO_USE'
  | 'FAQ'
  | 'CUSTOM';

interface DetailPageSection {
  id: string;
  type: SectionType;
  title?: string;
  body: string;
  order: number;
}

interface DetailPageVersion {
  id: string;
  projectId: string;
  hookMessage: string;
  sections: DetailPageSection[];
  createdAt: Date;
}
```

**AI Integration**
- Prompt builder gathers:
  - Product information
  - Brand RAG snippets (if available)
  - Template definition
  - Copy length
- OpenAI/Anthropic API returns JSON or text to be parsed into `DetailPageVersion` structure.

---

#### 2.1.4 Editor & Auto-Save

**Responsibilities**
- 🙋‍♂️ User: Modify text & layout.
- 🛠️ Platform: Store editor drafts.
- 🤖 AI: Optional image modification.

**Technical Specifications**
- React-based block editor with components for:
  - Text blocks
  - Image blocks
  - Section containers
- Auto-save interval: 30 seconds when there are unsaved changes.

```ts
interface EditorDraft {
  id: string;
  projectId: string;
  userId: string;
  contentJson: any; // full editor JSON structure
  updatedAt: Date;
}
```

APIs
- `PUT /api/projects/:id/draft` (save)
- `GET /api/projects/:id/draft` (load)

---

#### 2.1.5 Brand RAG Pipeline

**Responsibilities**
- 🙋‍♂️ User: Provide URLs and upload assets.
- 🤖 AI/Bot: Crawl, embed, and retrieve.
- 🛠️ Platform: Manage vector DB and metadata.

**Pipeline Steps**
1. **Input collection**
   - Brand profile, website URL, Instagram URL, uploads.
2. **Data ingestion**
   - Website crawl → HTML → cleaned text.
   - Split into chunks (e.g., 500–1000 characters).
3. **Vectorization**
   - Use embedding model to generate vectors.
   - Store in vector DB partitioned by `brandProfileId`.
4. **Retrieval**
   - At generation time: retrieve top-k chunks per query.
   - Use as additional context in AI prompts.

**Brand Document Chunk Model**

```ts
interface BrandDocumentChunk {
  id: string;
  brandProfileId: string;
  source: 'WEBSITE' | 'INSTAGRAM' | 'UPLOAD';
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
```

APIs
- `POST /api/brands/:id/ingest-url`
- `POST /api/brands/:id/upload-doc`
- `GET /api/brands/:id/chunks`

---

### 2.2 Sprint 2 – Templates, Motion/GIF, History

#### 2.2.1 Template System

**Responsibilities**
- 🙋‍♂️ User: Select or create templates.
- 🛠️ Platform: Maintain template definitions.

**Data Model**

```ts
type TemplateCategory =
  | 'GENERIC'
  | 'FASHION'
  | 'FOOD'
  | 'BEAUTY'
  | 'DIGITAL';

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl?: string;
  sections: DetailPageSection[];
  isReference: boolean;   // true for system reference templates
  createdBy: 'SYSTEM' | 'USER';
  createdAt: Date;
}
```

APIs
- `GET /api/templates`
- `GET /api/templates/:id`
- `POST /api/templates` (user templates)
- `DELETE /api/templates/:id`

---

#### 2.2.2 Motion/GIF Generation

**Responsibilities**
- 🙋‍♂️ User: Select image and motion preset.
- 🤖 AI/Bot or media engine: Apply effect and encode outputs.
- 🛠️ Platform: Queue jobs and return results.

**Job Model**

```ts
type MotionPreset = 'ZOOM_IN' | 'FADE' | 'SLIDE';

interface MotionJob {
  id: string;
  projectId: string;
  imageUrl: string;
  preset: MotionPreset;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultGifUrl?: string;
  resultMp4Url?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

APIs
- `POST /api/motion-jobs`
- `GET /api/motion-jobs/:id`

**Infrastructure**
- Queue system (e.g., Redis, Vercel Queue)
- Worker process to run image → motion → GIF/MP4 tasks.

---

#### 2.2.3 Project History & Versioning

**Responsibilities**
- 🙋‍♂️ User: Review and restore old versions.
- 🛠️ Platform: Store and retrieve versions.

**Data Model**

```ts
interface ProjectHistory {
  id: string;
  projectId: string;
  versionLabel: string; // e.g., 'v1', 'v2'
  detailPageVersion: DetailPageVersion;
  createdAt: Date;
  createdBy: string; // userId or 'SYSTEM'
}
```

APIs
- `GET /api/projects/:id/history`
- `POST /api/projects/:id/history`

---

### 2.3 Sprint 3+ – Video, Quality, Progress

#### 2.3.1 Ad Video Generation (Runway API)

**Responsibilities**
- 🙋‍♂️ User: Opt in, provide video prompt and references.
- 🤖 AI/Bot: Call Runway API and track job status.
- 🛠️ Platform: Manage credits and storage.

**Job Model**

```ts
interface VideoJob {
  id: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  prompt: string;
  referenceImageUrls?: string[];
  resultVideoUrl?: string;
  costCredits?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

APIs
- `POST /api/video-jobs`
- `GET /api/video-jobs/:id`

---

#### 2.3.2 Generation Progress Indicator

**Approach**
- Polling: frontend polls job status endpoints.
- Optional later: WebSockets or Server-Sent Events.

UI shows:
- Pending
- Processing (% estimate based on job stage)
- Completed / Failed

---

#### 2.3.3 Image Quality Modes

**Implementation**
- Add `quality: 'draft' | 'hd'` to image generation requests.
- Map to different model parameters or endpoints (e.g., resolution, steps).
- Track cost per mode for future billing.

---

## 3. Responsibility Breakdown

### 🙋‍♂️ User
- Account sign-up, login, profile setup
- Creating projects and brand profiles
- Inputting product information
- Selecting templates, motion presets, quality modes
- Editing generated content and confirming final outputs
- Managing history and versions

### 🤖 AI/Bot
- Generating 2 versions of detail pages
- Creating hook messages and section copy
- Performing brand RAG retrieval and summarization
- Background removal and prompt-based image generation
- GIF and video generation via motion and Runway APIs

### 🛠️ Platform
- Authentication, authorization, and workspace management
- CRUD for users, workspaces, projects, templates, history
- File upload handling and storage
- Job queue and state management
- Auto-save and draft management
- Future billing/credit logging

---

## 4. Technical Dependencies

- **External APIs**
  - nanobanana (image)
  - Runway (video)
  - OpenAI / Anthropic (text)
- **Infrastructure**
  - Vector DB service (Pinecone/Chroma)
  - Email provider (e.g., SendGrid)
  - OAuth providers (Google, etc.)

**Feature Dependencies Example**
- Video generation (Sprint 3+) depends on:
  - Image generation (Sprint 1/2)
  - Copy generation (Sprint 1)
- Template system (Sprint 2) depends on:
  - Detail page data model (Sprint 1)
- Brand RAG (Sprint 1) enhances all later AI features.

---

## 5. Infrastructure Requirements

- **Hosting**
  - Vercel for frontend and initial backend
  - Optional additional backend container hosting (Fly.io, Railway, etc.)

- **Storage**
  - S3-compatible object storage for assets

- **Queue / Workers**
  - Redis, Vercel Queue, or equivalent for long-running tasks

- **Monitoring & Logging**
  - Centralized logs (e.g., Logtail, Datadog)
  - Error tracking (e.g., Sentry)

---

## 6. Security & Performance Considerations

- Enforce HTTPS on all endpoints.
- Use secure password hashing (bcrypt/Argon2).
- Store AI API keys only in server-side environment variables.
- Implement rate limiting to prevent abuse of generation APIs.
- Basic file scanning for uploaded assets (if feasible).
- Performance targets (initial):
  - Text generation: under 5–10 seconds for a draft.
  - Image background removal: under 3–5 seconds.
  - GIF generation: under 10–20 seconds (asynchronous).

---

## 7. Testing Strategy

- **Unit Tests**
  - Auth handlers, project/brand CRUD, template utilities, RAG utilities.

- **Integration Tests**
  - `/api/generate/detail-page` end-to-end (with mocked AI).
  - RAG ingestion and retrieval.

- **E2E Tests**
  - Full flow: sign-up → create project → generate draft → edit → save → export.

- **Load & Stress Tests**
  - Multiple concurrent generation requests.
  - High volume of motion/video jobs.

- **Monitoring**
  - Track error rate, latency, and job failure rate using dashboards.
