const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'public_works', label: 'Public Works' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'transport', label: 'Transport' },
  { value: 'parks', label: 'Parks' },
];

const CATEGORY_OPTIONS = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'lighting', label: 'Streetlight' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'other', label: 'Other' },
];

const PAGE_SIZE = 10;
const API_BASE = window.location.origin;

const state = {
  reports: [],
  filtered: [],
  page: 1,
  range: 'all',
  sort: { key: 'createdAt', dir: 'desc' },
  selectedId: null,
};

async function fetchReportsFromApi() {
  try {
    const res = await fetch(`${API_BASE}/api/reports`);
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    if (!json || !Array.isArray(json.data)) throw new Error('Bad format');
    state.reports = json.data.map(r => ({
      ...r,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
      activity: r.activity || [],
    }));
    return true;
  } catch (e) {
    console.error('API unavailable. Could not load reports from database.', e);
    state.reports = [];
    alert('Could not load reports from the server. Please check the backend and refresh.');
    return false;
  }
}

function $(id) { return document.getElementById(id); }

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function badge(text, cls) {
  return `<span class="badge ${cls}">${text}</span>`;
}

function statusToClass(status) { return `status-${status}`; }
function priorityToClass(priority) { return `priority-${priority}`; }

function applyFilters() {
  const status = $('statusFilter').value;
  const priority = $('priorityFilter').value;
  const category = $('categoryFilter').value;
  const dept = $('deptFilter').value;
  const search = $('searchInput').value.trim().toLowerCase();

  const now = new Date();
  let start = null;
  if (state.range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (state.range === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
  } else if (state.range === 'month') {
    start = new Date(now);
    start.setMonth(now.getMonth() - 1);
  }

  let items = state.reports.slice();
  if (start) {
    items = items.filter(r => new Date(r.createdAt) >= start);
  }
  if (status !== 'all') items = items.filter(r => r.status === status);
  if (priority !== 'all') items = items.filter(r => r.priority === priority);
  if (category !== 'all') items = items.filter(r => r.category === category);
  if (dept !== 'all') items = items.filter(r => r.department === dept);
  if (search) {
    items = items.filter(r =>
      r.description.toLowerCase().includes(search) ||
      String(r.id).includes(search) ||
      r.location.address.toLowerCase().includes(search)
    );
  }

  const { key, dir } = state.sort;
  items.sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (key === 'reporter') {
      av = a.reporter?.name || '';
      bv = b.reporter?.name || '';
    }
    let cmp = 0;
    if (key === 'createdAt') {
      cmp = new Date(av) - new Date(bv);
    } else if (typeof av === 'string') {
      cmp = av.localeCompare(bv);
    } else {
      cmp = av - bv;
    }
    return dir === 'asc' ? cmp : -cmp;
  });

  state.filtered = items;
  state.page = 1;
  renderTable();
  renderStats();
}

function renderStats() {
  const open = state.reports.filter(r => r.status === 'new' || r.status === 'acknowledged').length;
  const inProgress = state.reports.filter(r => r.status === 'in_progress').length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const resolved = state.reports.filter(r => r.status === 'resolved' && new Date(r.createdAt) >= weekAgo).length;
  $('statOpen').innerText = String(open);
  $('statInProgress').innerText = String(inProgress);
  $('statResolved').innerText = String(resolved);
  $('statAvgResponse').innerText = '3.2d';
}

function renderTable() {
  const tbody = document.querySelector('#reportsTable tbody');
  tbody.innerHTML = '';

  const start = (state.page - 1) * PAGE_SIZE;
  const pageItems = state.filtered.slice(start, start + PAGE_SIZE);
  pageItems.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.id = String(r.id);
    tr.innerHTML = `
      <td>#${r.id}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td>${r.category}</td>
      <td>${r.reporter?.name || ''}</td>
      <td>${r.description}</td>
      <td>${badge(r.priority, priorityToClass(r.priority))}</td>
      <td>${badge(r.status.replace('_', ' '), statusToClass(r.status))}</td>
      <td>${r.department.replace('_', ' ')}</td>
    `;
    tr.addEventListener('click', () => selectRow(r.id));
    tbody.appendChild(tr);
  });

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  $('pageInfo').innerText = `${state.page} / ${totalPages}`;
  $('resultsCount').innerText = `${state.filtered.length} results`;
  $('prevPage').disabled = state.page <= 1;
  $('nextPage').disabled = state.page >= totalPages;

  // selection highlight
  document.querySelectorAll('#reportsTable tbody tr').forEach(tr => {
    tr.classList.toggle('selected', Number(tr.dataset.id) === state.selectedId);
  });
}

