import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// R2 Client configuration
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vindel-images';
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const key = `${path}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await R2.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    // Construct public URL
    const url = PUBLIC_URL 
      ? `${PUBLIC_URL}/${key}`
      : `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Upload failed', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    // Extract key from URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith('/') 
      ? urlObj.pathname.slice(1) 
      : urlObj.pathname;

    await R2.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { message: 'Delete failed', error: String(error) },
      { status: 500 }
    );
  }
}
