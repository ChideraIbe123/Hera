from supabase import create_client
import ollama
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

def get_embeddings():
    result = supabase.table("embeddings").select("id, embedding, article_id").execute()
    return result.data

def add_article_to_user():
    result = supabase.table("user_preferences").select("user_id, keywords_embeddings").execute()
    for user in result.data:
        if not user['keywords_embeddings']:
            continue
        embedding_str = user['keywords_embeddings'].strip('[]')
        embedding_values = [float(x) for x in embedding_str.split(',')]
        user_embedding = np.array(embedding_values).reshape(1, -1)
        
        embeddings_data = get_embeddings()
        article_similarities = []
        
        for article_embedding in embeddings_data:
            if not article_embedding['embedding']:
                continue
                
            article_str = article_embedding['embedding'].strip('[]')
            article_values = [float(x) for x in article_str.split(',')]
            emb = np.array(article_values).reshape(1, -1)
            
            similarity = cosine_similarity(user_embedding, emb)[0][0]
            article_similarities.append({
                'article_id': article_embedding['article_id'],
                'similarity': similarity
            })
        
        ranked_articles = sorted(article_similarities, key=lambda x: x['similarity'], reverse=True)
        ranked_article_ids = [article['article_id'] for article in ranked_articles]
        supabase.table("user_preferences").update({
            'ranked_articles': ranked_article_ids
        }).eq('user_id', user['user_id']).execute()

def add_article_to_one_user(user_id):
    result = supabase.table("user_preferences").select("keywords_embeddings").eq("user_id", user_id).single().execute()
    if not result.data or not result.data['keywords_embeddings']:
        return
        
    embedding_str = result.data['keywords_embeddings'].strip('[]')
    embedding_values = [float(x) for x in embedding_str.split(',')]
    user_embedding = np.array(embedding_values).reshape(1, -1)
    
    embeddings_data = get_embeddings()
    article_similarities = []
    
    for article_embedding in embeddings_data:
        if not article_embedding['embedding']:
            continue
            
        article_str = article_embedding['embedding'].strip('[]')
        article_values = [float(x) for x in article_str.split(',')]
        emb = np.array(article_values).reshape(1, -1)
        
        similarity = cosine_similarity(user_embedding, emb)[0][0]
        article_similarities.append({
            'article_id': article_embedding['article_id'],
            'similarity': similarity
        })
    
    ranked_articles = sorted(article_similarities, key=lambda x: x['similarity'], reverse=True)
    ranked_article_ids = [article['article_id'] for article in ranked_articles]
    supabase.table("user_preferences").update({
        'ranked_articles': ranked_article_ids
    }).eq('user_id', user_id).execute()


if __name__ == "__main__":
   add_article_to_user()