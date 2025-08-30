import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import OPENAI from 'openai';

const client = new OPENAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function processChat(userQuery) {
    try {
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: process.env.QDRANT_URL || 'http://localhost:6334',
                collectionName: process.env.QDRANT_COLLECTION_NAME || 'chaicode-collection',
            }
        );

        const vectorSearcher = vectorStore.asRetriever({
            k: 5, 
        });

        const relevantChunks = await vectorSearcher.invoke(userQuery);

  
        console.log(`Found ${relevantChunks.length} relevant chunks for query: "${userQuery}"`);
        relevantChunks.forEach((chunk, i) => {
            const pageNum = chunk.metadata?.loc?.pageNumber || "Unknown page";
            console.log(`Chunk ${i + 1} (Page ${pageNum}):`, chunk.pageContent.substring(0, 200) + '...');
        });

        const contextContent = relevantChunks
            .map((chunk, index) => {
                const content = chunk.pageContent || '';
                const source = chunk.metadata?.source || 'Unknown source';
                const pageNum = chunk.metadata?.loc?.pageNumber || 'Unknown page';
                return `Document ${index + 1} (Source: ${source}, Page: ${pageNum}):\n${content}`;
            })
            .join('\n\n---\n\n');

        const SYSTEM_PROMPT = `You are a document-based Q&A assistant. You must answer STRICTLY based on the provided context from the uploaded documents.

CRITICAL RULES:
- Use ONLY the exact information provided in the context below
- If the context doesn't contain the answer, say "I don't have that information in the provided documents"
- Quote or reference specific details from the context when possible, including the page number
- Write in plain text without markdown, asterisks, or special formatting
- If u feel like the answer is supposed to be given in points then answer in points always

DOCUMENT CONTEXT:
${contextContent}

IMPORTANT: Base your answer exclusively on the above context. Do not supplement with outside knowledge.`;

        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {role: 'system', content: SYSTEM_PROMPT},
                {role: 'user', content: userQuery}
            ],
            temperature: 0.1,
            max_tokens: 1000,
        });

        const aiResponse = response.choices[0].message.content;
        

        const cleanResponse = aiResponse
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/^\s*[\*\-\+]\s/gm, '')
            .replace(/^\s*\d+\.\s/gm, '')
            .trim();

        console.log(`AI Response: ${cleanResponse}`);
        
        return cleanResponse;
        
    } catch (error) {
        console.error('Chat processing error:', error);
        throw error;
    }
}

