import { NextRequest, NextResponse } from 'next/server';
import { init as indexDocument } from '../../../lib/indexing.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type');
        
        if (contentType?.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            const type = formData.get('type');

            if (!file || !type) {
                return NextResponse.json({
                    success: false,
                    error: 'Missing file or type parameter'
                }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${file.name}`);
            
            await fs.writeFile(tempFilePath, buffer);
            
            try {
                console.log(`📚 Processing uploaded file: ${file.name} (${type})`);
                const result = await indexDocument(tempFilePath, type);
                
                await fs.unlink(tempFilePath);
                
                return NextResponse.json({
                    success: true,
                    message: `${type.toUpperCase()} file processed successfully`,
                    ...result
                });
                
            } catch (error) {
                try {
                    await fs.unlink(tempFilePath);
                } catch (cleanupError) {
                    console.error('Failed to cleanup temp file:', cleanupError);
                }
                throw error;
            }
        }
        
        else {
            const { input, type } = await request.json();

            if (!input || !type) {
                return NextResponse.json({
                    success: false,
                    error: 'Missing input or type parameter'
                }, { status: 400 });
            }

            if (type !== 'url') {
                return NextResponse.json({
                    success: false,
                    error: 'For files, use multipart/form-data. JSON requests only support URLs.'
                }, { status: 400 });
            }

            console.log(`📚 Processing URL: ${input}`);
            const result = await indexDocument(input, type);

            return NextResponse.json({
                success: true,
                message: 'URL processed successfully',
                ...result
            });
        }

    } catch (error) {
        console.error('Processing error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process document'
        }, { status: 500 });
    }
}