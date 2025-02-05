import os
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import ollama
from supabase import create_client, Client

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase: Client = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

def fetch_documents():
    """
    Fetch documents and their embeddings from the 'embeddings' table.
    The table is assumed to have a 'content' column (original text)
    and an 'embedding' column (a stored vector).
    """
    response = supabase.table('embeddings').select('content, embedding').execute()
    documents = []
    for record in response.data:
        content = record.get('content')
        emb = record.get('embedding')
        # 
        if isinstance(emb, str):
            try:
                # Attempt to parse using json.loads (if it is valid JSON)
                emb = json.loads(emb)
            except json.JSONDecodeError:
                # Fallback: remove brackets and split by comma
                emb = emb.strip("[]").split(",")
                emb = [float(x) for x in emb if x.strip()]
        documents.append({"content": content, "embedding": emb})
    return documents

def generate_query_embedding(query: str):
    try:
        response = ollama.embed(
            model="mxbai-embed-large",  
            input=query,
        )
        if hasattr(response, "embedding"):
            emb = response.embedding
        elif hasattr(response, "embeddings"):
            emb = response.embeddings[0]
        else:
            print("Unexpected response structure:", response)
            return None
        return [float(x) for x in emb]
    except Exception as e:
        print("Error generating query embedding:", e)
        return None

def retrieve_context(query: str, k: int = 3) -> str:
    """
    Given a query, generate its embedding, compare it against stored document embeddings,
    and return the concatenated content of the top k most similar documents.
    """
    documents = fetch_documents()
    query_emb = generate_query_embedding(query)
    if query_emb is None:
        return "No context available."
    
    query_arr = np.array(query_emb).reshape(1, -1)
    similarities = []
    
    for doc in documents:
        doc_emb = np.array(doc["embedding"]).reshape(1, -1)
        sim = cosine_similarity(query_arr, doc_emb)[0][0]
        similarities.append(sim)
    
    sorted_docs = sorted(zip(documents, similarities), key=lambda x: x[1], reverse=True)
    top_docs = [doc for doc, sim in sorted_docs[:k]]
    
    context = "\n\n".join(doc["content"] for doc in top_docs if doc.get("content"))
    return context

def rag_answer(query: str):
    """
    Uses retrieval augmented generation:
      1. Retrieves context documents based on the query.
      2. Passes the retrieved context and the query to the chat model.
    """
    context = retrieve_context(query, k=3)
    
    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that uses context from a knowledge base to answer questions."
        },
        {
            "role": "user",
            "content": f"Using the following context:\n\n{context}\n\nAnswer this question: {query}"
        }
    ]
    
    try:
        response = ollama.chat(
            model="hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:IQ4_XS",  # Change to your desired model
            messages=messages
        )
        return response
    except Exception as e:
        return f"Error during chat generation: {e}"

if __name__ == "__main__":
    # Example query
    query = "Tell me something about Trump."
    answer = rag_answer(query)
    print("RAG model answer:")
    print(answer)
