import http.client
import json
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
import os
from supabase import create_client, Client

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

def get_high_res_image(page_url):
    print(f"Fetching high-res image for URL: {page_url}")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0", 
            "Accept": "text/html",
            "Accept-Encoding": "gzip, deflate"
        }
        response = requests.get(page_url, headers=headers, timeout=10)
        print("Successfully fetched page content")
        
        head_content = response.text.split('</head>')[0] + '</head>'
        soup = BeautifulSoup(head_content, 'html.parser')

        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            print("Found og:image")
            return og_image["content"]

        soup = BeautifulSoup(response.text, 'html.parser')
        print("Searching for alternative image sources...")
        
        img_with_srcset = soup.find("img", srcset=True)
        if img_with_srcset:
            print("Found image with srcset")
            return img_with_srcset["srcset"].split(",")[-1].split(" ")[0]

        first_img = soup.find("img", src=True)
        if first_img:
            print("Found first available image")
        else:
            print("No images found")
        return first_img["src"] if first_img else None

    except Exception as e:
        print(f"Error fetching image: {str(e)}")
        return None

def query_google(insights):
    print(f"\n--- Starting Google query for {len(insights)} insights ---")
    conn = http.client.HTTPSConnection("google.serper.dev")
    payload = json.dumps([
        {
            "q": insight,
            "num": 10,
            "tbs": "qdr:d"
        } for insight in insights
    ])
    print("insights: ", insights)
    headers = {
        'X-API-KEY': '39ef0015c9282897135dcf73ee553d994cfb895d',
        'Content-Type': 'application/json'
    }

    print("Sending request to Google Serper API...")
    conn.request("POST", "/news", payload, headers)
    res = conn.getresponse()
    data = res.read()
    parsed_data = json.loads(data.decode("utf-8"))
    print("Received response from Google Serper API")

    titles = []
    links = []
    snippets = []
    dates = []
    sources = []
    query_terms = []
    image_urls = []

    print(f"Processing {len(parsed_data)} query results...")
    for i, query_result in enumerate(parsed_data):
        print(f"Processing results for query: {insights[i]}")
        for article in query_result.get('news', []):
            titles.append(article.get('title', ''))
            links.append(article.get('link', ''))
            snippets.append(article.get('snippet', ''))
            dates.append(article.get('date', ''))
            sources.append(article.get('source', ''))
            query_terms.append(insights[i])
            image_urls.append(get_high_res_image(article.get('link', '')))

    df = pd.DataFrame({
        'title': titles,
        'link': links,
        'snippet': snippets,
        'time_scraped': dates,
        'query_term': query_terms,
        'image_url': image_urls,
        'source': sources
    })

    print(f"Created DataFrame with {len(df)} articles")
    print("Inserting data into Supabase...")
    df.drop_duplicates(subset=["title"], keep="first", inplace=True)
    try:
        supabase.table("Articles").upsert(
            df.to_dict(orient="records"),
            on_conflict="title"
        ).execute()
        print("Data successfully inserted into Supabase")
    except Exception as e:
        print(f"Error inserting data: {str(e)}")
        raise e

def all_users_insights():
    print("\n=== Starting all_users_insights() ===")
    response = supabase.table("user_preferences").select("user_id, keywords").execute()
    user_preferences = response.data
    
    # Create a set to store unique keywords
    unique_keywords = set()
    
    # Collect all unique keywords from all users
    for user_pref in user_preferences:
        keywords = user_pref['keywords']
        if keywords:
            unique_keywords.update(keywords)
    
    # Convert set back to list and query once for all unique keywords
    if unique_keywords:
        print(f"\nProcessing {len(unique_keywords)} unique keywords: {list(unique_keywords)}")
        query_google(list(unique_keywords))
    
    print("=== Completed all_users_insights() ===")

if __name__ == "__main__":
    all_users_insights()
