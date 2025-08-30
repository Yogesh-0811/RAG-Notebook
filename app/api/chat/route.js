import { NextRequest, NextResponse } from 'next/server';
import { processChat } from '../../../lib/chat.js';

export async function POST(request) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Message is required'
            }, { status: 400 });
        }

        console.log(`💬 Chat request: ${message}`);

        // Call your modified chat function
        const response = await processChat(message);

        return NextResponse.json({
            success: true,
            response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process chat message'
        }, { status: 500 });
    }
}