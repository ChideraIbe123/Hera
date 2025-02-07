from flask import Flask, request, jsonify
import ollama
from typing import Dict, List
from flask_cors import CORS
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from insights_llm import convert_keywords_to_embeddings_one_user
from algo import add_article_to_one_user

load_dotenv()

app = Flask(__name__)
CORS(app)


VITE_SUPABASE_ANON_KEY=os.getenv("VITE_SUPABASE_ANON_KEY")
VITE_SUPABASE_URL=os.getenv("VITE_SUPABASE_URL")

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

@app.route("/api/insights", methods=["POST"])
def insights():
    output = []
    response = supabase.table("Articles").select("query_term").execute()
    for term in response.data:
        if term.get("query_term"): 
            output.append(term.get("query_term"))
    unique_terms = list(set(output))
    return jsonify(unique_terms)
    



@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
    
        
        message = data.get("message")
        conversation_id = data.get("conversation_id")
        previous_messages = data.get("messages", [])
        

        # Get relevant context from Supabase
        context = retrieve_context(message)
        
        chat_messages = format_messages_for_model(previous_messages)
        
        system_prompt = {
            'role': 'system',
            'content': 'You are a helpful AI assistant named Hera. You aim to provide clear, accurate and helpful responses while being friendly and conversational. Use the provided context to give accurate answers.'
        }
        chat_messages.insert(0, system_prompt)
        
        chat_messages.append({
            'role': 'user',
            'content': f"Using this context:\n\n{context}\n\nAnswer this: {message.strip()}"
        })

        print("\nConversation Context:")
        for msg in chat_messages:
            print(f"{msg['role']}: {msg['content']}")
        print()

        response = ollama.chat(
            model='hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF',
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
    
@app.route("/api/new_user", methods=["POST"])
def convert_keywords_for_new_user():
    data = request.get_json()
    user_id = data.get('user_id')
    convert_keywords_to_embeddings_one_user(user_id)
    add_article_to_one_user(user_id)
    return jsonify({"message": "Keywords converted to embeddings"})
    
if __name__ == "__main__":
    app.run(debug=True)