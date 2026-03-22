let applications = [];

const token = localStorage.getItem('token');
if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.className = 'dark-mode';

    const updateThemeIcon = () => {
        const isD = document.body.classList.contains('dark-mode');
        document.getElementById('theme-icon').className = isD ? 'fas fa-sun' : 'fas fa-moon';
        if (document.getElementById('m-theme-icon')) {
            document.getElementById('m-theme-icon').className = isD ? 'fas fa-sun' : 'fas fa-moon';
        }
        localStorage.setItem('theme', isD ? 'dark' : 'light');
        initCharts();
    };

    updateThemeIcon();

    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        updateThemeIcon();
    });
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        updateThemeIcon();
    });

    // Nav
    const navItems = document.querySelectorAll('.nav-item[data-target], .m-nav-item[data-target]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            const target = item.getAttribute('data-target');
            document.querySelectorAll(`[data-target="${target}"]`).forEach(n => n.classList.add('active'));

            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            const titles = { 'dashboard-view': 'Insights', 'kanban-view': 'Board', 'list-view': 'List' };
            if (document.getElementById('view-title')) {
                document.getElementById('view-title').textContent = titles[target];
            }
        });
    });

    // Logout
    const doLogout = () => { localStorage.clear(); window.location.href = '/login.html'; };
    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('m-logout-btn')?.addEventListener('click', doLogout);

    fetchApplications();

    document.querySelectorAll('.close-btn, .close-btn-action').forEach(b => b.addEventListener('click', () => {
        document.getElementById('app-modal').classList.remove('active');
    }));
    document.querySelectorAll('.close-view-btn').forEach(b => b.addEventListener('click', () => {
        document.getElementById('view-modal').classList.remove('active');
    }));

    // Kanban Mobile Tabs
    const kTabs = document.querySelectorAll('.k-tab');
    kTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            kTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetStatus = tab.getAttribute('data-tab');
            document.querySelectorAll('.k-col').forEach(col => {
                if (col.getAttribute('data-status') === targetStatus) {
                    col.classList.add('active-tab');
                } else {
                    col.classList.remove('active-tab');
                }
            });
        });
    });
    // Set default active tab
    document.querySelector('.k-col[data-status="Applied"]')?.classList.add('active-tab');

    document.getElementById('toggle-more').addEventListener('click', (e) => {
        const trg = document.getElementById('more-details');
        trg.classList.toggle('hidden');
        e.target.innerHTML = trg.classList.contains('hidden') ? `Add more details <i class="fas fa-chevron-down"></i>` : `Less details <i class="fas fa-chevron-up"></i>`;
    });

    document.getElementById('app-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('app-id').value;
        const existingApp = id ? applications.find(a => a._id === id) : null;
        let newTimeline = existingApp && existingApp.timeline ? [...existingApp.timeline] : [];
        const newStatus = document.getElementById('app-status').value;

        if (existingApp && existingApp.status !== newStatus) {
            newTimeline.push({ status: newStatus, note: 'Status updated via form' });
        }

        const appData = {
            companyName: document.getElementById('app-company').value,
            role: document.getElementById('app-role').value,
            location: document.getElementById('app-location').value,
            jobType: document.getElementById('app-type').value,
            applicationDate: document.getElementById('app-date').value,
            status: newStatus,
            notes: document.getElementById('app-notes').value,
            resumeVersion: document.getElementById('app-resume-select').value === 'other' ?
                document.getElementById('app-resume-other').value :
                document.getElementById('app-resume-select').value,
            compensation: {
                base: parseLPA(document.getElementById('app-comp-lpa')?.value),
                stipend: parseFloat(document.getElementById('app-comp-stipend')?.value) || 0,
                currency: 'INR'
            },
            timeline: newTimeline
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/applications/${id}` : '/api/applications';

        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving';

        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(appData)
            });
            if (res.ok) {
                document.getElementById('app-modal').classList.remove('active');
                showToast('Saved Successfully');
                fetchApplications();
            } else { showToast('Error saving'); }
        } catch (e) { showToast('Network error'); }
        btn.innerHTML = origText;
    });

    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('status-filter').addEventListener('change', renderTable);
});

async function fetchApplications() {
    try {
        const res = await fetch('/api/applications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) { doLogout(); return; }
        applications = await res.json();
        updateDashboard();
        renderKanban();
        renderTable();
    } catch (e) { console.error('Fetch error', e); }
}

window.openAppModal = function (id = null) {
    const modal = document.getElementById('app-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('app-form');

    if (id) {
        title.textContent = 'Edit Tracked App';
        const app = applications.find(a => a._id === id);
        if (app) {
            document.getElementById('app-id').value = app._id;
            document.getElementById('app-company').value = app.companyName;
            document.getElementById('app-role').value = app.role;
            document.getElementById('app-status').value = app.status;
            document.getElementById('app-date').value = app.applicationDate ? new Date(app.applicationDate).toISOString().split('T')[0] : '';
            document.getElementById('app-location').value = app.location || '';
            document.getElementById('app-type').value = app.jobType || 'Full-Time';
            document.getElementById('app-notes').value = app.notes || '';

            const resVal = app.resumeVersion || 'Generic';
            const select = document.getElementById('app-resume-select');
            const otherInput = document.getElementById('app-resume-other');

            let isKnown = false;
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === resVal) {
                    select.selectedIndex = i;
                    isKnown = true;
                    break;
                }
            }

            if (!isKnown && resVal !== 'Generic') {
                select.value = 'other';
                otherInput.value = resVal;
                otherInput.classList.remove('hidden');
            } else {
                otherInput.classList.add('hidden');
                otherInput.value = '';
            }

            document.getElementById('app-comp-lpa').value = app.compensation?.base ? (app.compensation.base / 100000) + 'L' : '';
            document.getElementById('app-comp-stipend').value = app.compensation?.stipend || '';
        }
    } else {
        title.textContent = 'New Application';
        form.reset();
        document.getElementById('app-id').value = '';
        document.getElementById('app-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('app-comp-lpa').value = '';
        document.getElementById('app-comp-stipend').value = '';
    }
    modal.classList.add('active');
}

window.toggleResumeOther = function (val) {
    const other = document.getElementById('app-resume-other');
    if (val === 'other') {
        other.classList.remove('hidden');
        other.focus();
    } else {
        other.classList.add('hidden');
    }
}

function parseLPA(val) {
    if (!val) return 0;
    const clean = val.toString().toLowerCase().replace(/[^0-9.]/g, '');
    let num = parseFloat(clean) || 0;
    if (val.toString().toLowerCase().includes('l')) {
        return num * 100000;
    }
    // If user enters 450000 directly
    if (num >= 1000) return num;
    // Default to LPA if small number like 4.5
    return num * 100000;
}

window.viewApp = function (id) {
    const app = applications.find(a => a._id === id);
    if (!app) return;
    const date = new Date(app.applicationDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

    let compHtml = '';
    if (app.compensation && (app.compensation.base || app.compensation.stipend)) {
        const annual = app.compensation.base || 0;
        const monthly = Math.round(annual / 12);
        const stipend = app.compensation.stipend || 0;

        const f = (num) => '₹' + num.toLocaleString('en-IN');

        compHtml = `
        <div class="comp-badge">
            <span class="comp-label">ANNUAL PACKAGE (LPA)</span>
            <span class="comp-val">${f(annual)}</span>
            <div class="comp-details-grid">
                <div class="comp-detail-item">
                    <span class="detail-label">Monthly</span>
                    <span class="detail-val">${f(monthly)}</span>
                </div>
                ${stipend ? `
                <div class="comp-detail-item">
                    <span class="detail-label">Stipend</span>
                    <span class="detail-val">${f(stipend)}</span>
                </div>` : ''}
            </div>
        </div>`;
    }

    let timelineHtml = '<div class="timeline-section"><div class="timeline-title">Activity Timeline</div><div class="timeline-container">';
    if (app.timeline && app.timeline.length > 0) {
        // Sort timeline descending
        const sortedTl = [...app.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedTl.forEach(t => {
            const tDate = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
            timelineHtml += `
            <div class="timeline-item ${t.status.toLowerCase()}">
                <div class="timeline-date">${tDate}</div>
                <div class="timeline-content">${t.status}</div>
                ${t.note ? `<div class="timeline-note">${t.note}</div>` : ''}
            </div>`;
        });
    } else {
        timelineHtml += `<div style="color:var(--text-secondary); font-size:0.85rem">No timeline events found.</div>`;
    }
    timelineHtml += '</div></div>';

    let html = `
        <div class="detail-header">
            <div>
                <div class="detail-title">${app.companyName}</div>
                <div class="detail-subtitle">${app.role}</div>
            </div>
            <span class="badge ${app.status.toLowerCase()}">${app.status}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Resume Used</span>
            <span class="detail-val">${app.resumeVersion || 'Generic'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Applied On</span>
            <span class="detail-val">${date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-val">${app.location || 'Not specified'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Job Type</span>
            <span class="detail-val">${app.jobType || 'Full-Time'}</span>
        </div>
        
        ${compHtml}
        ${app.notes ? `<div class="detail-notes">${app.notes}</div>` : ''}
        ${timelineHtml}
        
        <div style="display:flex; justify-content:space-between; margin-top:32px;">
            <button class="modal-del-btn" onclick="delApp('${app._id}')">Remove Log</button>
            <button class="btn btn-secondary" onclick="document.getElementById('view-modal').classList.remove('active'); openAppModal('${app._id}')">Edit Log</button>
        </div>
    `;

    document.getElementById('view-content').innerHTML = html;
    document.getElementById('view-modal').classList.add('active');
}

window.delApp = async function (id) {
    if (confirm('Are you strictly sure you want to remove this record?')) {
        await fetch(`/api/applications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        document.getElementById('view-modal').classList.remove('active');
        fetchApplications();
        showToast('Record removed');
    }
}

function updateDashboard() {
    const total = applications.length;
    let applied = 0, inters = 0, offers = 0;
    applications.forEach(a => {
        if (a.status === 'Applied') applied++;
        if (a.status === 'Interview') inters++;
        if (a.status === 'Offer') offers++;
    });
    const rate = total > 0 ? ((offers / total) * 100).toFixed(1) : 0;

    let chance = rate;
    if (offers === 0 && inters > 0) {
        chance = ((inters / total) * 33).toFixed(1);
    }

    let dailyStr = '0.0';
    let weeklyStr = '0.0';
    if (total > 0) {
        const uniqueDays = new Set(applications.map(a => new Date(a.applicationDate).toDateString())).size;
        let d = total / uniqueDays;
        let w = d * 7;
        dailyStr = d.toFixed(1);
        weeklyStr = w.toFixed(1);
    }

    const elTotal = document.getElementById('stat-total'); if (elTotal) elTotal.textContent = total;
    const elNoResp = document.getElementById('stat-no-response'); if (elNoResp) elNoResp.textContent = applied;
    const elInter = document.getElementById('stat-interview'); if (elInter) elInter.textContent = inters;
    const elOffer = document.getElementById('stat-offer'); if (elOffer) elOffer.textContent = offers;
    const elRate = document.getElementById('stat-rate'); if (elRate) elRate.textContent = rate + '%';
    const elChance = document.getElementById('stat-chance'); if (elChance) elChance.textContent = chance + '%';
    const elDaily = document.getElementById('stat-daily'); if (elDaily) elDaily.textContent = dailyStr;
    const elWeekly = document.getElementById('stat-weekly'); if (elWeekly) elWeekly.textContent = weeklyStr;

    initCharts();
}

// Kanban Render - Adding quick mobile status selects
function renderKanban() {
    ['applied', 'interview', 'offer', 'rejected'].forEach(s => {
        document.getElementById(`content-${s}`).innerHTML = '';
        document.getElementById(`count-${s}`).textContent = '0';
    });

    const counts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Ghosted: 0 };

    applications.forEach(app => {
        let colStatus = app.status === 'Ghosted' ? 'Rejected' : app.status;
        let colKey = colStatus.toLowerCase();

        if (document.getElementById(`content-${colKey}`)) {
            counts[colStatus]++;
            const div = document.createElement('div');
            div.className = 'k-card';
            div.draggable = true;
            div.ondragstart = (e) => { e.dataTransfer.setData('text', app._id); };
            div.onclick = (e) => {
                if (!e.target.classList.contains('k-mobile-select')) viewApp(app._id);
            };

            // Sleek mobile selector 
            const selectHtml = `
                <select class="k-mobile-select mobile-only" onchange="quickStatusUpdate('${app._id}', this.value)" onclick="event.stopPropagation()">
                    <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
                    <option value="Offer" ${app.status === 'Offer' ? 'selected' : ''}>Offer</option>
                    <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            `;

            div.innerHTML = `
                <div class="k-title">${app.companyName}</div>
                <div class="k-role">${app.role}</div>
                ${selectHtml}
            `;
            document.getElementById(`content-${colKey}`).appendChild(div);
        }
    });

    document.getElementById('count-applied').textContent = counts.Applied;
    document.getElementById('count-interview').textContent = counts.Interview;
    document.getElementById('count-offer').textContent = counts.Offer;
    document.getElementById('count-rejected').textContent = counts.Rejected + (counts.Ghosted || 0);

    // Update notification dots on tabs
    const dotInter = document.getElementById('dot-interview');
    const dotOffer = document.getElementById('dot-offer');
    if (dotInter) counts.Interview > 0 ? dotInter.classList.add('active') : dotInter.classList.remove('active');
    if (dotOffer) counts.Offer > 0 ? dotOffer.classList.add('active') : dotOffer.classList.remove('active');
}

window.allowDrop = (e) => e.preventDefault();
window.drop = async (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const col = e.target.closest('.k-col');
    if (!col) return;
    const stat = col.getAttribute('data-status');
    const app = applications.find(a => a._id === id);

    if (app && app.status !== stat) {
        quickStatusUpdate(id, stat);
    }
}

window.quickStatusUpdate = async function (appId, newStatus) {
    const app = applications.find(a => a._id === appId);
    if (app) {
        const oldStatus = app.status;
        app.status = newStatus;
        app.timeline = app.timeline || [];
        app.timeline.push({ status: newStatus, note: 'Fast status update', date: new Date() });

        renderKanban();
        try {
            const res = await fetch(`/api/applications/${appId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus, timeline: app.timeline })
            });
            if (!res.ok) throw new Error();
            fetchApplications(); // Refresh list/dashboard cleanly
        } catch (err) {
            app.status = oldStatus;
            renderKanban();
            showToast('Failed to change status');
        }
    }
}

// List Render
function renderTable() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const f = document.getElementById('status-filter').value;
    const tb = document.getElementById('table-body');
    tb.innerHTML = '';

    let filtered = applications.filter(a =>
        (a.companyName.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) &&
        (f ? a.status === f : true)
    ).sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

    if (filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 2rem; color: var(--text-secondary)">No items match your criteria.</td></tr>`;
        return;
    }

    filtered.forEach(a => {
        const tr = document.createElement('tr');
        tr.onclick = () => viewApp(a._id);

        tr.innerHTML = `
            <td>
                <div style="font-weight:600; color:var(--text-primary)">${a.companyName}</div>
                <div style="color:var(--text-secondary); font-size: 0.85rem">${a.role}</div>
            </td>
            <td><span class="badge ${a.status.toLowerCase()}">${a.status}</span></td>
            <td class="hide-mobile" style="color:var(--text-secondary); font-size:0.85rem">${new Date(a.applicationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        `;
        tb.appendChild(tr);
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Advanced High-End SaaS Charts
let pChart, lChart;
function initCharts() {
    if (!applications || applications.length === 0) return;
    const isDark = document.body.classList.contains('dark-mode');

    Chart.defaults.color = isDark ? '#a1a1aa' : '#71717a';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.scale.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    if (pChart) pChart.destroy();
    if (lChart) lChart.destroy();

    const stats = { Applied: 0, Interview: 0, Rejected: 0, Offer: 0 };
    applications.forEach(a => { let s = a.status === 'Ghosted' ? 'Rejected' : a.status; if (stats[s] !== undefined) stats[s]++; });

    // Pie Chart
    const ctxP = document.getElementById('statusChart');
    if (ctxP) {
        const isMobile = window.innerWidth < 768;
        pChart = new Chart(ctxP.getContext('2d'), {
            type: 'pie', // Using Pie over Doughnut for a change as requested
            data: {
                labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
                datasets: [{
                    data: [stats.Applied, stats.Interview, stats.Offer, stats.Rejected],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: isDark ? 2 : 2,
                    borderColor: isDark ? '#000000' : '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: isMobile ? 'top' : 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: isMobile ? 10 : 15,
                            font: { size: 10 }
                        }
                    },
                    tooltip: { backgroundColor: isDark ? '#fff' : '#000', titleColor: isDark ? '#000' : '#fff', bodyColor: isDark ? '#000' : '#fff', padding: 12, cornerRadius: 8, displayColors: false }
                },
                maintainAspectRatio: false,
                responsive: true
            }
        });
    }

    // Funnel Visual Build
    const fWrapper = document.getElementById('funnel-wrapper');
    if (fWrapper) {
        const total = applications.length;
        const intersAndOffers = stats.Interview + stats.Offer;
        const offersOnly = stats.Offer;

        const pctApplied = total > 0 ? 100 : 0;
        const pctInter = total > 0 ? Math.round((intersAndOffers / total) * 100) : 0;
        const pctOffer = total > 0 ? Math.round((offersOnly / total) * 100) : 0;

        fWrapper.innerHTML = `
            <div class="funnel-step">
                <div class="funnel-header"><span class="funnel-label">Applied</span><span class="funnel-stats">${total} (${pctApplied}%)</span></div>
                <div class="funnel-track"><div class="funnel-fill applied" style="width: ${pctApplied}%"></div></div>
            </div>
            <div class="funnel-step">
                <div class="funnel-header"><span class="funnel-label">Interviewed</span><span class="funnel-stats">${intersAndOffers} (${pctInter}%)</span></div>
                <div class="funnel-track"><div class="funnel-fill interview" style="width: ${pctInter}%"></div></div>
            </div>
            <div class="funnel-step">
                <div class="funnel-header"><span class="funnel-label">Offers</span><span class="funnel-stats">${offersOnly} (${pctOffer}%)</span></div>
                <div class="funnel-track"><div class="funnel-fill offer" style="width: ${pctOffer}%"></div></div>
            </div>
        `;
    }

    const counts = {};
    const sortedApps = [...applications].sort((a, b) => new Date(a.applicationDate) - new Date(b.applicationDate));
    sortedApps.forEach(a => {
        const k = new Date(a.applicationDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        counts[k] = (counts[k] || 0) + 1;
    });
    const keys = Object.keys(counts);
    const dataVals = keys.map(k => counts[k]);

    const ctxL = document.getElementById('timelineChart').getContext('2d');

    // Create Premium Gradient
    const gradient = ctxL.createLinearGradient(0, 0, 0, 300);
    const brandColor = isDark ? '255, 255, 255' : '0, 0, 0';
    gradient.addColorStop(0, `rgba(${brandColor}, 0.2)`);
    gradient.addColorStop(1, `rgba(${brandColor}, 0.0)`);

    lChart = new Chart(ctxL, {
        type: 'line',
        data: {
            labels: keys,
            datasets: [{
                label: 'Activity',
                data: dataVals,
                backgroundColor: gradient,
                borderColor: isDark ? '#ffffff' : '#000000',
                borderWidth: 2,
                tension: 0.4, // Smooth curved lines
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: isDark ? '#ffffff' : '#000000',
            }]
        },
        options: {
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#fff' : '#000',
                    titleColor: isDark ? '#000' : '#fff',
                    bodyColor: isDark ? '#000' : '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) { return context.parsed.y + ' applications'; }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, border: { display: false } }
            }
        }
    });
}

window.toggleProfile = function () {
    const drawer = document.getElementById('profile-drawer');
    if (!drawer) return;
    const nameLabel = document.getElementById('profile-username-mob');
    if (nameLabel) nameLabel.textContent = localStorage.getItem('username') || 'User';
    drawer.classList.toggle('active');
}

window.doLogout = function () {
    localStorage.clear();
    window.location.href = '/login.html';
}
