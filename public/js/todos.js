// ═══════════════════════════════════════════════════
//  Todos Module — Premium Mobile-First Task Manager
// ═══════════════════════════════════════════════════

let todos = [];
let activeFilter = 'All';
let activeCategoryFilter = 'All';

const PRIORITY_CONFIG = {
    High: { color: '#ef4444', icon: 'fa-arrow-up', label: 'High' },
    Medium: { color: '#f59e0b', icon: 'fa-minus', label: 'Medium' },
    Low: { color: '#10b981', icon: 'fa-arrow-down', label: 'Low' }
};

const CATEGORY_CONFIG = {
    'Job Prep': { color: '#3b82f6', icon: 'fa-briefcase' },
    'Interview': { color: '#8b5cf6', icon: 'fa-comments' },
    'Networking': { color: '#06b6d4', icon: 'fa-users' },
    'Learning': { color: '#f59e0b', icon: 'fa-book-open' },
    'Personal': { color: '#ec4899', icon: 'fa-user' },
    'Other': { color: '#71717a', icon: 'fa-tag' }
};

async function fetchTodos() {
    try {
        const res = await fetch('/api/todos', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) return;
        todos = await res.json();
        renderTodos();
        updateTodoBadge();
        checkDueNotifications();
    } catch (e) { console.error('Todos fetch error', e); }
}

function updateTodoBadge() {
    const pending = todos.filter(t => !t.completed).length;
    ['todo-badge', 'm-todo-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = pending; el.style.display = pending > 0 ? 'flex' : 'none'; }
    });
}

