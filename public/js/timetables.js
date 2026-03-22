// ═══════════════════════════════════════════════════
//  Timetable Module — Smart Planning & Scheduling
// ═══════════════════════════════════════════════════

let timetables = [];

async function fetchTimetables() {
    try {
        const res = await fetch('/api/timetables', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) return;
        timetables = await res.json();
        renderTimetables();
    } catch (e) {
        console.error('Timetable fetch error', e);
    }
}

function renderTimetables() {
    const container = document.getElementById('timetable-list');
    if (!container) return;

    if (timetables.length === 0) {
        container.innerHTML = `
            <div class="todo-empty" style="padding: 6rem 1rem;">
                <div class="todo-empty-icon-wrap" style="width: 120px; height: 120px; font-size: 3.5rem; background: var(--surface); border-radius: 40px; box-shadow: 0 20px 40px var(--shadow-color); border-color: var(--primary);">
                    <i class="fas fa-calendar-plus" style="color: var(--primary);"></i>
                </div>
                <h2 class="todo-empty-title" style="font-size: 2rem; margin-top: 2rem;">No plans active</h2>
                <p class="todo-empty-sub" style="font-size: 1.1rem; max-width: 400px; opacity: 0.8;">Create a high-performance study schedule or paste your exam prep guide to get started immediately.</p>
                <button class="btn btn-primary" onclick="openTimetableModal()" style="margin-top: 2.5rem; padding: 12px 32px; font-size: 1.1rem; border-radius: 100px;">
                    <i class="fas fa-plus"></i> Start Planning
                </button>
            </div>`;
        return;
    }

    container.innerHTML = timetables.map(t => renderTimetableCard(t)).join('');
}

function renderTimetableCard(t) {
    const totalTasks = t.days.reduce((acc, d) => acc + d.tasks.length, 0);
    const completedTasks = t.days.reduce((acc, d) => acc + d.tasks.filter(tk => tk.done).length, 0);
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `
    <div class="timetable-card" onclick="viewTimetable('${t._id}')">
        <div class="timetable-card-header">
            <div class="timetable-info">
                <h3 class="timetable-title">${t.title}</h3>
                <span class="timetable-count">${t.days.length} Days • ${totalTasks} Topics</span>
            </div>
            <div class="timetable-progress-circle" style="--pg:${progress}%">
                <span>${progress}%</span>
            </div>
        </div>
        <div class="timetable-days-preview">
            ${t.days.slice(0, 3).map(d => `
                <div class="day-preview-item">
                    <span class="day-label">${d.label}</span>
                    <span class="day-status">${d.tasks.filter(tk => tk.done).length}/${d.tasks.length} Done</span>
                </div>
            `).join('')}
            ${t.days.length > 3 ? `<div class="day-preview-more">+${t.days.length - 3} more days</div>` : ''}
        </div>
    </div>`;
}

window.openTimetableModal = function (timetable = null) {
    const modal = document.getElementById('timetable-modal');
    const titleEl = document.getElementById('timetable-modal-title');
    const form = document.getElementById('timetable-form');
    const delBtn = document.getElementById('timetable-del-trigger');

    form.reset();
    document.getElementById('timetable-id').value = '';
    document.getElementById('timetable-days-container').innerHTML = '';

    if (delBtn) delBtn.style.display = 'none';

    if (timetable) {
        titleEl.textContent = 'Edit Plan';
        document.getElementById('timetable-id').value = timetable._id;
        document.getElementById('timetable-title-inp').value = timetable.title;
        renderTimetableDaysInModal(timetable.days);
        if (delBtn) delBtn.style.display = 'flex';
    } else {
        titleEl.textContent = 'New Plan';
    }

    modal.classList.add('active');
}

