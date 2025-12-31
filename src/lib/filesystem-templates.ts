import fs from 'fs';
import path from 'path';

export interface FilesystemTemplateImage {
  image: string;
  ocr_text?: string;
  description?: string;
  prompt?: string;
}

export interface FilesystemTemplateJSON {
  product_code: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  folder_name: string;
  images: FilesystemTemplateImage[];
}

export interface FilesystemTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  previewImages: string[];
  sections: {
    id: string;
    type: string;
    imageUrl: string;
    ocrText?: string;
    description?: string;
    prompt?: string;
  }[];
  description: string;
  price: number;
  tags: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  isReference: boolean;
  createdBy: string;
  publishedAt: Date;
  seller: null;
  isPurchased: boolean;
  isOwner: boolean;
}

/**
 * Reads template JSON files from public/templates directory
 * Returns formatted templates ready for marketplace display
 */
export function getFilesystemTemplates(): FilesystemTemplate[] {
  const templates: FilesystemTemplate[] = [];
  const templatesDir = path.join(process.cwd(), 'public', 'templates');

  // Check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    return templates;
  }

  // Read all vendor directories (e.g., oliveyoung)
  const vendors = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const vendor of vendors) {
    const vendorDir = path.join(templatesDir, vendor);

    // Read all product directories within vendor
    const products = fs.readdirSync(vendorDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const product of products) {
      const productDir = path.join(vendorDir, product);

      // Find JSON file in product directory
      const files = fs.readdirSync(productDir);
      const jsonFile = files.find(f => f.endsWith('.json'));

      if (!jsonFile) continue;

      try {
        const jsonPath = path.join(productDir, jsonFile);
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const data: FilesystemTemplateJSON = JSON.parse(jsonContent);

        // Build image URLs
        const basePath = `/templates/${vendor}/${product}`;

        // Find main/thumbnail image
        const mainImage = data.images.find(img => img.image === 'main.jpg') || data.images[0];
        const thumbnailUrl = mainImage ? `${basePath}/${mainImage.image}` : '';

        // Build preview images (excluding detail_page.png)
        const previewImages = data.images
          .filter(img => img.image !== 'detail_page.png')
          .map(img => `${basePath}/${img.image}`);

        // Build sections from images
        const sections = data.images
          .filter(img => img.image !== 'detail_page.png' && img.image !== 'main.jpg')
          .map((img, index) => ({
            id: `${data.product_code}-section-${index}`,
            type: 'DETAIL',
            imageUrl: `${basePath}/${img.image}`,
            ocrText: img.ocr_text,
            description: img.description,
            prompt: img.prompt,
          }));

        // Map category
        let category = 'GENERIC';
        if (data.category.includes('메이크업') || data.category.includes('립')) {
          category = 'BEAUTY';
        } else if (data.category.includes('패션')) {
          category = 'FASHION';
        } else if (data.category.includes('음식') || data.category.includes('식품')) {
          category = 'FOOD';
        } else if (data.category.includes('디지털') || data.category.includes('전자')) {
          category = 'DIGITAL';
        }

        // Build tags (simple: brand and vendor only)
        const tags = [data.brand, vendor];

        const template: FilesystemTemplate = {
          id: `fs-${vendor}-${data.product_code}`,
          name: data.name,
          category,
          thumbnailUrl,
          previewImages,
          sections,
          description: `${data.brand} 참조 템플릿`,
          price: 0, // Free system template
          tags: Array.from(new Set(tags)), // Remove duplicates
          downloadCount: 0,
          rating: 0,
          ratingCount: 0,
          isReference: true,
          createdBy: 'SYSTEM',
          publishedAt: new Date(),
          seller: null,
          isPurchased: false,
          isOwner: false,
        };

        templates.push(template);
      } catch (error) {
        console.error(`Error reading template from ${productDir}:`, error);
      }
    }
  }

  return templates;
}

/**
 * Get a single filesystem template by ID
 */
export function getFilesystemTemplateById(id: string): FilesystemTemplate | null {
  const templates = getFilesystemTemplates();
  return templates.find(t => t.id === id) || null;
}
