from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np
from dotenv import load_dotenv
import os
from supabase import create_client, Client

def main():
    VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
    VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

    supabase: Client = create_client(
        VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY
    )

    response = supabase.table("Articles").select("title").execute()

    titles = [article['title'] for article in response.data]

    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(titles)

    num_clusters = 6
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X)
    clusters = kmeans.labels_

    order_centroids = kmeans.cluster_centers_.argsort()[:, ::-1]
    terms = vectorizer.get_feature_names_out()

    print("Automatically generated topic labels:")
    for i in range(num_clusters):
        top_terms = [terms[ind] for ind in order_centroids[i, :2]]  
        label = " ".join(top_terms)
        





        cluster_titles = np.array(titles)[clusters == i]
        print(" Titles in this cluster:")
        for title in cluster_titles:
            try:
                article_response = supabase.table("Articles").select("id").eq("title", title).execute()
                if article_response.data:
                    article_id = article_response.data[0]['id']
                    # Update the grouping for this specific article
                    supabase.table("Articles").update({"grouping": label}).eq("id", article_id).execute()
            except Exception as e:
                print(f"Error updating grouping for title '{title}': {str(e)}")
            print(f"  - {title}")
        print()

if __name__ == "__main__":
    main()
