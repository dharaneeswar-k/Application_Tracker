let notes = [];

async function fetchNotes() {
    try {
        const res = await fetch('/api/notes', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch notes');
        notes = await res.json();
        renderNotes(notes);
    } catch (err) {
        console.error(err);
    }
}

function renderNotes(notes) {
    const list = document.getElementById('notes-list');
    if (!list) return;

    if (notes.length === 0) {
        list.innerHTML = `
            <div class="todo-empty">
                <div class="todo-empty-icon-wrap"><i class="fas fa-sticky-note"></i></div>
                <div class="todo-empty-title">No Notes Yet</div>
                <p class="todo-empty-sub">Save any important thoughts, snippets, or links here.</p>
                <button class="btn btn-primary mt-2" onclick="openNoteModal()">
                    <i class="fas fa-plus"></i> Create Your First Note
                </button>
            </div>`;
        return;
    }

    list.innerHTML = notes.map(note => `
        <div class="note-card" onclick="openNoteModal('${note._id}')" style="--note-color: ${note.color || '#3b82f6'}">
            <div class="note-card-header">
                <h3 class="note-title">${note.title}</h3>
                ${note.isPinned ? '<i class="fas fa-thumbtack pin-active"></i>' : ''}
            </div>
            <div class="note-content">${formatNoteContent(note.content)}</div>
            <div class="note-footer">
                <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
                <div class="note-actions">
                    <i class="fas fa-external-link-alt" title="Links detected" style="display: ${note.content.includes('http') ? 'inline' : 'none'}"></i>
                </div>
            </div>
        </div>
    `).join('');
}

function formatNoteContent(content) {
    // Simple link detection and truncation for preview
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formatted = content.replace(urlRegex, url => `<span class="note-link">${url}</span>`);
    if (formatted.length > 150) {
        formatted = formatted.substring(0, 150) + '...';
    }
    return formatted;
}

window.openNoteModal = function (id = null) {
    const modal = document.getElementById('note-modal');
    const form = document.getElementById('note-form');
    const titleInp = document.getElementById('note-title-inp');
    const contentInp = document.getElementById('note-content-inp');
    const delBtn = document.getElementById('note-del-trigger');
    const modalTitle = document.getElementById('note-modal-title');

    form.reset();
    document.getElementById('note-id').value = id || '';

    if (id) {
        const note = notes.find(n => n._id === id);
        if (note) {
            modalTitle.textContent = 'Edit Note';
            titleInp.value = note.title;
            contentInp.value = note.content;
            delBtn.style.display = 'flex';
        }
    } else {
        modalTitle.textContent = 'New Note';
        delBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

document.querySelector('.close-note-btn')?.addEventListener('click', () => {
    document.getElementById('note-modal').classList.remove('active');
});

document.getElementById('note-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('note-id').value;
    const saveBtn = document.getElementById('note-save-btn');
    const originalText = saveBtn.innerHTML;

    const noteData = {
        title: document.getElementById('note-title-inp').value,
        content: document.getElementById('note-content-inp').value
    };

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const url = id ? `/api/notes/${id}` : '/api/notes';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(noteData)
        });

        if (!res.ok) throw new Error('Failed to save note');

        showNoteToast(id ? 'Note updated successfully' : 'Note created successfully');
        if (typeof window.motivateUser === 'function') {
            window.motivateUser('noteSaved');
        }
        document.getElementById('note-modal').classList.remove('active');
        fetchNotes();
    } catch (err) {
        showNoteToast(err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
});

document.getElementById('note-del-trigger')?.addEventListener('click', async () => {
    const id = document.getElementById('note-id').value;
    if (!id || !confirm('Are you sure you want to delete this note?')) return;

    try {
        const res = await fetch(`/api/notes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok) throw new Error('Failed to delete note');

        showNoteToast('Note deleted');
        document.getElementById('note-modal').classList.remove('active');
        fetchNotes();
    } catch (err) {
        showNoteToast(err.message, true);
    }
});

function showNoteToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#ef4444' : 'var(--primary)';
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

// Global init for notes if view active
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch if notes view is default or when switched (handled by app.js)
});

window.fetchNotes = fetchNotes;
