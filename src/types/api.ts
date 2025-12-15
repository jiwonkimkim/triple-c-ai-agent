import { CopyLength, DetailPageVersion, MotionPreset } from './index';

// ============================================
// Auth API Types
// ============================================

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
  industry?: string;
  userType: 'B2C' | 'B2B';
}

export interface SignUpResponse {
  userId: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    userType: 'B2C' | 'B2B';
  };
}

export interface VerifyEmailRequest {
  token: string;
}

// ============================================
// B2B Specific Types
// ============================================

export interface B2BSignUpRequest extends SignUpRequest {
  companyName: string;
  companyDomain: string;
  businessNumber?: string;
  companySize?: 'SMB' | 'Mid' | 'Enterprise';
  contactName: string;
  contactPosition?: string;
  contactPhone?: string;
}

export interface InviteMemberRequest {
  workspaceId: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

// ============================================
// Project API Types
// ============================================

export interface CreateProjectRequest {
  title: string;
  description?: string;
  workspaceId?: string;
  brandProfileId?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  brandProfileId?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

// ============================================
// Brand Profile API Types
// ============================================

export interface CreateBrandProfileRequest {
  workspaceId?: string;
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  websiteUrl?: string;
  instagramUrl?: string;
}

export interface UpdateBrandProfileRequest {
  name?: string;
  identity?: string;
  toneAndManner?: string;
  imageKeywords?: string[];
  websiteUrl?: string;
  instagramUrl?: string;
}

export interface IngestUrlRequest {
  url: string;
  source: 'WEBSITE' | 'INSTAGRAM';
}

export interface UploadDocRequest {
  file: File;
  filename: string;
}

// ============================================
// Generation API Types
// ============================================

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

export interface GenerateHookMessageRequest {
  productName: string;
  keyFeatures: string[];
  targetAudience: string;
  brandTone?: string;
  copyLength: CopyLength;
}

export interface GenerateSectionCopyRequest {
  sectionType: string;
  productName: string;
  keyFeatures: string[];
  brandTone?: string;
  copyLength: CopyLength;
}

// ============================================
// Image API Types
// ============================================

export interface RemoveBackgroundRequest {
  imageUrl: string;
}

export interface RemoveBackgroundResponse {
  processedImageUrl: string;
}

export interface GenerateBackgroundRequest {
  imageUrl: string;
  prompt: string;
}

export interface GenerateBackgroundResponse {
  resultImageUrl: string;
}

export interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  quality?: 'draft' | 'hd';
}

export interface GenerateImageResponse {
  imageUrl: string;
}

// ============================================
// Motion/GIF API Types
// ============================================

export interface CreateMotionJobRequest {
  projectId: string;
  imageUrl: string;
  preset: MotionPreset;
}

export interface MotionJobResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultGifUrl?: string;
  resultMp4Url?: string;
}

// ============================================
// Video API Types
// ============================================

export interface CreateVideoJobRequest {
  projectId: string;
  prompt: string;
  referenceImageUrls?: string[];
}

export interface VideoJobResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultVideoUrl?: string;
  costCredits?: number;
}

// ============================================
// Editor API Types
// ============================================

export interface SaveDraftRequest {
  contentJson: {
    blocks: unknown[];
    version: number;
  };
}

export interface LoadDraftResponse {
  id: string;
  contentJson: {
    blocks: unknown[];
    version: number;
  };
  updatedAt: string;
}

// ============================================
// Template API Types
// ============================================

export interface CreateTemplateRequest {
  name: string;
  category: 'GENERIC' | 'FASHION' | 'FOOD' | 'BEAUTY' | 'DIGITAL';
  sections: {
    type: string;
    title?: string;
    body: string;
    order: number;
  }[];
}

// ============================================
// History API Types
// ============================================

export interface CreateHistoryRequest {
  versionLabel: string;
  detailPageVersion: DetailPageVersion;
}
