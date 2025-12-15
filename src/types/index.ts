// ============================================
// User & Auth Types
// ============================================

export type UserType = 'B2C' | 'B2B';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  nickname?: string | null;
  image?: string | null;
  industry?: string | null;
  userType: UserType;
  emailVerified: Date | null;
  trialCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    userType: UserType;
  };
  expires: string;
}

// ============================================
// Company & Workspace Types
// ============================================

export type CompanySize = 'SMB' | 'Mid' | 'Enterprise';

export interface CompanyInfo {
  id: string;
  name: string;
  domain: string;
  businessNumber?: string | null;
  size?: CompanySize | null;
  industry?: string | null;
  monthlyContentVolume?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface WorkspaceMember {
  userId: string;
  role: Role;
  user?: User;
  joinedAt: Date;
}

export interface Workspace {
  id: string;
  companyId: string | null;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Brand Profile Types
// ============================================

export interface BrandProfile {
  id: string;
  workspaceId: string | null;
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BrandDocumentSource = 'WEBSITE' | 'INSTAGRAM' | 'UPLOAD';

export interface BrandDocumentChunk {
  id: string;
  brandProfileId: string;
  source: BrandDocumentSource;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
}

// ============================================
// Project Types
// ============================================

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  ownerId: string;
  workspaceId?: string | null;
  brandProfileId?: string | null;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  brandProfile?: BrandProfile | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Detail Page Types
// ============================================

export type SectionType =
  | 'HERO'
  | 'FEATURES'
  | 'SOCIAL_PROOF'
  | 'HOW_TO_USE'
  | 'FAQ'
  | 'CUSTOM';

export interface DetailPageSection {
  id: string;
  type: SectionType;
  title?: string | null;
  body: string;
  imageUrl?: string | null;
  order: number;
}

export interface DetailPageVersion {
  id: string;
  projectId: string;
  hookMessage: string;
  sections: DetailPageSection[];
  createdAt: Date;
}

export type CopyLength = 'short' | 'medium' | 'long';

export interface GenerateDetailPageRequest {
  projectId: string;
  productImages: string[];
  productName: string;
  category: string;
  keyFeatures: string[];
  targetAudience: string;
  copyLength: CopyLength;
}

export interface GenerateDetailPageResponse {
  versions: DetailPageVersion[];
}

// ============================================
// Editor Types
// ============================================

export type EditorBlockType = 'text' | 'image' | 'section' | 'spacer';

export interface EditorTextStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export interface EditorTextBlock {
  id: string;
  type: 'text';
  content: string;
  style: EditorTextStyle;
}

export interface EditorImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface EditorSectionBlock {
  id: string;
  type: 'section';
  sectionType: SectionType;
  title?: string;
  children: EditorBlock[];
  backgroundColor?: string;
  padding?: number;
}

export interface EditorSpacerBlock {
  id: string;
  type: 'spacer';
  height: number;
}

export type EditorBlock =
  | EditorTextBlock
  | EditorImageBlock
  | EditorSectionBlock
  | EditorSpacerBlock;

export interface EditorDraft {
  id: string;
  projectId: string;
  userId: string;
  contentJson: {
    blocks: EditorBlock[];
    version: number;
  };
  updatedAt: Date;
}

// ============================================
// Template Types
// ============================================

export type TemplateCategory =
  | 'GENERIC'
  | 'FASHION'
  | 'FOOD'
  | 'BEAUTY'
  | 'DIGITAL';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl?: string | null;
  sections: DetailPageSection[];
  isReference: boolean;
  createdBy: 'SYSTEM' | 'USER';
  createdAt: Date;
}

// ============================================
// Motion/GIF Job Types
// ============================================

export type MotionPreset = 'ZOOM_IN' | 'FADE' | 'SLIDE';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface MotionJob {
  id: string;
  projectId: string;
  imageUrl: string;
  preset: MotionPreset;
  status: JobStatus;
  resultGifUrl?: string | null;
  resultMp4Url?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Video Job Types
// ============================================

export interface VideoJob {
  id: string;
  projectId: string;
  status: JobStatus;
  prompt: string;
  referenceImageUrls?: string[];
  resultVideoUrl?: string | null;
  costCredits?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Project History Types
// ============================================

export interface ProjectHistory {
  id: string;
  projectId: string;
  versionLabel: string;
  detailPageVersion: DetailPageVersion;
  createdAt: Date;
  createdBy: string;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
