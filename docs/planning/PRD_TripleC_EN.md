# PRD – Triple C Marketing Contents Agent (EN)

## 1. Overview

**Product Name**: Triple C Marketing Contents Agent (Contents · Copy · Creative)  
**Vision**: “A world where anyone can create a professional-level product detail page within 1 hour.”

Triple C is an AI-powered one-tool service that helps individual creators and marketing teams generate, edit, and export product detail pages and promotional creatives. The product focuses on:

- Fast creation of product detail pages from images and short text
- Brand-consistent copy and visuals powered by RAG-based brand analysis
- An editor that supports text and visual fine-tuning
- Multi-format export: HTML, images, GIFs, and later videos
- B2C (individual) and B2B (team/workspace) usage

### Priority Notation (from requirements)

- 💉 **Painkiller**: Must-have features
  - 1️⃣: Sprint 1 (week 1)
  - 2️⃣: Sprint 2 (week 2)
  - 3️⃣: Sprint 3+ (later)
- 💊 **Vitamin**: Nice-to-have
- 🗃 **Backlog**: Future consideration
- Responsibility:
  - 🙋‍♂️ **User** – End-user actions
  - 🤖 **AI/Bot** – AI-driven logic
  - 🛠️ **Platform** – Core product/Onetool logic

---

## 2. Must-Have Features (💉 Painkiller)

### 2.1 Sprint 1 (💉1️⃣) – Core Account, Project, AI Draft

#### 2.1.1 Account & Membership System (B2C / B2B)

**Description**  
Implement the core membership system for individual and company users.

**Scope** (🛠️ Platform)
- **B2C onboarding**
  - Email sign-up
  - Social login (e.g., Google; exact providers can be chosen later)
  - Email verification
  - Basic profile setup (nickname, industry/role)
  - Automatic free trial credit (e.g., 3 detail-page generations)
  - Personal dashboard landing

- **B2B onboarding**
  - Company email sign-up (domain validation)
  - Business registration number input (simple text validation)
  - Contact person information (name, position, phone/email)
  - Company information (size, industry, monthly content volume)
  - Team workspace creation
  - Member invitation via email

**User Stories**
1. As an individual user, I want to sign up quickly with email or social login, set a basic profile, and start a free trial immediately.
2. As a marketing manager, I want to create a company workspace using my corporate email domain and invite my team members to collaborate.

**Acceptance Criteria**
- Email and social sign-up, login, and logout work as expected.
- Email verification is required before accessing main generation features.
- For B2B, only company domains pass the corporate sign-up flow.
- A workspace is automatically created for the first company user, with “Owner” role.
- Member invitations send an email with a join link.
- Free trial credits are visible in the user dashboard.

---

#### 2.1.2 Project & Brand Profile Management

**Description**  
Provide a structure to manage “projects” per brand, each with a brand profile.

**Scope** (🛠️ Platform)
- Create/update/delete projects
- Project-level brand profile:
  - Project name
  - Brand identity (text description)
  - Brand image keywords (style, tone)
- One brand profile per project
- Mapping between workspace and projects (B2B: 1 workspace → N projects)

**User Story**
- As a marketer, I want to manage multiple brand profiles under my workspace so that each project generates content aligned to its specific brand.

**Acceptance Criteria**
- New project creation screen collects: project name, basic brand info.
- Projects are listed in the dashboard with clear brand labels.
- When generating a detail page, user can select a project and the system uses its brand profile.

---

#### 2.1.3 Detail Page Automatic Draft Generation (Basic) (🤖)

**Description**  
Generate a first draft of a product detail page from user input, producing 2 versions per request.

**Responsibilities**
- 🙋‍♂️ User: Provide product inputs and choose a version.
- 🤖 AI: Generate 2 draft versions of the detail page.
- 🛠️ Platform: Handle request, store history, pass drafts to editor.

**Scope**
- **User input**
  - Product images upload (at least 1 image)
  - Product name
  - Category
  - Key features (list)
  - Target audience
- **AI output**
  - Page layout suggestion (section structure)
  - Hooking message
  - Section-by-section copy
  - Copy length option:
    - Short / Medium / Long
  - Two different versions per generation

**User Stories**
1. As a user, I want to provide my product images and basic info and get a full detail-page draft generated automatically.
2. As a user, I want at least two different proposals so I can pick the best one.

**Acceptance Criteria**
- Server validates required inputs and returns helpful error messages.
- For each request, exactly 2 different versions are returned.
- Each version contains:
  - One main hook message
  - Multiple sections with titles and body text
  - Copy length matches the selected option (short/medium/long).
- Selected version can be opened in the editor.

---

#### 2.1.4 Hooking Message & Section Copy Generation (🤖)

**Description**  
Generate brand-aligned hooking messages and section copy, mapped to a predefined template structure.

**Scope**
- Use brand profile and RAG signals (if available) to align tone
- Generate:
  - Hooking headline
  - Section titles
  - Section body text
- Respect template structure (e.g., Hero, Benefits, Social Proof, FAQ)
- Support copy length options

**User Story**
- As a marketer, I want the copy to sound like my brand and to follow a professional detail-page structure.

**Acceptance Criteria**
- Generated hook and copy include core product value propositions.
- Copy structure follows the underlying template (no missing mandatory sections).
- Length options result in visibly different text lengths.
- All generated text is editable within the editor.

---

#### 2.1.5 Basic Editor v1 (Text & Image) (🛠️ + 🙋‍♂️ + 🤖)

