import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import ollama

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


def fetch_data():
    response = supabase.table('your_table').select('id, content_column').execute()
    return response.data

def generate_embedding(text: str):
    try:
        response = ollama.model.embeddings(
            model="nomic-embed-text",
            input=text,
        )
        return response['data'][0]['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def update_embeddings():
    records = fetch_data()
    
    for record in records:
        content = record.get('content_column')
        if not content:
            continue
            
        embedding = generate_embedding(content)
        if not embedding:
            continue
            
        supabase.table('your_table').update(
            {'embedding_column': embedding}
        ).eq('id', record['id']).execute()
        
        time.sleep(0.5) 

def queruy_rag():
    ollama.model.chat(
        model="deepseek-r1:1.5b",
        prompt="With this contenxt {}, answer the following question:",
        stream=True
    )

if __name__ == "__main__":
    update_embeddings()
    print("Embedding generation complete!")