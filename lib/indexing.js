import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import path from "path";

// Function to clean and validate document content
function sanitizeDocumentContent(doc) {
    if (!doc.pageContent || typeof doc.pageContent !== 'string') {
        return null;
    }

    let content = doc.pageContent;
    
    // Remove or replace problematic characters
    content = content
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n, \r, \t
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    // Skip if content is too short or empty
    if (content.length < 10) {
        return null;
    }
    
    // Truncate if too long (OpenAI has token limits)
    if (content.length > 8000) {
        content = content.substring(0, 8000) + '...';
    }
    
    return {
        ...doc,
        pageContent: content
    };
}

export async function init(input, type) {
    let loader;
    const compiledConvert = compile({ 
        wordwrap: 130,
        selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' }
        ]
    });

    try {
        // Decide loader based on type
        if (type === "pdf") {
            const pdfFilePath = path.resolve(input);
            loader = new PDFLoader(pdfFilePath);
        } 
        else if (type === "csv") {
            const csvFilePath = path.resolve(input);
            loader = new CSVLoader(csvFilePath);
        }
        else if (type === "url") {
            // ✅ ensure input is a valid URL string
            if (!/^https?:\/\//i.test(input)) {
                throw new Error("Invalid URL format. Must start with http:// or https://");
            }

            loader = new RecursiveUrlLoader(input, {
                extractor: compiledConvert,
                maxDepth: 1,
                excludeDirs: ["/docs/api/"],
                timeout: 10000, // Add timeout
                ignoreSslErrors: false
            });
        }
        else {
            throw new Error("Unsupported input type! Use pdf, csv, or url.");
        }

        console.log(`Loading ${type} documents...`);
        
        // Load docs
        const rawDocs = await loader.load();

        if (!rawDocs || rawDocs.length === 0) {
            throw new Error("No documents loaded. Please check your input.");
        }

        console.log(`Loaded ${rawDocs.length} raw documents, sanitizing content...`);

        // Sanitize documents
        const docs = rawDocs
            .map(sanitizeDocumentContent)
            .filter(doc => doc !== null); // Remove invalid docs

        if (docs.length === 0) {
            throw new Error("No valid documents after sanitization. Content may be too short or invalid.");
        }

        console.log(`${docs.length} documents ready for embedding...`);

        // Ready the client OPENAI Embedding Model
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
            stripNewLines: true, // Help with formatting issues
            maxRetries: 3,
        });

        // Test with a small batch first if there are many docs
        if (docs.length > 10) {
            console.log("Testing embedding with first document...");
            const testDoc = docs[0];
            try {
                await embeddings.embedQuery(testDoc.pageContent.substring(0, 100));
                console.log("Embedding test successful ✅");
            } catch (error) {
                console.error("Embedding test failed:", error.message);
                throw new Error(`Embedding validation failed: ${error.message}`);
            }
        }

        // Store in Qdrant
        console.log("Creating vector store...");
        const vectorStore = await QdrantVectorStore.fromDocuments(
            docs,
            embeddings,
            {
                url: process.env.QDRANT_URL || 'http://localhost:6334',
                collectionName: process.env.QDRANT_COLLECTION_NAME || 'chaicode-collection',
            }
        );
        
        console.log(`Indexing of ${type} documents done ✅ (${docs.length} docs)`);
        return { 
            success: true, 
            type, 
            input, 
            documentsCount: docs.length,
            originalDocsCount: rawDocs.length 
        };

    } catch (error) {
        console.error(`❌ Indexing failed for ${type}:`, error.message);
        
        // More specific error handling
        if (error.message.includes('$.input')) {
            console.error("This appears to be an OpenAI API validation error. Check document content formatting.");
        } else if (error.message.includes('timeout')) {
            console.error("Request timeout. Try reducing maxDepth or checking URL accessibility.");
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.error("Network error. Check your internet connection and URL accessibility.");
        }
        
        throw error;
    }
}