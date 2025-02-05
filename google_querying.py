import http.client
import json
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
import os
from supabase import create_client, Client

insights = ["tariffs", "deepseek", "luka doncic", "stock market", "apple"]

def get_insights():
    return insights 

def get_high_res_image(page_url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html",
            "Accept-Encoding": "gzip, deflate"
        }
        response = requests.get(page_url, headers=headers)
        
        head_content = response.text.split('</head>')[0] + '</head>'
        soup = BeautifulSoup(head_content, 'html.parser')

        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image["content"]

        soup = BeautifulSoup(response.text, 'html.parser')
        
        img_with_srcset = soup.find("img", srcset=True)
        if img_with_srcset:
            return img_with_srcset["srcset"].split(",")[-1].split(" ")[0]

        first_img = soup.find("img", src=True)
        return first_img["src"] if first_img else None

    except Exception:
        return None

def query_google():
    conn = http.client.HTTPSConnection("google.serper.dev")
    payload = json.dumps([
        {
            "q": insight,
            "num": 10,
            "tbs": "qdr:d"
        } for insight in insights
    ])
    headers = {
        'X-API-KEY': '39ef0015c9282897135dcf73ee553d994cfb895d',
        'Content-Type': 'application/json'
    }

    conn.request("POST", "/news", payload, headers)
    res = conn.getresponse()
    data = res.read()
    parsed_data = json.loads(data.decode("utf-8"))

    titles = []
    links = []
    snippets = []
    dates = []
    sources = []
    query_terms = []
    image_urls = []

    for i, query_result in enumerate(parsed_data):
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

    load_dotenv()
    supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    supabase.table("Articles").insert(df.to_dict(orient="records")).execute()

if __name__ == "__main__":
    query_google()
