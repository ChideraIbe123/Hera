from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import re
import requests
import time
from supabase import create_client, Client

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_TOKEN = os.getenv("API_TOKEN")
API_URL = os.getenv("API_URL")

app = Flask(__name__)
CORS(app)



supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MAX_CONVERSATIONS_PER_USER = 5  



headers = {"Authorization": f"Bearer {API_TOKEN}"}

def create_new_conversation(user_id: str, title: str, initial_context: str) -> int:
    """
    Inserts a new row in `conversations`, letting the DB auto-increment `id`.
    Returns that newly created ID (int).
    """
    res = supabase.table("conversations").insert({
        "user_id": user_id,         
        "title": title,             
        "content": f"{initial_context}\n"
    }).execute()
    new_id = res.data[0]["id"]
    return new_id

def load_conversation_memory(convo_id: int) -> str:
    """
    Loads the 'content' field for the given conversation's ID.
    Returns an empty string if none found.
    """
    response = supabase.table("conversations") \
        .select("content") \
        .eq("id", convo_id) \
        .execute()
    rows = response.data
    if rows and len(rows) > 0:
        return rows[0].get("content", "")
    return ""

def append_turn_to_db(convo_id: int, user_id: str, user_text: str, assistant_text: str):
    """
    Append a new Q&A turn to the existing content.
    """
    existing_content = load_conversation_memory(convo_id)
    new_content = existing_content + f"User: {user_text}\nAssistant: {assistant_text}\n\n"
    supabase.table("conversations") \
        .update({"content": new_content}) \
        .eq("id", convo_id) \
        .eq("user_id", user_id) \
        .execute()

def list_user_conversations(user_id: str):
    """
    Returns a list of conversation metadata for the user.
    Example: [ { "id": 1, "title": "My first convo" }, ... ]
    """
    response = supabase.table("conversations") \
        .select("id,title") \
        .eq("user_id", user_id) \
        .order("id", desc=True) \
        .execute()

    rows = response.data
    if rows:
        return rows
    return []

def delete_conversation_db(convo_id: int, user_id: str):
    """
    Deletes the conversation with the given ID IF it belongs to user_id.
    """
    supabase.table("conversations") \
        .delete() \
        .eq("id", convo_id) \
        .eq("user_id", user_id) \
        .execute()


@app.route("/")
def home():
    return jsonify({"message": "Hello, Flask is running on Supabase with auto-increment IDs and a 'title' column!"})

@app.route("/chat", methods=["POST"])
def chat():
    """
    Expects JSON:
      {
        "message": "User's query",
        "conversation_id": optional integer,
        "user_id": "UUID from supabase.auth"
      }
    Returns JSON:
      {
        "conversation_id": int,
        "response": "Assistant's answer",
        "title": optional, if newly created
      }
    """
    data = request.json
    user_message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")  
    user_id = data.get("user_id")

    if not user_message or not user_id:
        return jsonify({"error": "Message and user ID are required"}), 400

    if not conversation_id:
        user_convos = list_user_conversations(user_id)
        if len(user_convos) >= MAX_CONVERSATIONS_PER_USER:
            return jsonify({"error": "Maximum number of conversations reached"}), 403

        title_for_this_convo = user_message[:50]

        initial_context = "The first president of the United States was George Washington."
        conversation_id = create_new_conversation(user_id, title_for_this_convo, initial_context)
        conversation_history = initial_context
    else:
        try:
            conversation_id = int(conversation_id)
        except ValueError:
            return jsonify({"error": "conversation_id must be an integer"}), 400

        conversation_history = load_conversation_memory(conversation_id)

    try:
        print(f"Sending request to API with context: {conversation_history} and question: {user_message}")
        response = requests.post(API_URL, headers=headers, json={
            "inputs": {
                "context": conversation_history,
                "question": user_message
            }
        })
        print(f"API response status: {response.status_code}, response: {response.text}")
        result = response.json()

        if response.status_code != 200:
            return jsonify({"error": "Failed to generate response", "details": result}), response.status_code

        if "error" in result:
            if "loading" in result["error"]:
                print("Model is loading, retrying in 20 seconds...")
                time.sleep(20)
                return chat()  # Retry
            else:
                return jsonify({"error": result["error"]}), 500

        assistant_text = result.get("answer", "No answer found.")
        append_turn_to_db(conversation_id, user_id, user_message, assistant_text)

        return jsonify({
            "conversation_id": conversation_id,
            "response": assistant_text
        })

    except Exception as e:
        print("Error in API request:", str(e))
        return jsonify({"error": "Failed to generate response", "details": str(e)}), 500


@app.route("/conversations", methods=["GET"])
def list_conversations_route():
    """
    GET /conversations?user_id=<uuid>
    Returns an array of objects: [{ "id": int, "title": "..." }, ...]
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    convos = list_user_conversations(user_id)
    return jsonify(convos), 200

@app.route("/conversations/<convo_id>", methods=["GET"])
def get_conversation_route(convo_id):
    """
    GET /conversations/<id>?user_id=<uuid>
    Returns:
      {
        "conversation_id": int,
        "title": "...",
        "content": "..."
      }
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        convo_id = int(convo_id)
    except ValueError:
        return jsonify({"error": "Conversation ID must be an integer"}), 400

    # Query the conversation row
    response = supabase.table("conversations") \
        .select("id,title,content") \
        .eq("id", convo_id) \
        .eq("user_id", user_id) \
        .execute()

    rows = response.data
    if not rows:
        return jsonify({"error": "Conversation not found"}), 404

    row = rows[0]
    return jsonify({
        "conversation_id": row["id"],
        "title": row["title"],
        "content": row["content"]
    }), 200

@app.route("/conversations/<convo_id>", methods=["DELETE"])
def delete_conversation_route(convo_id):
    """
    DELETE /conversations/<id>?user_id=<uuid>
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        convo_id = int(convo_id)
    except ValueError:
        return jsonify({"error": "Conversation ID must be an integer"}), 400

    delete_conversation_db(convo_id, user_id)
    return jsonify({"message": f"Conversation '{convo_id}' deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)