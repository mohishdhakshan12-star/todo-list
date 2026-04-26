let tasks = [];
let currentFilter = "all";

// Load tasks on page load
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();

  document.getElementById("task-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
});

async function loadTasks() {
  try {
    const res = await fetch("/api/tasks");
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    showToast("Failed to load tasks");
  }
}

async function addTask() {
  const input = document.getElementById("task-input");
  const select = document.getElementById("category-select");
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, category: select.value })
    });
    const task = await res.json();
    tasks.unshift(task);
    input.value = "";
    renderTasks();
    showToast("✦ Task added!");
  } catch (err) {
    showToast("Error adding task");
  }
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed })
    });
    const updated = await res.json();
    tasks = tasks.map(t => t.id === id ? updated : t);
    renderTasks();
  } catch (err) {
    showToast("Error updating task");
  }
}

async function deleteTask(id) {
  try {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    showToast("Task removed");
  } catch (err) {
    showToast("Error deleting task");
  }
}

async function clearCompleted() {
  const hasCompleted = tasks.some(t => t.completed);
  if (!hasCompleted) { showToast("No completed tasks"); return; }

  try {
    await fetch("/api/tasks/clear-completed", { method: "DELETE" });
    tasks = tasks.filter(t => !t.completed);
    renderTasks();
    showToast("Completed tasks cleared");
  } catch (err) {
    showToast("Error clearing tasks");
  }
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");

  const filtered = tasks.filter(t => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  // Update stats
  const remaining = tasks.filter(t => !t.completed).length;
  document.getElementById("stats-text").textContent =
    `${remaining} task${remaining !== 1 ? "s" : ""} remaining`;

  // Clear existing task items (not empty state)
  list.querySelectorAll(".task-item").forEach(el => el.remove());

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  filtered.forEach(task => {
    const item = document.createElement("div");
    item.className = `task-item${task.completed ? " done" : ""}`;
    item.innerHTML = `
      <div class="task-checkbox" onclick="toggleTask(${task.id})">
        ${task.completed ? "✓" : ""}
      </div>
      <div class="task-body">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-category">${task.category}</div>
      </div>
      <button class="task-delete" onclick="deleteTask(${task.id})">✕</button>
    `;
    list.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

let toastTimeout;
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}