function renderTimetableDaysInModal(days) {
    const container = document.getElementById('timetable-days-container');
    container.innerHTML = days.map((d, dIdx) => `
        <div class="timetable-day-editor" data-index="${dIdx}">
            <div class="day-editor-header">
                <div class="day-label-group">
                    <i class="fas fa-calendar-day"></i>
                    <input type="text" class="day-label-inp" value="${d.label}" placeholder="Day label (e.g. Day 1)">
                </div>
                <button type="button" class="btn-text danger" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="day-tasks-list">
                ${d.tasks.map((tk, tIdx) => `
                    <div class="day-task-row">
                        <input type="text" class="task-cat-inp" value="${tk.category || ''}" placeholder="Category">
                        <input type="text" class="task-topic-inp" value="${tk.topic}" placeholder="Topic">
                        <input type="checkbox" class="task-done-chk" ${tk.done ? 'checked' : ''}>
                        <button type="button" class="task-del" onclick="this.parentElement.remove()">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-add-topic" onclick="addTaskToDay(this)">
                <i class="fas fa-plus-circle"></i> Add Topic
            </button>
        </div>
    `).join('');
}

window.addDayToModal = function () {
    const container = document.getElementById('timetable-days-container');
    const dIdx = container.querySelectorAll('.timetable-day-editor').length;
    const div = document.createElement('div');
    div.className = 'timetable-day-editor';
    div.setAttribute('data-index', dIdx);
    div.innerHTML = `
        <div class="day-editor-header">
            <div class="day-label-group">
                <i class="fas fa-calendar-day"></i>
                <input type="text" class="day-label-inp" value="Day ${dIdx + 1}" placeholder="Day label">
            </div>
            <button type="button" class="btn-text danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
        <div class="day-tasks-list"></div>
        <button type="button" class="btn-add-topic" onclick="addTaskToDay(this)">
            <i class="fas fa-plus-circle"></i> Add Topic
        </button>`;
    container.appendChild(div);
    // Add first task automatically
    addTaskToDay(div.querySelector('.btn-add-topic'));
}

window.addTaskToDay = function (btn) {
    const list = btn.previousElementSibling;
    const div = document.createElement('div');
    div.className = 'day-task-row';
    div.innerHTML = `
        <input type="text" class="task-cat-inp" placeholder="Category">
        <input type="text" class="task-topic-inp" placeholder="Topic">
        <input type="checkbox" class="task-done-chk" title="Mark Done">
        <button type="button" class="task-del" onclick="this.parentElement.remove()">
            <i class="fas fa-trash-alt"></i>
        </button>`;
    list.appendChild(div);
}

// ── Smart Parser Logic ────────────────────────────────────────────────────────

function parseBulkPlan(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const days = [];
    let currentDay = null;
    let currentCategory = 'General';

    lines.forEach(line => {
        // Detect Day (e.g. DAY 1, 🔥 DAY 1)
        const dayMatch = line.match(/(?:DAY|Day)\s*(\d+)/i);
        if (dayMatch) {
            currentDay = { label: line.replace(/[👉🔥]/g, '').trim(), tasks: [] };
            days.push(currentDay);
            currentCategory = 'General';
            return;
        }

        // Detect Category (e.g. Quant:, Reasoning:)
        if (line.includes(':')) {
            currentCategory = line.split(':')[0].replace(/[👉🔥]/g, '').trim();
            const topicAfter = line.split(':')[1]?.trim();
            if (topicAfter && currentDay) {
                currentDay.tasks.push({ category: currentCategory, topic: topicAfter, done: false });
            }
            return;
        }

        // It's a topic under the current category
        if (currentDay && !line.match(/^[👉🔥]/)) {
            currentDay.tasks.push({ category: currentCategory, topic: line, done: false });
        }
    });

    return days;
}

document.getElementById('timetable-bulk-inp')?.addEventListener('input', function (e) {
    const text = e.target.value;
    if (text.length > 20) {
        const parsedDays = parseBulkPlan(text);
        if (parsedDays.length > 0) {
            renderTimetableDaysInModal(parsedDays);
            // Auto-fill title if empty
            const titleInp = document.getElementById('timetable-title-inp');
            if (!titleInp.value) titleInp.value = "New Multi-Day Plan";
        }
    }
});

// ── Form Submission ──────────────────────────────────────────────────────────

function showTimetableToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}

document.getElementById('timetable-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const id = document.getElementById('timetable-id').value;

    const dayNodes = document.querySelectorAll('.timetable-day-editor');
    const days = [...dayNodes].map(dayNode => {
        const tasks = [...dayNode.querySelectorAll('.day-task-row')].map(tRow => ({
            category: tRow.querySelector('.task-cat-inp').value.trim(),
            topic: tRow.querySelector('.task-topic-inp').value.trim(),
            done: tRow.querySelector('.task-done-chk').checked
        })).filter(tk => tk.topic);

        return {
            label: dayNode.querySelector('.day-label-inp').value.trim(),
            tasks
        };
    }).filter(d => d.label);

    const data = {
        title: document.getElementById('timetable-title-inp').value.trim(),
        days
    };

    if (!data.title) {
        showTimetableToast('Please enter a plan title');
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/timetables/${id}` : '/api/timetables';
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById('timetable-modal').classList.remove('active');
            showTimetableToast(id ? 'Plan updated successfully' : 'Plan created successfully');
            await fetchTimetables();
        } else {
            const errData = await res.json().catch(() => ({}));
            showTimetableToast('Error: ' + (errData.message || 'Failed to save'));
        }
    } catch (e) {
        console.error('Save error', e);
        showTimetableToast('Network error — please check your connection');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

document.getElementById('timetable-del-trigger')?.addEventListener('click', async () => {
    const id = document.getElementById('timetable-id').value;
    if (!id || !confirm('Permanently delete this plan?')) return;

    try {
        const res = await fetch(`/api/timetables/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            document.getElementById('timetable-modal').classList.remove('active');
            showTimetableToast('Plan deleted');
            await fetchTimetables();
        } else {
            showTimetableToast('Failed to delete plan');
        }
    } catch (e) {
        showTimetableToast('Error deleting plan');
    }
});

window.viewTimetable = function (id) {
    const t = timetables.find(x => x._id === id);
    if (t) openTimetableModal(t);
}

document.querySelectorAll('.close-timetable-btn').forEach(b => b.addEventListener('click', () => {
    document.getElementById('timetable-modal').classList.remove('active');
}));

document.addEventListener('DOMContentLoaded', () => {
    // Nav logic handled in app.js, but we need to fetch if active
    if (document.getElementById('timetables-view')?.classList.contains('active')) {
        fetchTimetables();
    }
});
