import requests
from bs4 import BeautifulSoup

def get_high_res_image(page_url):
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(page_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Try to find OpenGraph image
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image["content"]:
        return og_image["content"]

    # Try to find images with srcset (higher resolution versions)
    img_tags = soup.find_all("img")
    for img in img_tags:
        if "srcset" in img.attrs:
            return img["srcset"].split(",")[-1].split(" ")[0]  # Get highest res

    # Fallback: Return the first image found
    return img_tags[0]["src"] if img_tags else None

# Example usage
page_url = "https://www.fox5atlanta.com/news/pilot-american-airlines-jet-crashed-near-washington-dc-had-georgia-ties"
high_res_image = get_high_res_image(page_url)
print(high_res_image)
