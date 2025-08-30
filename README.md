Here’s a complete README for your RAG Notebook project, covering setup, usage, and referencing your main files:

**ScreenShots**
<img width="1919" height="975" alt="Screenshot 2025-08-30 174735" src="https://github.com/user-attachments/assets/f62edda8-afc9-4ff3-ab72-8a7ad557d36d" />
<img width="1914" height="1028" alt="Screenshot 2025-08-30 174904" src="https://github.com/user-attachments/assets/165163ea-717c-472f-a7bd-508324c67254" />



```md
# RAG Notebook

A Retrieval-Augmented Generation (RAG) notebook built with Next.js, LangChain, OpenAI, and Qdrant. Upload PDFs, CSVs, or index web pages, then chat or search over your data using powerful embeddings and vector search.

---

## Features

- Upload and index PDF/CSV files or web URLs
- Document sanitization and validation
- Embedding generation via OpenAI
- Vector storage and retrieval using Qdrant
- Chat interface for semantic search over your data

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── route.js      # Handles file uploads (PDF/CSV)
│   ├── page.js                  # Main UI page
│   └── globals.css
├── lib/
│   ├── indexing.js              # Loads, sanitizes, embeds, and indexes documents
│   └── chat.js                  # Chat logic (semantic search)
├── public/
│   └── uploads/                 # Uploaded files
├── .env                         # Environment variables
├── package.json
├── README.md
```

---

## Setup

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd notebookllm
   ```

2. **Install dependencies**
   ```sh
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env` file:
   ```
   OPENAI_API_KEY=your-openai-key
   QDRANT_URL=http://localhost:6334
   QDRANT_COLLECTION_NAME=chaicode-collection
   ```

4. **Start Qdrant**

   Make sure Qdrant is running locally or update the URL in `.env`.

5. **Run the development server**
   ```sh
   pnpm dev
   ```

---

## Usage

- Visit `http://localhost:3000`
- Upload a PDF or CSV, or enter a URL to index
- Chat or search over your indexed documents

---

## API Endpoints

- **File Upload:**  
  `POST /api/upload`  
  Handles PDF/CSV uploads. See [`app/api/upload/route.js`](app/api/upload/route.js).

---

## Indexing Logic

Document indexing is handled in [`lib/indexing.js`](lib/indexing.js):

- Loads documents using LangChain loaders
- Sanitizes and validates content
- Generates embeddings with OpenAI
- Stores vectors in Qdrant

---

## Deployment

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) or deploy to [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

---

## License

MIT
```

This README covers your upload API, indexing logic, setup, and usage. Copy and customize as needed!
