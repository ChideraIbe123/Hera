import subprocess
import flask 
from flask_apscheduler import APScheduler
import os

app = flask.Flask(__name__)

scheduler = APScheduler()

def run_scripts():
    subprocess.run(["python", "./google_querying.py"])
    subprocess.run(["python", "./general_labeling.py"])
    subprocess.run(["python", "./embeddings.py"])
    subprocess.run(["python", "./insights.py"])

@app.route("/")
def index():
    return "Hello, World!"

if __name__ == "__main__":
    scheduler.add_job(run_scripts, 'interval', minutes=5)
    scheduler.start()
    app.run(debug=True)




