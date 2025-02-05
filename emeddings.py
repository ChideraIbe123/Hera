import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import ollama
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Optionally load from .env if you wish
load_dotenv()

# Either load from environment variables or hard-code them here.

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
    """
    Generate an embedding using the ollama embed model.
    Returns the embedding (as a list of floats) or None on failure.
    """
    response = None
    try:
        response = ollama.embed(
            model="mxbai-embed-large",  # Change this to your desired model
            input=text,
        )
        # Debug: print the raw embedding response (shortened for brevity)
        print(f"Embedding response for text (first 30 chars): {text[:30]}...:\n {response}")

        # Check the response structure and extract the embedding.
        # (Adjust these keys as needed if the response structure is different.)
        if isinstance(response, dict):
            if 'embedding' in response:
                embedding = response['embedding']
            elif 'embeddings' in response:
                embedding = response['embeddings'][0]
            elif 'data' in response and isinstance(response.get('data'), list):
                embedding = response['data'][0]
            else:
                print(f"Unexpected dict structure: {response}")
                return None
        elif isinstance(response, list):
            embedding = response[0]
        else:
            print(f"Unexpected response type: {type(response)}")
            return None

        # Convert all values to floats (if they are not already)
        if isinstance(embedding, list):
            embedding = [float(x) for x in embedding]
            return embedding
        else:
            print(f"Embedding is not a list: {embedding}")
            return None

    except Exception as e:
        print(f"Error generating embedding: {e}")
        print(f"Full response: {response}")
        return None

def check_similarity(new_embedding, existing_embeddings):
    """
    Check if the new_embedding is too similar to any of the existing embeddings.
    Returns True if any similarity exceeds the threshold.
    """
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

    # Get all existing embeddings (only non-null ones) from the embeddings table.
    existing_response = supabase.table('embeddings').select('embedding').not_.is_('embedding', None).execute()
    existing_embeddings = [record['embedding'] for record in existing_response.data if record.get('embedding')]

    processed_count = 0
    for article in articles:
        # Format text as "Title: {title} Text: {snippet}"
        formatted_text = f"Title: {article['title']} Text: {article['snippet']}"
        new_embedding = generate_embedding(formatted_text)
        if new_embedding is None:
            print(f"Failed to generate embedding for article: {article['title']}")
            continue

        # Debug: print embedding length and a snippet
        print(f"Generated embedding (length: {len(new_embedding)}) for article: {article['title']}")

        # Skip if the new embedding is too similar to an existing one
        if check_similarity(new_embedding, existing_embeddings):
            print(f"Skipping similar article: {article['title']}")
            continue

        try:
            # Insert both the formatted text and the embedding into the 'embeddings' table.
            result = supabase.table('embeddings').insert({
                'content': formatted_text,
                'embedding': new_embedding
            }).execute()

            if result.data:
                processed_count += 1
                print(f"Successfully processed article: {article['title']}")
            else:
                print(f"Failed to insert article: {article['title']}\nSupabase response: {result}")

            # Append the new embedding to the list for future similarity checks.
            existing_embeddings.append(new_embedding)

        except Exception as e:
            print(f"Error inserting article {article['title']}: {str(e)}")

        time.sleep(0.5)  # Rate limiting

    print(f"Successfully processed {processed_count} new articles")

def generate_embedding(text: str):
    """
    Generate an embedding using the ollama embed model.
    Returns the embedding (as a list of floats) or None on failure.
    """
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


if __name__ == "__main__":
    process_articles()   # Insert articles with embeddings into the embeddings table
    update_embeddings()  # Update any records that are missing embeddings
    print("Article processing and embedding generation complete!")
