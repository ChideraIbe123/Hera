import subprocess
import flask 
from flask_apscheduler import APScheduler
import os

app = flask.Flask(__name__)

scheduler = APScheduler()

def run_scripts():
    # Run each script and wait for completion before continuing
    subprocess.run(["python", "./insights_llm.py"], check=True)
    subprocess.run(["python", "./google_querying.py"], check=True)
    subprocess.run(["python", "./general_labeling.py"], check=True)
    subprocess.run(["python", "./emeddings.py"], check=True)
    subprocess.run(["python", "./algo.py"], check=True)

@app.route("/")
def index():
    return "Hello, World!"

if __name__ == "__main__":
    # scheduler.add_job(run_scripts, 'interval', minutes=5)
    #scheduler.start()
    # app.run(debug=True)
    run_scripts()
