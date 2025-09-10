'use strict'

require('dotenv').config()
const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
// Switch to CSV storage

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// Simple in-memory SSE clients
const sseClients = new Set()
function sseBroadcast(event, payload) {
  const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`
  for (const res of sseClients) {
    try { res.write(data) } catch (_) {}
  }
}

// Push notification function (simplified for demo)
function sendPushNotification(userId, title, body, data) {
  // In a real implementation, you would:
  // 1. Store user push tokens in database
  // 2. Send notifications via Expo Push API or FCM
  // 3. Handle different notification channels
  
  console.log(`Push notification for user ${userId}:`, { title, body, data });
  
  // For demo purposes, we'll just log the notification
  // In production, integrate with Expo Push API:
  // https://docs.expo.dev/push-notifications/sending-notifications/
}

function readCsv(file) {
  const txt = fs.readFileSync(path.join(DATA_DIR, file), 'utf8')
  const [headerLine, ...lines] = txt.trim().split(/\r?\n/)
  const headers = headerLine.split(',')
  return lines.filter(Boolean).map(line => {
    const cols = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        cols.push(current); current = ''
      } else { current += ch }
    }
    cols.push(current)
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = cols[idx] })
    return obj
  })
}

function writeCsv(file, rows) {
  if (!rows.length) return fs.writeFileSync(path.join(DATA_DIR, file), '')
  const headers = Object.keys(rows[0])
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(',')))
  fs.writeFileSync(path.join(DATA_DIR, file), lines.join('\n'))
}

// Serve static files
app.use(express.static(path.join(__dirname)))
app.use('/uploads', express.static(UPLOADS_DIR))

// Health
app.get('/api/health', (req, res) => {
  try {
    fs.accessSync(DATA_DIR)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Realtime updates (SSE)
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  // send initial heartbeat
  res.write('event: ping\n')
  res.write('data: {"ok":true}\n\n')
  sseClients.add(res)
  req.on('close', () => { sseClients.delete(res) })
})

// List reports with filters
app.get('/api/reports', (req, res) => {
  try {
    const users = readCsv('users.csv')
    const reports = readCsv('reports.csv')
    const atts = readCsv('report_attachments.csv')
    const groupedAtt = atts.reduce((m, a) => {
      const rid = Number(a.report_id); m[rid] = m[rid] || []; m[rid].push(a.url); return m
    }, {})
    const userById = users.reduce((m, u) => { m[Number(u.id)] = u; return m }, {})
    const acts = readCsv('report_activity.csv')
    const groupedActs = acts.reduce((m, a) => {
      const rid = Number(a.report_id); m[rid] = m[rid] || []; m[rid].push({ ts: a.occurred_at, text: a.message }); return m
    }, {})
    
    let data = reports.map(r => ({
      id: Number(r.id),
      createdAt: r.created_at,
      category: r.category,
      description: r.description,
      priority: r.priority,
      status: r.status,
      department: r.department,
      reporter: (() => { const u = userById[Number(r.user_id)] || {}; return { name: u.name, email: u.email, phone: u.phone } })(),
      location: { address: r.location_address, lat: Number(r.location_lat), lng: Number(r.location_lng) },
      attachments: groupedAtt[Number(r.id)] || [],
      activity: groupedActs[Number(r.id)] || [],
    }))
    // basic filters
    const { status, priority, category, department, q, range } = req.query
    if (status && status !== 'all') data = data.filter(d => d.status === status)
    if (priority && priority !== 'all') data = data.filter(d => d.priority === priority)
    if (category && category !== 'all') data = data.filter(d => d.category === category)
    if (department && department !== 'all') data = data.filter(d => d.department === department)
    if (q) {
      const s = String(q).toLowerCase()
      data = data.filter(d => String(d.id).includes(s) || (d.description||'').toLowerCase().includes(s) || (d.location.address||'').toLowerCase().includes(s))
    }
    if (range && range !== 'all') {
      const now = new Date()
      let start = null
      if (range === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (range === 'week') { start = new Date(now); start.setDate(now.getDate() - 7) }
      if (range === 'month') { start = new Date(now); start.setMonth(now.getMonth() - 1) }
      if (start) data = data.filter(d => new Date(d.createdAt) >= start)
    }
    data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get details including activity
app.get('/api/reports/:id', (req, res) => {
  const id = Number(req.params.id)
  try {
    const users = readCsv('users.csv')
    const reports = readCsv('reports.csv')
    const atts = readCsv('report_attachments.csv')
    const acts = readCsv('report_activity.csv')
    const r = reports.find(r => Number(r.id) === id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    const u = users.find(u => Number(u.id) === Number(r.user_id)) || {}
    const attachments = atts.filter(a => Number(a.report_id) === id).map(a => a.url)
    const activity = acts.filter(a => Number(a.report_id) === id).sort((a,b) => new Date(b.occurred_at) - new Date(a.occurred_at)).map(a => ({ ts: a.occurred_at, text: a.message }))
    res.json({
      id,
      createdAt: r.created_at,
      category: r.category,
      description: r.description,
      priority: r.priority,
      status: r.status,
      department: r.department,
      reporter: { name: u.name, email: u.email, phone: u.phone },
      location: { address: r.location_address, lat: Number(r.location_lat), lng: Number(r.location_lng) },
      attachments,
      activity,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update status / department
app.patch('/api/reports/:id', (req, res) => {
  const id = Number(req.params.id)
  const { status, department } = req.body || {}
  if (!status && !department) return res.status(400).json({ error: 'No changes' })
  try {
    const reports = readCsv('reports.csv')
    const idx = reports.findIndex(r => Number(r.id) === id)
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    if (status) reports[idx].status = status
    if (department) reports[idx].department = department
    writeCsv('reports.csv', reports)
    // append activity
    const acts = readCsv('report_activity.csv')
    const newId = acts.length ? (Math.max(...acts.map(a => Number(a.id))) + 1) : 1
    const messages = []
    if (status) messages.push(`Status changed to ${status}`)
    if (department) messages.push(`Reassigned to ${department}`)
    const now = new Date().toISOString()
    messages.forEach(m => acts.push({ id: String(newId + acts.length), report_id: String(id), occurred_at: now, message: m }))
    writeCsv('report_activity.csv', acts)
    const updated = { id, status: reports[idx].status, department: reports[idx].department }
    
    // Send push notification
    const report = reports[idx]
    if (report.user_id) {
      let notificationTitle = 'Report Updated'
      let notificationBody = 'Your report status has been updated.'
      
      if (status) {
        switch (status) {
          case 'acknowledged':
            notificationTitle = 'Report Acknowledged'
            notificationBody = 'Your report has been acknowledged and is being reviewed.'
            break
          case 'in_progress':
            notificationTitle = 'Work In Progress'
            notificationBody = 'Work has started on your report.'
            break
          case 'resolved':
            notificationTitle = 'Report Resolved'
            notificationBody = 'Your report has been resolved!'
            break
          case 'rejected':
            notificationTitle = 'Report Update'
            notificationBody = 'Your report status has been updated.'
            break
        }
      }
      
      sendPushNotification(report.user_id, notificationTitle, notificationBody, {
        type: 'report_updated',
        reportId: id,
        status: updated.status
      })
    }
    
    // broadcast update
    sseBroadcast('report.updated', { id, status: updated.status, department: updated.department })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Create report (from mobile app)
app.post('/api/reports', (req, res) => {
  try {
    const { description, imageUri, location, reporter } = req.body || {}
    if (!description || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: description, location.lat, location.lng' })
    }
    // Routing engine: infer department/priority from category/description
    function computeRouting({ description = '', category = '' }) {
      const text = `${category} ${description}`.toLowerCase()
      let department = ''
      let priority = ''
      if (text.includes('pothole') || text.includes('road') || text.includes('asphalt')) department = 'public_works'
      if (text.includes('garbage') || text.includes('trash') || text.includes('sanitation')) department = 'sanitation'
      if (text.includes('light') || text.includes('streetlight') || text.includes('lamp')) department = 'public_works'
      if (text.includes('bus') || text.includes('traffic') || text.includes('signal')) department = 'transport'
      if (text.includes('park') || text.includes('tree') || text.includes('garden')) department = 'parks'
      if (text.includes('urgent') || text.includes('hazard') || text.includes('accident') || text.includes('electrical')) priority = 'high'
      if (text.includes('critical') || text.includes('danger')) priority = 'critical'
      if (text.includes('minor') || text.includes('small')) priority = 'low'
      if (!priority) priority = 'medium'
      return { department, priority }
    }
    // users.csv: find or create by email (if provided) else by name/phone
    const users = readCsv('users.csv')
    let userId = null
    if (reporter && (reporter.email || reporter.phone || reporter.name)) {
      const match = users.find(u => (reporter.email && u.email === reporter.email) || (reporter.phone && u.phone === reporter.phone))
      if (match) {
        userId = Number(match.id)
      } else {
        const newUserId = users.length ? Math.max(...users.map(u => Number(u.id))) + 1 : 1
        const now = new Date().toISOString()
        users.push({ id: String(newUserId), name: reporter.name || 'Anonymous', email: reporter.email || '', phone: reporter.phone || '', created_at: now, updated_at: now })
        writeCsv('users.csv', users)
        userId = newUserId
      }
    }
    const reports = readCsv('reports.csv')
    const newReportId = reports.length ? Math.max(...reports.map(r => Number(r.id))) + 1 : 1001
    const now = new Date().toISOString()
    const category = (req.body.category || 'other')
    const routing = computeRouting({ description: String(description), category })
    const finalPriority = (req.body.priority || routing.priority)
    const finalDepartment = (req.body.department || routing.department)
    reports.push({
      id: String(newReportId),
      user_id: userId ? String(userId) : '',
      created_at: now,
      category,
      description: String(description),
      priority: finalPriority,
      status: 'new',
      department: finalDepartment,
      location_address: (location.address || ''),
      location_lat: String(location.lat),
      location_lng: String(location.lng),
    })
    writeCsv('reports.csv', reports)

    // add activity
    const acts = readCsv('report_activity.csv')
    const nextActId = acts.length ? Math.max(...acts.map(a => Number(a.id))) + 1 : 1
    acts.push({ id: String(nextActId), report_id: String(newReportId), occurred_at: now, message: 'Report created' })
    // Log routing decision
    const routeMsg = `Auto-routed: priority=${finalPriority}${finalDepartment ? `, department=${finalDepartment.replace('_',' ')}`: ''}`
    acts.push({ id: String(nextActId + 1), report_id: String(newReportId), occurred_at: now, message: routeMsg })
    writeCsv('report_activity.csv', acts)

    // save attachment if provided (data URL) else store URL
    if (imageUri && typeof imageUri === 'string') {
      const atts = readCsv('report_attachments.csv')
      const nextAttId = atts.length ? Math.max(...atts.map(a => Number(a.id))) + 1 : 1
      let url = imageUri
      if (imageUri.startsWith('data:image/')) {
        const ext = imageUri.substring(imageUri.indexOf('/') + 1, imageUri.indexOf(';')) || 'png'
        const base64 = imageUri.split(',')[1]
        const buf = Buffer.from(base64, 'base64')
        const filename = `report_${newReportId}_${Date.now()}.${ext}`
        const filepath = path.join(UPLOADS_DIR, filename)
        fs.writeFileSync(filepath, buf)
        url = `/uploads/${filename}`
      }
      atts.push({ id: String(nextAttId), report_id: String(newReportId), url, created_at: now })
      writeCsv('report_attachments.csv', atts)
    }

    // broadcast creation
    sseBroadcast('report.created', { id: newReportId })

    res.status(201).json({ id: newReportId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`)
  console.log(`Server accessible from network on: http://192.168.1.2:${port}`)
  console.log('Other laptops can access the admin panel at: http://192.168.1.2:3000')
})