function renderTodos() {
    const container = document.getElementById('todo-list');
    if (!container) return;

    let filtered = todos.filter(t => {
        const priorityMatch = activeFilter === 'All' || t.priority === activeFilter;
        const catMatch = activeCategoryFilter === 'All' || t.category === activeCategoryFilter;
        return priorityMatch && catMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="todo-empty">
                <div class="todo-empty-icon-wrap" style="width: 100px; height: 100px; font-size: 2.5rem; background: var(--surface); border-radius: 32px; border: 2px solid var(--border);">
                    <i class="fas fa-tasks" style="opacity: 0.8; color: var(--primary);"></i>
                </div>
                <div class="todo-empty-title" style="font-size: 1.5rem; margin-top: 1.5rem;">Nothing on the radar</div>
                <div class="todo-empty-sub" style="font-size: 1rem; max-width: 300px; color: var(--text-secondary);">Your task list is empty. Take a moment to plan your next big move.</div>
            </div>`;
        return;
    }

    filtered.sort((a, b) => {
        if (b.pinned !== a.pinned) return b.pinned - a.pinned;
        if (b.completed !== a.completed) return a.completed - b.completed;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    container.innerHTML = filtered.map(t => renderTodoCard(t)).join('');
}

function renderTodoCard(t) {
    const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.Medium;
    const cat = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.Other;

    const now = new Date();
    const overdue = t.dueDate && !t.completed && new Date(t.dueDate) < now;
    const dueLabel = t.dueDate ? formatDueDate(new Date(t.dueDate)) : '';

    const subtaskCount = t.subtasks?.length || 0;
    const doneCount = t.subtasks?.filter(s => s.done).length || 0;
    const subtaskPct = subtaskCount > 0 ? Math.round((doneCount / subtaskCount) * 100) : -1;

    return `
    <div class="todo-card ${t.completed ? 'done' : ''} ${t.pinned ? 'pinned' : ''} priority-${t.priority.toLowerCase()}" id="tc-${t._id}" onclick="viewTodo('${t._id}')">
        <div class="todo-card-accent" style="background:${p.color}"></div>
        <div class="todo-card-inner">
            <div class="todo-card-top">
                <button class="todo-check-btn ${t.completed ? 'checked' : ''}"
                    onclick="event.stopPropagation(); toggleTodoDone('${t._id}')"
                    style="--chk-color:${p.color}">
                    <i class="fas fa-check"></i>
                </button>
                <div class="todo-content">
                    <div class="todo-title ${t.completed ? 'strikethrough' : ''}">${t.title}</div>
                    <div class="todo-meta">
                        <span class="todo-cat-chip" style="--cat-color:${cat.color}">
                            <i class="fas ${cat.icon}"></i> ${t.category}
                        </span>
                        <span class="todo-priority-chip" style="color:${p.color}">
                            <i class="fas ${p.icon}"></i> ${p.label}
                        </span>
                        ${dueLabel ? `<span class="todo-due-chip ${overdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar-day"></i> ${dueLabel}
                        </span>` : ''}
                    </div>
                </div>
                <div class="todo-card-side">
                    <button class="todo-pin-btn ${t.pinned ? 'active' : ''}"
                        onclick="event.stopPropagation(); togglePin('${t._id}')"
                        title="${t.pinned ? 'Unpin' : 'Pin'}">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                </div>
            </div>
            ${subtaskPct >= 0 ? `
            <div class="todo-subtask-bar">
                <div class="todo-subtask-track">
                    <div class="todo-subtask-fill" style="width:${subtaskPct}%; background:${p.color}"></div>
                </div>
                <span class="todo-subtask-label">${doneCount}/${subtaskCount}</span>
            </div>` : ''}
        </div>
    </div>`;
}

function formatDueDate(date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const d = new Date(date); d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (d < today) return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

window.toggleTodoDone = async function (id) {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    const card = document.getElementById(`tc-${id}`);
    if (card) card.style.opacity = '0.5';
    try {
        const res = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ completed: !todo.completed })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.completed && typeof window.motivateUser === 'function') {
                window.motivateUser('planDone');
            }
            if (!todo.completed) {
                delete NOTIFIED_KEYS[`warn30_${id}`];
                delete NOTIFIED_KEYS[`overdue_${id}`];
                saveNotifiedKeys();
            }
            await fetchTodos();
            showTodoToast(todo.completed ? 'Task reopened' : 'Task complete');
            if (typeof window.fetchTimetables === 'function') {
                window.fetchTimetables();
            }
        }
    } catch (e) { if (card) card.style.opacity = '1'; }
}

window.togglePin = async function (id) {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    try {
        const res = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ pinned: !todo.pinned })
        });
        if (res.ok) { await fetchTodos(); showTodoToast(todo.pinned ? 'Unpin' : 'Pinned'); }
    } catch (e) { }
}

window.viewTodo = function (id) {
    const todo = todos.find(t => t._id === id);
    if (todo) openTodoModal(todo);
}

window.openTodoModal = function (todo = null) {
    const modal = document.getElementById('todo-modal');
    const titleEl = document.getElementById('todo-modal-title');
    const form = document.getElementById('todo-form');

    form.reset();
    document.getElementById('todo-id').value = '';
    document.getElementById('todo-subtasks-list').innerHTML = '';

    if (todo) {
        titleEl.textContent = 'Edit Task';
        document.getElementById('todo-id').value = todo._id;
        document.getElementById('todo-title-inp').value = todo.title;
        document.getElementById('todo-desc-inp').value = todo.description || '';
        document.getElementById('todo-category-inp').value = todo.category;
        document.getElementById('todo-priority-inp').value = todo.priority;
        document.getElementById('todo-due-inp').value = todo.dueDate
            ? new Date(todo.dueDate).toISOString().split('T')[0] : '';
        (todo.subtasks || []).forEach(s => addSubtaskRow(s.text, s.done));
    } else {
        titleEl.textContent = 'New Task';
        document.getElementById('todo-priority-inp').value = 'Medium';
        document.getElementById('todo-category-inp').value = 'Other';
    }

    const delBtn = document.getElementById('todo-del-trigger');
    if (delBtn) delBtn.style.display = todo ? 'flex' : 'none';
    modal.classList.add('active');
    setTimeout(() => document.getElementById('todo-title-inp').focus(), 120);
}

function addSubtaskRow(text = '', done = false) {
    const list = document.getElementById('todo-subtasks-list');
    const div = document.createElement('div');
    div.className = 'subtask-row';
    div.dataset.done = done;
    div.innerHTML = `
        <button type="button" class="subtask-check ${done ? 'done' : ''}" onclick="toggleSubtaskCheck(this)">
            <i class="fas fa-check"></i>
        </button>
        <input type="text" class="subtask-inp" value="${text}" placeholder="Subtask..." />
        <button type="button" class="subtask-del" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>`;
    list.appendChild(div);
}

window.toggleSubtaskCheck = function (btn) {
    btn.classList.toggle('done');
    btn.parentElement.dataset.done = btn.classList.contains('done');
}

window.addSubtask = function () { addSubtaskRow(); }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.todo-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    document.querySelectorAll('.todo-cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.todo-cat-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategoryFilter = btn.dataset.cat;
            renderTodos();
        });
    });

    document.querySelectorAll('.close-todo-btn').forEach(b => b.addEventListener('click', () => {
        document.getElementById('todo-modal').classList.remove('active');
    }));

    const form = document.getElementById('todo-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('todo-id').value;

            const subtasks = [...document.querySelectorAll('#todo-subtasks-list .subtask-row')].map(row => ({
                text: row.querySelector('.subtask-inp').value.trim(),
                done: row.dataset.done === 'true'
            })).filter(s => s.text);

            const data = {
                title: document.getElementById('todo-title-inp').value.trim(),
                description: document.getElementById('todo-desc-inp').value.trim(),
                category: document.getElementById('todo-category-inp').value,
                priority: document.getElementById('todo-priority-inp').value,
                dueDate: document.getElementById('todo-due-inp').value || null,
                subtasks
            };

            if (!data.title) return;

            const btn = form.querySelector('[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/todos/${id}` : '/api/todos';
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    document.getElementById('todo-modal').classList.remove('active');
                    showTodoToast(id ? 'Task updated' : 'Task created');
                    if (!id && typeof window.motivateUser === 'function') {
                        window.motivateUser('taskCreated');
                    }
                    await fetchTodos();
                    if (typeof window.fetchTimetables === 'function') {
                        window.fetchTimetables();
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    showTodoToast('Error: ' + (errData.message || res.statusText));
                }
            } catch (err) {
                console.error(err);
                showTodoToast('Network error');
            }

            btn.innerHTML = 'Save Task';
            btn.disabled = false;
        });
    }
});

