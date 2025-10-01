from sentence_transformers import SentenceTransformer, models
from supabase import create_client
from collections import defaultdict
import json
import ollama

VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
VITE_SUPABASE_URL="https://ormwiisftmytxsewkwvp.supabase.co"

supabase = create_client(
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY
)

def extract_keywords(text, num_keywords=10):
    prompt = f"""Extract {num_keywords} most important keywords from the following text. Return only a comma-separated list of keywords, nothing else.

Text: {text}

Keywords:"""

    response = ollama.chat(
        model="hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:IQ4_XS",
        messages=[{"role": "user", "content": prompt}]
    )
    
    if response and response.message.content:
        keywords_text = response.message.content.strip()
        keywords = [kw.strip() for kw in keywords_text.split(',')]
        return [(kw, 1.0) for kw in keywords[:num_keywords]]
    else:
        print("Error getting keywords from ollama")
        return []

def extract_keywords_from_db():
    
    words_to_remove = [
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if',
        'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 
        'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 
        'to', 'was', 'will', 'with', 'from', 'which', 'what', 'when', 'where', 
        'who', 'whom', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 
        'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 
        'so', 'than', 'too', 'very',

        'used', 'using', 'used', 'can', 'could', 'may', 'might', 'should', 
        'would', 'will', 'shall', 'does', 'do', 'did', 'done', 'make', 'made', 
        'data', 'analysis', 'study', 'research', 'result', 'results', 'based', 
        'approach', 'method', 'methods', 'model', 'models', 'algorithm', 
        'algorithms', 'system', 'systems', 'study', 'report', 'findings',

        'paper', 'article', 'journal', 'review', 'evidence', 'information', 
        'knowledge', 'science', 'scientific', 'experiment', 'experiments', 
        'conclusion', 'conclusions', 'finding', 'observed', 'based', 'analysis',

        'new', 'used', 'use', 'one', 'two', 'first', 'second', 'third', 
        'many', 'various', 'often', 'also', 'further', 'furthermore', 'although', 
        'however', 'therefore', 'thus', 'hence', 'mean', 'means', 'using', 
        'within', 'among', 'between'
    ]

    try:
        response = supabase.table('conversations').select('id', 'user_id', 'messages').execute()
        conversations = response.data
        if not conversations:
            print("No conversations found in database")
            return

        print(f"Found {len(conversations)} conversations")
        user_messages = defaultdict(str)
        
        for conversation in conversations:
            messages = json.loads(conversation.get('messages')) if isinstance(conversation.get('messages'), str) else conversation.get('messages', [])
            user_id = conversation.get('user_id')
            if not user_id:
                print(f"Skipping conversation - no user_id found")
                continue
                
            print(f"Processing conversation for user {user_id}")
            
            message_text = ""
            for message in messages:
                if isinstance(message, dict):
                    message_text += " " + message.get('text', '')
            user_messages[user_id] = message_text
            
        if not user_messages:
            print("No user messages found to process")
            return

        for user_id, text in user_messages.items():
            print(f"\nProcessing messages for user {user_id}")
            
            # Clean text
            text = text.split()
            text = [word.lower() for word in text if word.lower() not in words_to_remove]
            text = ' '.join(text)
            
            if not text.strip():
                print(f"No valid text to process for user {user_id} after cleaning")
                continue

            # Extract keywords
            keywords = extract_keywords(text)
            if not keywords:
                print(f"No keywords extracted for user {user_id}")
                continue
                
            keyword_list = [keyword for keyword, score in keywords]
            print(f"Extracted keywords for user {user_id}: {keyword_list}")

            try:
                result = supabase.table('user_preferences').update({
                    'keywords': keyword_list
                }).eq('user_id', user_id).execute()
                print(f"Successfully updated preferences for user {user_id}")
            except Exception as e:
                print(f"Error updating preferences for user {user_id}: {str(e)}")

    except Exception as e:
        print(f"Error in extract_keywords_from_db: {str(e)}")

def convert_keywords_to_embeddings():
    result = supabase.table("user_preferences").select("user_id, keywords").execute()
    for user in result.data:
        if user['keywords']:
            keywords_text = " ".join(user['keywords'])
            embedding_response = ollama.embed(
                model='mxbai-embed-large:latest',
                input=keywords_text
            )
            print(embedding_response)

            if hasattr(embedding_response, 'embeddings'):
                embedding = embedding_response.embeddings
                def format_vector(embedding):
                    vector_str = ','.join(map(str, embedding))
                    return f"[{vector_str}]"
                embeddings_vector = format_vector(embedding[0])  
                supabase.table("user_preferences").update({
                    "keywords_embeddings": embeddings_vector
                }).eq("user_id", user['user_id']).execute()
            else:
                print(f"Embeddings not found for user {user['user_id']}")

def convert_keywords_to_embeddings_one_user(user_id):
    result = supabase.table("user_preferences").select("keywords").eq("user_id", user_id).single().execute()
    if result.data and result.data['keywords']:
        keywords_text = " ".join(result.data['keywords'])
        embedding_response = ollama.embed(
            model='mxbai-embed-large:latest',
            input=keywords_text
        )
        print(embedding_response)

        if hasattr(embedding_response, 'embeddings'):
            embedding = embedding_response.embeddings
            def format_vector(embedding):
                vector_str = ','.join(map(str, embedding))
                return f"[{vector_str}]"
            embeddings_vector = format_vector(embedding[0])  
            supabase.table("user_preferences").update({
                "keywords_embeddings": embeddings_vector
            }).eq("user_id", user_id).execute()
        else:
            print(f"Embeddings not found for user {user_id}")



if __name__ == "__main__":
    print("Starting keyword extraction process...")
    extract_keywords_from_db()
    print("Finished keyword extraction process")
    convert_keywords_to_embeddings()        
    print("Finished converting keywords to embeddings")