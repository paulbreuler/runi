/**
 * Bookshelf API — Demo server for runi
 *
 * Run v0.1:  node server.js --version=1   (port 3000)
 * Run v0.2:  node server.js --version=2   (port 3000)
 *
 * v0.2 introduces breaking changes that runi's drift detection will catch.
 */

import express from 'express';

// ─── Parse CLI args ────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const VERSION = String(args.version ?? '1');
const PORT = Number(args.port ?? 3000);

if (!['1', '2'].includes(VERSION)) {
  console.error('Usage: node server.js --version=1|2');
  process.exit(1);
}

const app = express();
app.use(express.json());

// ─── In-memory data store ──────────────────────────────────────────────────────
// Intentional issue: using sequential IDs (guessable). AI will flag this.
let nextId = 4;
const books = [
  {
    id: 1,
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    published_at: '2017-03-16',
    genre: 'Technology',
    pages: 616,
  },
  {
    id: 2,
    title: 'The Pragmatic Programmer',
    author: 'Dave Thomas',
    published_at: '1999-10-30',
    genre: 'Technology',
    pages: 352,
  },
  {
    id: 3,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    published_at: '2008-08-01',
    genre: 'Technology',
    pages: 431,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

// v0.2 transforms a v0.1 book object into the new field names
const toV2 = (book) => ({
  id: book.id,
  name: book.title, // BREAKING: title → name
  writer: book.author, // BREAKING: author → writer
  publishedDate: book.published_at, // BREAKING: published_at → publishedDate (+ camelCase)
  genre: book.genre,
  pages: book.pages,
  isbn: book.isbn ?? null, // New field in v0.2
});

// ─── Version 0.1 Routes ─────────────────────────────────────────────────────────
function mountV1(app) {
  // Health check
  // Intentional issue: "status" value is "ok" — clients may string-match this.
  // v0.2 will change it to "healthy", silently breaking those clients.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });

  // Serve OpenAPI spec
  app.get('/openapi.json', (req, res) => {
    res.sendFile(new URL('./openapi-v1.json', import.meta.url).pathname);
  });

  // List all books
  // Intentional issues:
  //   1. No pagination — returns ALL books (will scale badly)
  //   2. Wraps in {books: [...]} — v0.2 will rename this to {items: [...]}
  app.get('/books', (req, res) => {
    res.json({ books, total: books.length });
  });

  // Get single book
  app.get('/books/:id', (req, res) => {
    const book = books.find((b) => b.id === Number(req.params.id));
    if (!book) {
      // Intentional issue: inconsistent error shape.
      // Some endpoints use {error: ...}, others {message: ...}
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  });

  // Create book
  // Intentional issue: no input validation — accepts any fields
  app.post('/books', (req, res) => {
    const { title, author, published_at, genre, pages } = req.body;
    if (!title || !author) {
      // Inconsistent error key: uses "message" here, "error" in GET /books/:id
      return res.status(400).json({ message: 'title and author are required' });
    }
    const book = {
      id: nextId++,
      title,
      author,
      published_at: published_at ?? new Date().toISOString().split('T')[0],
      genre: genre ?? 'Unknown',
      pages: pages ?? 0,
    };
    books.push(book);
    res.status(201).json(book);
  });

  // Update book (full replace)
  app.put('/books/:id', (req, res) => {
    const idx = books.findIndex((b) => b.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });
    const { title, author, published_at, genre, pages } = req.body;
    books[idx] = { ...books[idx], title, author, published_at, genre, pages };
    res.json(books[idx]);
  });

  // Delete book
  // Intentional issue: returns 200 + body instead of 204 No Content
  app.delete('/books/:id', (req, res) => {
    const idx = books.findIndex((b) => b.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });
    books.splice(idx, 1);
    res.json({ message: 'Book deleted' }); // Should be 204 with no body
  });
}

// ─── Version 0.2 Routes ─────────────────────────────────────────────────────────
function mountV2(app) {
  // Health check — SUBTLE BREAKING CHANGE: "ok" → "healthy"
  // Clients that do `if (health.status === "ok")` will silently break.
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', version: '0.2.0' });
  });

  // Serve v0.2 OpenAPI spec
  app.get('/openapi.json', (req, res) => {
    res.sendFile(new URL('./openapi-v2.json', import.meta.url).pathname);
  });

  // BREAKING: /books endpoint now returns a deprecation notice.
  // The endpoint still exists but the response shape has changed entirely.
  app.get('/books', (req, res) => {
    res.status(200).json({
      deprecated: true,
      message: 'This endpoint has moved to /catalog. Please update your client.',
      redirect: '/catalog',
    });
  });

  // BREAKING: GET /books/:id removed. Returns 404.
  // Clients using this endpoint will start getting unexpected 404s.
  app.get('/books/:id', (req, res) => {
    res.status(404).json({
      error: 'This endpoint has been removed in v0.2. Use GET /catalog/:id',
    });
  });

  // NEW ENDPOINT: /catalog replaces /books
  // BREAKING: response wrapper changed from "books" to "items"
  // BREAKING: field names changed (title→name, author→writer, published_at→publishedDate)
  app.get('/catalog', (req, res) => {
    res.json({ items: books.map(toV2), count: books.length });
  });

  // NEW ENDPOINT: /catalog/:id replaces /books/:id
  app.get('/catalog/:id', (req, res) => {
    const book = books.find((b) => b.id === Number(req.params.id));
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(toV2(book));
  });

  // BREAKING: POST now goes to /catalog and requires isbn
  app.post('/catalog', (req, res) => {
    const { name, writer, publishedDate, genre, pages, isbn } = req.body;
    if (!name || !writer) {
      return res.status(400).json({ message: 'name and writer are required' });
    }
    // BREAKING: isbn is now required
    if (!isbn) {
      return res.status(400).json({ message: 'isbn is required in v0.2' });
    }
    const book = {
      id: nextId++,
      title: name, // stored internally as v0.1 for simplicity
      author: writer,
      published_at: publishedDate ?? new Date().toISOString().split('T')[0],
      genre: genre ?? 'Unknown',
      pages: pages ?? 0,
      isbn,
    };
    books.push(book);
    res.status(201).json(toV2(book));
  });

  // REMOVED: PUT /books/:id — only PATCH exists now on /catalog/:id
  app.patch('/catalog/:id', (req, res) => {
    const idx = books.findIndex((b) => b.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });
    const { name, writer, publishedDate, genre, pages } = req.body;
    if (name !== undefined) books[idx].title = name;
    if (writer !== undefined) books[idx].author = writer;
    if (publishedDate !== undefined) books[idx].published_at = publishedDate;
    if (genre !== undefined) books[idx].genre = genre;
    if (pages !== undefined) books[idx].pages = pages;
    res.json(toV2(books[idx]));
  });

  // Delete book — still works but on /catalog/:id
  app.delete('/catalog/:id', (req, res) => {
    const idx = books.findIndex((b) => b.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });
    books.splice(idx, 1);
    res.status(204).send(); // v0.2 fixed the 204 issue from v0.1
  });
}

// ─── Mount routes for the requested version ──────────────────────────────────────
if (VERSION === '1') {
  mountV1(app);
  console.log(`📚 Bookshelf API v0.1 running on http://localhost:${PORT}`);
  console.log(`   OpenAPI spec: http://localhost:${PORT}/openapi.json`);
  console.log(`   Issues for AI to find: no pagination, inconsistent errors, sequential IDs`);
} else {
  mountV2(app);
  console.log(`📚 Bookshelf API v0.2 running on http://localhost:${PORT}`);
  console.log(`   Breaking changes: /books→/catalog, field renames, new required isbn field`);
  console.log(`   runi will detect drift when you run requests from the v0.1 collection`);
}

app.listen(PORT);
