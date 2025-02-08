import os
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import ollama
from supabase import create_client, Client
from google_querying import make_list
from insights_llm import convert_keywords_to_embeddings_one_user
from algo import add_article_to_one_user


VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase: Client = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

if __name__ == "__main__":
    convert_keywords_to_embeddings_one_user("386a5a2c-9c14-462b-bc77-b6f9fe2f33fc")
    add_article_to_one_user("386a5a2c-9c14-462b-bc77-b6f9fe2f33fc")