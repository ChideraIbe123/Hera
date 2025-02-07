import supabase
import os
from dotenv import load_dotenv
supabase = supabase.create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

load_dotenv()

keywords = supabase.table("user_preferences").select("keywords").execute()

print(len(keywords))
