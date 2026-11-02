
import { mkdirSync } from 'node:fs'
import { Database } from 'bun:sqlite'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'

type Note = {
  id: number
  body: string
  created_at: string
}

mkdirSync('data', { recursive: true })

const app = new Hono()
const db = new Database('data/app.db')

// Enable CORS globally
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE']
}))

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

app.get('/health', (c) => c.json({ ok: true }))

// Get all notes, newest first
app.get('/api/notes', (c) => {
  const rows = db.query(
    'SELECT id, body, created_at FROM notes ORDER BY created_at DESC, id DESC'
  ).all() as Note[]

  return c.json({ notes: rows })
})

// Create a note
app.post('/api/notes', async (c) => {
  const body = await c.req.json<{ body?: string }>()

  if (!body.body || body.body.trim().length === 0) {
    return c.json({ error: 'Note body is required' }, 400)
  }

  const result = db.query(
    'INSERT INTO notes (body) VALUES (?)'
  ).run(body.body.trim())

  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

// Delete a note by ID
app.delete('/api/notes/:id', (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid note ID' }, 400)
  }

  const result = db.query(
    'DELETE FROM notes WHERE id = ?'
  ).run(id)

  if (result.changes === 0) {
    return c.json({ error: 'Note not found' }, 404)
  }

  return c.json({ success: true })
})

app.use('/*', serveStatic({ root: './public' }))

export default {
  port: 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
