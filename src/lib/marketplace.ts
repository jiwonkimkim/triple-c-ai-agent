import { prisma } from './prisma';
import { MARKETPLACE_CONFIG, calculateMarketplaceEarnings } from './stripe';

/**
 * Purchase a template from the marketplace
 */
export async function purchaseTemplate(
  buyerId: string,
  templateId: string
): Promise<{
  success: boolean;
  error?: string;
  purchase?: {
    id: string;
    templateId: string;
    pricePaid: number;
  };
}> {
  // 1. Get template and validate
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { user: true },
  });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  if (!template.isPublished) {
    return { success: false, error: 'Template is not available for purchase' };
  }

  // System templates with no seller - only free templates allowed
  if (!template.userId) {
    if (template.price > 0) {
      return { success: false, error: 'System template cannot be sold' };
    }
    // Allow free system template "purchase" (just record the download)
    const existingPurchase = await prisma.templatePurchase.findFirst({
      where: {
        templateId,
        buyerId,
      },
    });

    if (existingPurchase) {
      return { success: false, error: 'Template already acquired' };
    }

    // For system templates, create a purchase record without seller
    const purchase = await prisma.templatePurchase.create({
      data: {
        templateId,
        buyerId,
        sellerId: null, // No seller for system templates
        pricePaid: 0,
        sellerEarning: 0,
        platformFee: 0,
      },
    });

    // Increment download count
    await prisma.template.update({
      where: { id: templateId },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      success: true,
      purchase: {
        id: purchase.id,
        templateId: purchase.templateId,
        pricePaid: 0,
      },
    };
  }

  if (template.userId === buyerId) {
    return { success: false, error: 'Cannot purchase your own template' };
  }

  // 2. Check if already purchased
  const existingPurchase = await prisma.templatePurchase.findUnique({
    where: {
      templateId_buyerId: {
        templateId,
        buyerId,
      },
    },
  });

  if (existingPurchase) {
    return { success: false, error: 'Template already purchased' };
  }

  // 3. For free templates, create purchase without credit deduction
  if (template.price === 0) {
    const purchase = await prisma.templatePurchase.create({
      data: {
        templateId,
        buyerId,
        sellerId: template.userId,
        pricePaid: 0,
        sellerEarning: 0,
        platformFee: 0,
      },
    });

    // Increment download count
    await prisma.template.update({
      where: { id: templateId },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      success: true,
      purchase: {
        id: purchase.id,
        templateId: purchase.templateId,
        pricePaid: 0,
      },
    };
  }

  // 4. Get buyer and check credits
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
  });

  if (!buyer) {
    return { success: false, error: 'Buyer not found' };
  }

  const totalCredits = buyer.trialCredits + buyer.credits;
  if (totalCredits < template.price) {
    return { success: false, error: 'Insufficient credits' };
  }

  // 5. Calculate earnings
  const { sellerEarning, platformFee } = calculateMarketplaceEarnings(template.price);

  // 6. Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct credits from buyer (trial first, then paid)
    let remainingToDeduct = template.price;
    let trialUsed = 0;
    let paidUsed = 0;

    if (buyer.trialCredits > 0) {
      trialUsed = Math.min(buyer.trialCredits, remainingToDeduct);
      remainingToDeduct -= trialUsed;
    }
    if (remainingToDeduct > 0) {
      paidUsed = remainingToDeduct;
    }

    const newTrialCredits = buyer.trialCredits - trialUsed;
    const newCredits = buyer.credits - paidUsed;

    await tx.user.update({
      where: { id: buyerId },
      data: {
        trialCredits: newTrialCredits,
        credits: newCredits,
      },
    });

    // Create credit transaction for buyer
    await tx.creditTransaction.create({
      data: {
        userId: buyerId,
        type: 'TEMPLATE_PURCHASE',
        amount: -template.price,
        balance: newTrialCredits + newCredits,
        description: `Purchased template: ${template.name}`,
        metadata: {
          templateId,
          templateName: template.name,
          trialUsed,
          paidUsed,
        },
      },
    });

    // Create or update seller balance
    const sellerBalance = await tx.sellerBalance.upsert({
      where: { userId: template.userId! },
      create: {
        userId: template.userId!,
        availableCredits: sellerEarning,
        totalEarned: sellerEarning,
      },
      update: {
        availableCredits: { increment: sellerEarning },
        totalEarned: { increment: sellerEarning },
      },
    });

    // Create seller transaction
    await tx.sellerTransaction.create({
      data: {
        sellerId: template.userId!,
        type: 'SALE',
        amount: sellerEarning,
        balance: sellerBalance.availableCredits,
        description: `Sale: ${template.name}`,
        templateId,
      },
    });

    // Create purchase record
    const purchase = await tx.templatePurchase.create({
      data: {
        templateId,
        buyerId,
        sellerId: template.userId!,
        pricePaid: template.price,
        sellerEarning,
        platformFee,
      },
    });

    // Increment download count
    await tx.template.update({
      where: { id: templateId },
      data: { downloadCount: { increment: 1 } },
    });

    return purchase;
  });

  return {
    success: true,
    purchase: {
      id: result.id,
      templateId: result.templateId,
      pricePaid: result.pricePaid,
    },
  };
}