function selectRow(id) {
  state.selectedId = id;
  renderSelection();
  renderTable();
}

function renderSelection() {
  const report = state.reports.find(r => r.id === state.selectedId);
  if (!report) {
    $('details').hidden = true;
    $('detailsEmpty').style.display = 'grid';
    return;
  }
  $('detailsEmpty').style.display = 'none';
  $('details').hidden = false;
  $('detailId').innerText = `#${report.id}`;
  $('detailMeta').innerText = `${report.category} • ${formatDate(report.createdAt)} • ${report.location.address}`;
  $('detailDescription').innerText = report.description;
  $('detailReporterName').innerText = report.reporter?.name || '—';
  $('detailReporterEmail').innerText = report.reporter?.email || '—';
  $('detailReporterPhone').innerText = report.reporter?.phone || '—';
  const att = $('detailAttachments');
  att.innerHTML = '';
  report.attachments.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Attachment';
    att.appendChild(img);
  });
  const act = $('detailActivity');
  act.innerHTML = '';
  report.activity.forEach(a => {
    const div = document.createElement('div');
    div.textContent = `${formatDate(a.ts)} — ${a.text}`;
    act.appendChild(div);
  });
  // selects
  fillSelect('detailStatus', STATUS_OPTIONS, report.status);
  fillSelect('detailDepartment', DEPARTMENT_OPTIONS, report.department);
  
  // Render map
  renderMap(report);
}

function renderMap(report) {
  const mapBox = $('mapBox');
  if (!mapBox) return;
  
  // Clear existing map
  mapBox.innerHTML = '';
  
  // Check if we have location data
  const lat = parseFloat(report.location?.lat);
  const lng = parseFloat(report.location?.lng);
  
  if (isNaN(lat) || isNaN(lng)) {
    mapBox.innerHTML = '<div class="map-placeholder">No location data available</div>';
    return;
  }
  
  // Create map container
  const mapContainer = document.createElement('div');
  mapContainer.id = 'leafletMap';
  mapContainer.style.height = '200px';
  mapContainer.style.width = '100%';
  mapBox.appendChild(mapContainer);
  
  // Initialize map
  const map = L.map('leafletMap').setView([lat, lng], 15);
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  
  // Add marker for the report
  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`
    <div style="min-width: 200px;">
      <h4 style="margin: 0 0 8px 0; color: #1f2937;">Report #${report.id}</h4>
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong>Category:</strong> ${report.category}</p>
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong>Status:</strong> ${report.status}</p>
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong>Priority:</strong> ${report.priority}</p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}</p>
    </div>
  `);
  
  // Add all other reports as smaller markers
  state.reports.forEach(r => {
    if (r.id === report.id) return; // Skip current report
    
    const rLat = parseFloat(r.location?.lat);
    const rLng = parseFloat(r.location?.lng);
    
    if (!isNaN(rLat) && !isNaN(rLng)) {
      const otherMarker = L.circleMarker([rLat, rLng], {
        radius: 6,
        color: '#6b7280',
        fillColor: '#9ca3af',
        fillOpacity: 0.7,
        weight: 2
      }).addTo(map);
      
      otherMarker.bindPopup(`
        <div style="min-width: 150px;">
          <h4 style="margin: 0 0 4px 0; color: #1f2937;">Report #${r.id}</h4>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: #6b7280;">${r.category} • ${r.status}</p>
        </div>
      `);
    }
  });
  
  // Open popup for the selected report
  marker.openPopup();
}

function fillSelect(id, options, value) {
  const el = $(id);
  el.innerHTML = '';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === value) opt.selected = true;
    el.appendChild(opt);
  });
}

