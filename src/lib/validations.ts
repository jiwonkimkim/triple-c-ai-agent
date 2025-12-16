import { z } from 'zod';

// ============================================
// Auth Validations
// ============================================

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').optional(),
  nickname: z.string().optional(),
  industry: z.string().optional(),
  userType: z.enum(['B2C', 'B2B']),
});

// ============================================
// Project Validations
// ============================================

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  workspaceId: z.string().nullable().optional(),
  brandProfileId: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  brandProfileId: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// ============================================
// Brand Profile Validations
// ============================================

export const createBrandProfileSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name is too long'),
  identity: z.string().min(1, 'Brand identity is required').max(2000, 'Identity is too long'),
  toneAndManner: z
    .string()
    .min(1, 'Tone and manner is required')
    .max(2000, 'Tone and manner is too long'),
  imageKeywords: z.array(z.string()).min(1, 'At least one image keyword is required'),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const updateBrandProfileSchema = createBrandProfileSchema.partial();

// ============================================
// Generation Validations
// ============================================

export const generateDetailPageSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  productImages: z.array(z.string().min(1)).min(1, 'At least one product image is required'),
  productName: z.string().min(1, 'Product name is required').max(100, 'Product name is too long'),
  category: z.string().min(1, 'Category is required'),
  keyFeatures: z.array(z.string().min(1)).min(1, 'At least one key feature is required'),
  targetAudience: z.string().optional().default('일반 소비자'),
  copyLength: z.enum(['short', 'medium', 'long']),
});

export const generateHookMessageSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  keyFeatures: z.array(z.string()).min(1, 'At least one key feature is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  brandTone: z.string().optional(),
  copyLength: z.enum(['short', 'medium', 'long']),
});

export const generateSectionCopySchema = z.object({
  sectionType: z.enum(['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'CUSTOM']),
  productName: z.string().min(1, 'Product name is required'),
  keyFeatures: z.array(z.string()).min(1),
  brandTone: z.string().optional(),
  copyLength: z.enum(['short', 'medium', 'long']),
});

// ============================================
// Image Validations
// ============================================

export const removeBackgroundSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

export const generateBackgroundSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt is too long'),
});

export const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt is too long'),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
  quality: z.enum(['draft', 'hd']).optional(),
});

// ============================================
// Motion/Video Job Validations
// ============================================

export const createMotionJobSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  imageUrl: z.string().url('Invalid image URL'),
  preset: z.enum(['ZOOM_IN', 'FADE', 'SLIDE']),
});

export const createVideoJobSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt is too long'),
  referenceImageUrls: z.array(z.string().url()).optional(),
});

// ============================================
// Template Validations
// ============================================

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name is too long'),
  category: z.enum(['GENERIC', 'FASHION', 'FOOD', 'BEAUTY', 'DIGITAL']),
  sections: z.array(
    z.object({
      type: z.enum(['HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ', 'CUSTOM']),
      title: z.string().optional(),
      body: z.string(),
      order: z.number(),
    })
  ),
});

// ============================================
// Editor Validations
// ============================================

export const saveDraftSchema = z.object({
  contentJson: z.object({
    blocks: z.array(z.unknown()),
    version: z.number(),
  }),
});

// ============================================
// Workspace Validations
// ============================================

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

// ============================================
// RAG Validations
// ============================================

export const ingestUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
  source: z.enum(['WEBSITE', 'INSTAGRAM']),
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateBrandProfileInput = z.infer<typeof createBrandProfileSchema>;
export type UpdateBrandProfileInput = z.infer<typeof updateBrandProfileSchema>;
export type GenerateDetailPageInput = z.infer<typeof generateDetailPageSchema>;
export type GenerateHookMessageInput = z.infer<typeof generateHookMessageSchema>;
export type GenerateSectionCopyInput = z.infer<typeof generateSectionCopySchema>;
export type CreateMotionJobInput = z.infer<typeof createMotionJobSchema>;
export type CreateVideoJobInput = z.infer<typeof createVideoJobSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type IngestUrlInput = z.infer<typeof ingestUrlSchema>;
