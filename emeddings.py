import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import ollama
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase: Client = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

SIMILARITY_THRESHOLD = 0.9  # Adjust this threshold as needed

def fetch_articles():
    """Fetch articles from the 'Articles' table."""
    response = supabase.table('Articles').select('id, title, snippet').execute()
    return response.data

def generate_embedding(text: str):
    
    response = None
    try:
        response = ollama.embed(
            model="mxbai-embed-large",  # or your desired model
            input=text,
        )
        print(f"Got response of type: {type(response)}")
        # Try extracting the embedding from the response.
        if hasattr(response, "embedding"):
            embedding = response.embedding
        elif hasattr(response, "embeddings"):
            # Assume embeddings is a list; use the first element.
            embedding = response.embeddings[0]
        elif hasattr(response, "data"):
            data_val = response.data
            if isinstance(data_val, list) and len(data_val) > 0:
                embedding = data_val[0]
            else:
                embedding = data_val
        else:
            print(f"Unexpected response structure: {response}")
            return None

        # Ensure the embedding is a list of floats.
        if isinstance(embedding, list):
            embedding = [float(x) for x in embedding]
            return embedding
        else:
            print("Extracted embedding is not a list:", embedding)
            return None

    except Exception as e:
        print(f"Error generating embedding: {e}")
        print(f"Full response: {response}")
        return None


def check_similarity(new_embedding, existing_embeddings):
    
    if not existing_embeddings:
        return False

    new_emb = np.array(new_embedding).reshape(1, -1)
    existing_emb = np.array(existing_embeddings).reshape(len(existing_embeddings), -1)
    similarities = cosine_similarity(new_emb, existing_emb)[0]
    return any(sim > SIMILARITY_THRESHOLD for sim in similarities)

def process_articles():
    """
    Process articles by fetching them from the 'Articles' table,
    generating an embedding for each article (unless too similar to one already stored),
    and inserting the record (with its embedding) into the 'embeddings' table.
    """
    articles = fetch_articles()
    print(f"Processing {len(articles)} articles...")

    existing_response = supabase.table('embeddings').select('embedding').not_.is_('embedding', None).execute()
    existing_embeddings = [record['embedding'] for record in existing_response.data if record.get('embedding')]

    processed_count = 0
    failed_articles = []
    
    for article in articles:
        formatted_text = f"Title: {article['title']} Text: {article['snippet']}"
        try:
            new_embedding = generate_embedding(formatted_text)
            print(f"Generated embedding (length: {len(new_embedding)}) for article: {article['title']}")

            if check_similarity(new_embedding, existing_embeddings):
                print(f"Skipping similar article: {article['title']}")
                continue

            result = supabase.table('embeddings').insert({
                'content': formatted_text,
                'embedding': new_embedding
            }).execute()

            if result.data:
                processed_count += 1
                print(f"Successfully processed article: {article['title']}")
                existing_embeddings.append(new_embedding)
            else:
                print(f"Failed to insert article: {article['title']}\nSupabase response: {result}")
                failed_articles.append(article['title'])

        except Exception as e:
            print(f"Error processing article {article['title']}: {str(e)}")
            failed_articles.append(article['title'])

        time.sleep(0.5)

    print(f"Successfully processed {processed_count} new articles")
    if failed_articles:
        print(f"Failed to process {len(failed_articles)} articles: {', '.join(failed_articles)}")
        raise Exception("Some articles failed to process")

def update_embeddings():
    response = supabase.table('embeddings').select('id, content').is_('embedding', None).execute()
    records = response.data
    print(f"Found {len(records)} records without embeddings...")

    existing_response = supabase.table('embeddings').select('embedding').not_.is_('embedding', None).execute()
    existing_embeddings = [record['embedding'] for record in existing_response.data if record.get('embedding')]

    updated_count = 0
    failed_records = []
    
    for record in records:
        text = record.get('content')
        if not text:
            print(f"Skipping record {record['id']}: No content found")
            continue

        try:
            embedding = generate_embedding(text)
            
            if check_similarity(embedding, existing_embeddings):
                print(f"Skipping similar content for record {record['id']}: {text[:100]}...")
                continue

            result = supabase.table('embeddings').update({
                'embedding': embedding
            }).eq('id', record['id']).execute()

            if result.data:
                updated_count += 1
                print(f"Successfully updated embedding for record {record['id']}")
                existing_embeddings.append(embedding)
            else:
                print(f"Failed to update embedding for record {record['id']}")
                failed_records.append(record['id'])

        except Exception as e:
            print(f"Error updating record {record['id']}: {str(e)}")
            failed_records.append(record['id'])

        time.sleep(0.5)

    print(f"Successfully updated {updated_count} records with new embeddings")
    if failed_records:
        print(f"Failed to update {len(failed_records)} records: {', '.join(map(str, failed_records))}")
        raise Exception("Some records failed to update")

if __name__ == "__main__":
    try:
        process_articles()   # Insert articles with embeddings into the embeddings table
        update_embeddings()  # Update any records that are missing embeddings
        print("Article processing and embedding generation complete!")
    except Exception as e:
        print(f"Error during processing: {str(e)}")
        exit(1)