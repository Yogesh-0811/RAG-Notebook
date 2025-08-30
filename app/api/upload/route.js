import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file uploaded'
            }, { status: 400 });
        }

        // Check file type
        const allowedTypes = ['.pdf', '.csv'];
        const fileExt = path.extname(file.name).toLowerCase();
        
        if (!allowedTypes.includes(fileExt)) {
            return NextResponse.json({
                success: false,
                error: 'Only PDF and CSV files are allowed!'
            }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = path.join(uploadDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        const relativePath = `./public/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            filePath: relativePath,
            originalName: file.name,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to upload file'
        }, { status: 500 });
    }
}