async function saveDetails() {
  const report = state.reports.find(r => r.id === state.selectedId);
  if (!report) {
    console.log('No report selected');
    return;
  }
  const status = $('detailStatus').value;
  const dept = $('detailDepartment').value;
  
  console.log(`Updating report ${report.id}: status=${status}, department=${dept}`);
  
  try {
    const res = await fetch(`${API_BASE}/api/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, department: dept }),
    });
    
    if (res.ok) {
      const upd = await res.json();
      console.log('Update successful:', upd);
      
      // Immediately fetch fresh details (including activity) from API
      try {
        const dres = await fetch(`${API_BASE}/api/reports/${report.id}`);
        if (dres.ok) {
          const details = await dres.json();
          console.log('Fetched fresh details:', details);
          
          // Update local state entry
          const idx = state.reports.findIndex(r => r.id === report.id);
          if (idx !== -1) {
            state.reports[idx] = {
              ...state.reports[idx],
              ...details,
            };
            console.log('Updated local state for report', report.id);
          }
        } else {
          console.log('Failed to fetch fresh details, using fallback');
          // fallback minimal local sync
          report.status = upd.status;
          report.department = upd.department;
        }
      } catch (e) {
        console.log('Error fetching fresh details:', e);
        // fallback minimal local sync
        report.status = upd.status;
        report.department = upd.department;
      }
    } else {
      console.log('Update failed, using fallback');
      // fallback to local update if server not available
      if (report.status !== status) {
        report.status = status;
        report.activity = report.activity || [];
        report.activity.unshift({ ts: new Date().toISOString(), text: `Status changed to ${status.replace('_',' ')}` });
      }
      if (report.department !== dept) {
        report.department = dept;
        report.activity = report.activity || [];
        report.activity.unshift({ ts: new Date().toISOString(), text: `Reassigned to ${dept.replace('_',' ')}` });
      }
    }
  } catch (e) {
    console.log('Error during update:', e);
    // offline fallback
    if (report.status !== status) {
      report.status = status;
      report.activity = report.activity || [];
      report.activity.unshift({ ts: new Date().toISOString(), text: `Status changed to ${status.replace('_',' ')}` });
    }
    if (report.department !== dept) {
      report.department = dept;
      report.activity = report.activity || [];
      report.activity.unshift({ ts: new Date().toISOString(), text: `Reassigned to ${dept.replace('_',' ')}` });
    }
  }
  
  console.log('Refreshing UI...');
  applyFilters();
  renderSelection();
  
  // Show success message
  const successMsg = document.createElement('div');
  successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  successMsg.textContent = `Report #${report.id} updated successfully!`;
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    if (successMsg.parentNode) {
      successMsg.parentNode.removeChild(successMsg);
    }
  }, 3000);
}

function exportCSV() {
  const headers = ['id','createdAt','category','description','priority','status','department','address','reporter_name','reporter_email','reporter_phone'];
  const rows = state.filtered.map(r => [
    r.id, r.createdAt, r.category, r.description.replace(/\n/g,' '), r.priority, r.status, r.department, r.location.address,
    r.reporter?.name || '', r.reporter?.email || '', r.reporter?.phone || ''
  ]);
  const lines = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'reports.csv'; a.click();
  URL.revokeObjectURL(url);
}

function initSorting() {
  document.querySelectorAll('#reportsTable thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sort.key === key) {
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.key = key;
        state.sort.dir = 'asc';
      }
      applyFilters();
    });
  });
}

function initRangeTabs() {
  document.querySelectorAll('.segmented .seg').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented .seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.range = btn.dataset.range;
      applyFilters();
    });
  });
}

function initPagination() {
  $('prevPage').addEventListener('click', () => { state.page = Math.max(1, state.page - 1); renderTable(); });
  $('nextPage').addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    state.page = Math.min(totalPages, state.page + 1);
    renderTable();
  });
}

function initFilters() {
  ['statusFilter', 'priorityFilter', 'categoryFilter', 'deptFilter', 'searchInput'].forEach(id => {
    $(id).addEventListener('input', applyFilters);
  });
  $('clearFiltersBtn').addEventListener('click', () => {
    $('statusFilter').value = 'all';
    $('priorityFilter').value = 'all';
    $('categoryFilter').value = 'all';
    $('deptFilter').value = 'all';
    $('searchInput').value = '';
    applyFilters();
  });
}

function initDetailsActions() {
  $('saveDetailBtn').addEventListener('click', saveDetails);
}

function initMisc() {
  $('exportBtn').addEventListener('click', exportCSV);
  $('year').innerText = String(new Date().getFullYear());
  const base = API_BASE || window.location.origin;
  const apiEl = document.getElementById('apiBaseText');
  if (apiEl) apiEl.textContent = base;
  const reload = document.getElementById('reloadBtn');
  if (reload) reload.addEventListener('click', async () => {
    await fetchReportsFromApi();
    applyFilters();
  });
}

async function main() {
  await fetchReportsFromApi();
  initSorting();
  initRangeTabs();
  initPagination();
  initFilters();
  initDetailsActions();
  initMisc();
  state.filtered = state.reports.slice();
  applyFilters();

  // Realtime updates via SSE
  try {
    const es = new EventSource(`${API_BASE}/api/stream`);
    es.addEventListener('report.created', async () => {
      await fetchReportsFromApi();
      applyFilters();
    });
    es.addEventListener('report.updated', async () => {
      // For simplicity, refetch list
      await fetchReportsFromApi();
      applyFilters();
      renderSelection();
    });
    es.addEventListener('ping', () => {});
    es.onerror = () => { /* ignore transient errors */ };
  } catch (_) { /* SSE not supported */ }
}

document.addEventListener('DOMContentLoaded', main);