**Description**  
Provide an in-browser editor to adjust AI-generated detail pages.

**Scope**
- Text editing (🙋‍♂️)
  - Inline text editing for each block
  - Text style: color, size, font
- Image operations (🙋‍♂️ + 🤖)
  - Background removal
  - Simple background generation based on a short prompt
- Prompt-based image generation/modification (🤖)
- Template save/load (🙋‍♂️ + 🛠️)
- Auto-save (every 30 seconds) (🛠️)

**User Stories**
1. As a user, I want to refine AI-generated text and visuals easily without leaving the tool.
2. As a user, I want my progress to be auto-saved so I don’t lose work if I close the browser.

**Acceptance Criteria**
- Clicking a text area enables editing and changes are reflected instantly.
- Style controls update the preview in real time.
- Background removal is triggered by a button; the new image replaces the original.
- Auto-save is triggered at least every 30 seconds when changes exist.
- The user can restore the last draft after re-opening the project.

---

#### 2.1.6 Brand Analysis (RAG) – Basic Version (🤖)

**Description**  
Analyze brand information upfront so that generated text and visuals follow consistent brand tone, style, and color.

**Scope**
- Brand analysis input:
  - Brand name
  - Product/service description
  - Brand image keywords
  - Website URL
  - Instagram URL
- On URL input:
  - Crawl and extract product names and key information (best-effort)
- RAG sources:
  - 🙋‍♂️ User uploads: PDFs, text docs, previous marketing materials
  - 🤖 Crawled website/Instagram data
- Use retrieved brand snippets as context in generation

**User Story**
- As a marketer, I want the AI to understand my brand’s past content and style so that new content feels consistent.

**Acceptance Criteria**
- Given a website URL, the system extracts at least titles and some descriptive text.
- Uploaded documents are chunked, embedded, and stored in a vector DB per brand.
- Generation logs show that RAG context is included in prompts.
- Compared to generic generation, brand-aware mode produces outputs closer to brand language in test examples.

---

### 2.2 Sprint 2 (💉2️⃣) – Templates, Motion/GIF, History

#### 2.2.1 Sample Templates (Reference) (🛠️)

**Description**  
Provide reference templates for typical industries (e.g., fashion, F&B, digital products).

**Scope**
- System templates with:
  - Section structure
  - Example copy
- Category tags (fashion, food, beauty, digital, generic)
- Template selection from a gallery

**Acceptance Criteria**
- At least 3–5 reference templates available at launch.
- Templates are displayed with thumbnail and short description.
- Selecting a template opens it in the editor.

---

#### 2.2.2 Motion/GIF Detail-page Image Generation (🤖)

**Description**  
Apply preset motion effects to static images and export as GIF/MP4.

**Scope**
- Motion presets:
  - Zoom-in
  - Fade
  - Slide
- Export formats:
  - GIF
  - MP4
- Default duration (e.g., 3–5 seconds)

**Acceptance Criteria**
- For a selected image and preset, the user receives both GIF and MP4 URLs.
- Motion effects visually match the preset name.
- Errors and timeouts are properly surfaced to the UI.

---

#### 2.2.3 Project History & Versioning (🛠️)

**Description**  
Store multiple generated and edited versions per project.

**Scope**
- Version labeling (v1, v2, v3, …)
- History list per project
- Ability to restore a past version into the editor

**Acceptance Criteria**
- History panel shows all saved versions with timestamps.
- Clicking on a version restores its content as the current editor state.

---

### 2.3 Sprint 3+ (💉3️⃣) – Video & Advanced Options

#### 2.3.1 Short Ad Video Generation (🤖)

**Description**  
Generate short ad videos based on existing images and copy via a video generation API (e.g., Runway gen4_turbo).

**Scope**
- Input:
  - Selected key images
  - Main hook and key selling points
- Output:
  - 5–15 second marketing video
- Credit/usage tracking

---

#### 2.3.2 Real-time Generation Progress Indicator (🛠️)

**Description**  
Show progress for long-running tasks (image generation, GIF/video jobs).

---

#### 2.3.3 Image Quality Options (Draft / HD) (🤖)

**Description**  
Allow users to choose between fast draft output and slower high-quality output.

---

## 3. Nice-to-Have Features (💊 Vitamin)

- Emotion/tonality sliders for copy (e.g., “more exciting”, “more trustworthy”).
- Automatic A/B test variants (multiple hooks and main messages).
- “My style” learning: personalized templates based on user history.
- Direct publishing/integration with CMS/e-commerce platforms.

---

## 4. Future Consideration (🗃 Backlog)

- Advertising compliance check (regulation RAG) with suggestions.
- Multi-channel content bundles (Instagram post, Reels, blog, ad copy from same base content).
- Autonomous campaign agent: “Create a full campaign package for this product.”

---

## 5. Success Metrics

| Category      | Metric                                   | Target                                  |
|--------------|------------------------------------------|-----------------------------------------|
| Time-to-value| Time to first completed detail page      | From 1 hour → under 10 minutes          |
| Adoption     | Monthly Active Users (MAU)               | Target to be defined per phase          |
| Productivity | Detail pages created per active user     | ≥ 2x compared to baseline/manual        |
| Quality      | AI output satisfaction (rating 1–5)      | ≥ 4.5 / 5                               |
| B2B stickiness | Weekly active teams per workspace      | ≥ 70%                                   |
| Conversion   | Free → paid conversion rate              | 10–20% (to be validated)                |
