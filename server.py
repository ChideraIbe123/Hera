from flask import Flask, request, jsonify
import ollama
from typing import Dict, List
from flask_cors import CORS
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase: Client = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

def format_messages_for_model(messages: List[Dict]) -> List[Dict]:
    """Convert frontend message format to model format"""
    return [
        {
            'role': 'assistant' if msg['isBot'] else 'user',
            'content': msg['text']
        }
        for msg in messages
    ]

def fetch_documents():
    """
    Fetch documents and their embeddings from the 'embeddings' table.
    """
    response = supabase.table('embeddings').select('content, embedding').execute()
    documents = []
    for record in response.data:
        content = record.get('content')
        emb = record.get('embedding')
        if isinstance(emb, str):
            try:
                emb = json.loads(emb)
            except json.JSONDecodeError:
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
    Get relevant context from Supabase based on query similarity.
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

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No request data provided"}), 400
        
        message = data.get("message")
        conversation_id = data.get("conversation_id")
        previous_messages = data.get("messages", [])
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        if conversation_id is None:
            return jsonify({"error": "No conversation_id provided"}), 400

        # Get relevant context from Supabase
        context = retrieve_context(message)
        
        chat_messages = format_messages_for_model(previous_messages)
        
        system_prompt = {
            'role': 'system',
            'content': 'You are a helpful AI assistant named Hera. You aim to provide clear, accurate and helpful responses while being friendly and conversational. Use the provided context to give accurate answers.'
        }
        chat_messages.insert(0, system_prompt)
        
        # Add context and user message
        chat_messages.append({
            'role': 'user',
            'content': f"Using this context:\n\n{context}\n\nAnswer this: {message.strip()}"
        })

        print("\nConversation Context:")
        for msg in chat_messages:
            print(f"{msg['role']}: {msg['content']}")
        print()

        response = ollama.chat(
            model='hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:IQ4_XS',
            messages=chat_messages
        )
        
        response_text = response['message']['content'].strip()
        
        return jsonify({
            "conversation_id": conversation_id,
            "response": response_text
        })

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": "An internal error occurred",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)