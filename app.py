from flask import Flask, render_template, request, jsonify
import json
import os
import time

app = Flask(__name__)

# Always save tasks.json next to app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TASKS_FILE = os.path.join(BASE_DIR, "tasks.json")

def load_tasks():
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, "r") as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    return []

def save_tasks(tasks):
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = load_tasks()
    return jsonify(tasks)

@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received"}), 400
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Task text is required"}), 400

    tasks = load_tasks()
    task = {
        "id": int(time.time() * 1000),
        "text": text,
        "completed": False,
        "category": data.get("category", "General")
    }
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201

@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            if "completed" in data:
                task["completed"] = data["completed"]
            if "text" in data:
                task["text"] = data["text"]
            if "category" in data:
                task["category"] = data["category"]
            save_tasks(tasks)
            return jsonify(task)

    return jsonify({"error": "Task not found"}), 404

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = load_tasks()
    updated = [t for t in tasks if t["id"] != task_id]

    if len(updated) == len(tasks):
        return jsonify({"error": "Task not found"}), 404

    save_tasks(updated)
    return jsonify({"message": "Task deleted"})

@app.route("/api/tasks/clear-completed", methods=["DELETE"])
def clear_completed():
    tasks = load_tasks()
    updated = [t for t in tasks if not t["completed"]]
    save_tasks(updated)
    return jsonify({"message": "Cleared completed tasks"})

if __name__ == "__main__":
    app.run(debug=True)