/**
 * Check if user has access to a template
 */
export async function canAccessTemplate(
  userId: string,
  templateId: string
): Promise<boolean> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) return false;

  // System templates: always accessible
  if (template.createdBy === 'SYSTEM') return true;

  // Owner can always access their templates
  if (template.userId === userId) return true;

  // Free marketplace templates: accessible to all
  if (template.isPublished && template.price === 0) return true;

  // Paid marketplace templates: check purchase
  if (template.isPublished && template.price > 0) {
    const purchase = await prisma.templatePurchase.findUnique({
      where: {
        templateId_buyerId: {
          templateId,
          buyerId: userId,
        },
      },
    });
    return !!purchase;
  }

  // Private user templates: not accessible to others
  return false;
}

/**
 * Withdraw seller earnings to credits
 */
export async function withdrawSellerEarnings(
  userId: string,
  amount: number
): Promise<{
  success: boolean;
  error?: string;
  newBalance?: number;
  newCredits?: number;
}> {
  if (amount < MARKETPLACE_CONFIG.WITHDRAWAL_MIN_AMOUNT) {
    return {
      success: false,
      error: `Minimum withdrawal amount is ${MARKETPLACE_CONFIG.WITHDRAWAL_MIN_AMOUNT} credits`,
    };
  }

  const sellerBalance = await prisma.sellerBalance.findUnique({
    where: { userId },
  });

  if (!sellerBalance) {
    return { success: false, error: 'Seller balance not found' };
  }

  if (sellerBalance.availableCredits < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Deduct from seller balance
    const updatedSellerBalance = await tx.sellerBalance.update({
      where: { userId },
      data: {
        availableCredits: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    });

    // Create seller transaction
    await tx.sellerTransaction.create({
      data: {
        sellerId: userId,
        type: 'WITHDRAWAL',
        amount: -amount,
        balance: updatedSellerBalance.availableCredits,
        description: `Withdrawn ${amount} credits`,
      },
    });

    // Add to user credits
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
      },
    });

    // Create credit transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'SELLER_WITHDRAWAL',
        amount,
        balance: updatedUser.trialCredits + updatedUser.credits,
        description: `Seller earnings withdrawal`,
        metadata: { withdrawnAmount: amount },
      },
    });

    return {
      newBalance: updatedSellerBalance.availableCredits,
      newCredits: updatedUser.credits,
    };
  });

  return {
    success: true,
    newBalance: result.newBalance,
    newCredits: result.newCredits,
  };
}

/**
 * Publish a template to the marketplace
 */
export async function publishTemplate(
  userId: string,
  templateId: string,
  data: {
    price: number;
    description?: string;
    tags?: string[];
    previewImages?: string[];
  }
): Promise<{
  success: boolean;
  error?: string;
  template?: {
    id: string;
    name: string;
    price: number;
    isPublished: boolean;
  };
}> {
  // Validate price
  if (data.price < 0) {
    return { success: false, error: 'Price cannot be negative' };
  }
  if (data.price > MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE) {
    return {
      success: false,
      error: `Maximum price is ${MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE} credits`,
    };
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  if (template.userId !== userId) {
    return { success: false, error: 'Not authorized to publish this template' };
  }

  if (template.createdBy === 'SYSTEM') {
    return { success: false, error: 'Cannot publish system templates' };
  }

  const updatedTemplate = await prisma.template.update({
    where: { id: templateId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      price: data.price,
      description: data.description,
      tags: data.tags || [],
      previewImages: data.previewImages || [],
    },
  });

  return {
    success: true,
    template: {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      price: updatedTemplate.price,
      isPublished: updatedTemplate.isPublished,
    },
  };
}

/**
 * Unpublish a template from the marketplace
 */
export async function unpublishTemplate(
  userId: string,
  templateId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  if (template.userId !== userId) {
    return { success: false, error: 'Not authorized to unpublish this template' };
  }

  await prisma.template.update({
    where: { id: templateId },
    data: {
      isPublished: false,
    },
  });

  return { success: true };
}