window.deleteTodo = async function (id) {
    if (!confirm('Remove this task?')) return;
    try {
        const res = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            document.getElementById('todo-modal').classList.remove('active');
            await fetchTodos();
            showTodoToast('Task removed');
        }
    } catch (e) { }
}

function showTodoToast(msg) {
    const t = document.getElementById('toast');
    if (t) { t.innerHTML = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
}

// ─── Date Shortcut Buttons ────────────────────────────────────────────────────
window.setDueDate = function (when) {
    const inp = document.getElementById('todo-due-inp');
    if (!inp) return;
    if (when === 'clear') { inp.value = ''; return; }
    const d = new Date();
    if (when === 'tomorrow') d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    inp.value = `${year}-${month}-${day}`;
}

// ─── Push Notifications ───────────────────────────────────────────────────────
const NOTIFIED_KEYS = JSON.parse(localStorage.getItem('notified_todos') || '{}');

function saveNotifiedKeys() {
    localStorage.setItem('notified_todos', JSON.stringify(NOTIFIED_KEYS));
}

function sendNotification(title, body, tag) {
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, { body, tag, requireInteraction: false });
    setTimeout(() => n.close(), 8000);
}

function checkDueNotifications() {
    if (Notification.permission !== 'granted') return;
    const now = new Date();

    todos.filter(t => !t.completed && t.dueDate).forEach(t => {
        const due = new Date(t.dueDate);
        due.setHours(23, 59, 0, 0);
        const diffMs = due - now;
        const warn30Key = `warn30_${t._id}`;
        const overdueKey = `overdue_${t._id}`;

        if (diffMs > 0 && diffMs <= 30 * 60 * 1000 && !NOTIFIED_KEYS[warn30Key]) {
            NOTIFIED_KEYS[warn30Key] = true;
            saveNotifiedKeys();
            sendNotification(`Task due soon: ${t.title}`,
                `Due today — less than 30 minutes left. Priority: ${t.priority}`, warn30Key);
        }

        if (diffMs < 0 && !NOTIFIED_KEYS[overdueKey]) {
            NOTIFIED_KEYS[overdueKey] = true;
            saveNotifiedKeys();
            sendNotification(`Task overdue: ${t.title}`,
                `Due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. Mark done or reschedule.`, overdueKey);
        }
    });
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') showTodoToast('Notifications enabled');
    }
}

function startNotificationPolling() {
    if (!('Notification' in window)) return;
    requestNotificationPermission();
    setInterval(checkDueNotifications, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNotificationPolling);
} else {
    startNotificationPolling();
}
