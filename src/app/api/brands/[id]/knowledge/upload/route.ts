import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { chunkText } from '@/services/rag/text-chunker';

export const dynamic = 'force-dynamic';

// POST /api/brands/[id]/knowledge/upload - Upload file and extract text
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = params.id;

    // Verify ownership
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.trialCredits <= 0 && user.plan === 'FREE')) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // File size limit (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    let extractedText = '';
    const fileName = file.name;
    const fileType = file.type;

    // Handle different file types
    if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Plain text files
      extractedText = await file.text();
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // PDF files - try basic extraction
      try {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = extractTextFromPdfBuffer(arrayBuffer);

        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: 'Could not extract text from PDF. The PDF may be image-based or encrypted.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('PDF extraction error:', error);
        return NextResponse.json(
          { error: 'Failed to process PDF file. Please try uploading a text file instead.' },
          { status: 400 }
        );
      }
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      // Word documents - basic DOCX support
      try {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = extractTextFromDocx(arrayBuffer);

        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: 'Could not extract text from document. Please try a different file format.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('DOCX extraction error:', error);
        return NextResponse.json(
          { error: 'Failed to process Word document. Please try uploading a text file instead.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload TXT, PDF, or DOCX files.' },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text content found in the file.' },
        { status: 400 }
      );
    }

    // Chunk the extracted text
    const chunks = chunkText(extractedText, {
      maxChunkSize: 1000,
      overlap: 200,
    });

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid chunks could be created from the file content.' },
        { status: 400 }
      );
    }

    // Save chunks to database
    await prisma.brandDocumentChunk.createMany({
      data: chunks.map((chunk) => ({
        brandProfileId: brandId,
        source: 'UPLOAD' as const,
        content: chunk.text,
        metadata: {
          fileName,
          fileType,
          createdAt: new Date().toISOString(),
        },
      })),
    });

    // Update brand profile timestamp
    await prisma.brandProfile.update({
      where: { id: brandId },
      data: { updatedAt: new Date() },
    });

    // Deduct credit if on free plan
    if (user.plan === 'FREE' && user.trialCredits > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { trialCredits: user.trialCredits - 1 },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        brandId,
        fileName,
        chunksIndexed: chunks.length,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}

/**
 * Basic PDF text extraction using regex patterns
 * This is a simplified approach - for production, use pdf-parse library
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);

  // Try to extract readable text between stream markers
  const textParts: string[] = [];

  // Look for text between BT and ET markers (text blocks in PDF)
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
  }

  // Also try to find plain text content
  const plainTextRegex = /[\x20-\x7E가-힣\u3131-\u318E\u3200-\u321E\uAC00-\uD7AF]{10,}/g;
  const plainMatches = text.match(plainTextRegex);
  if (plainMatches) {
    textParts.push(...plainMatches);
  }

  // Clean up and join
  const result = textParts
    .map(s => s.replace(/\\[nrt]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 5)
    .join('\n');

  return result;
}

/**
 * Basic DOCX text extraction
 * DOCX is a ZIP file containing XML - this extracts text from document.xml
 */
function extractTextFromDocx(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);

  // DOCX contains XML - try to find text between <w:t> tags
  const textParts: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = wtRegex.exec(text)) !== null) {
    if (match[1].trim()) {
      textParts.push(match[1]);
    }
  }

  // Also look for any readable text patterns
  if (textParts.length === 0) {
    const plainTextRegex = /[\x20-\x7E가-힣\u3131-\u318E\u3200-\u321E\uAC00-\uD7AF]{10,}/g;
    const plainMatches = text.match(plainTextRegex);
    if (plainMatches) {
      textParts.push(...plainMatches.filter(s =>
        !s.includes('xml') &&
        !s.includes('xmlns') &&
        !s.includes('Content_Types')
      ));
    }
  }

  return textParts.join(' ');
}
