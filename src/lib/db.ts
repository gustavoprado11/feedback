import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Types
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  alertEmail: string;
  userId: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  rating: 'bad' | 'okay' | 'great';
  comment?: string;
  establishmentId: string;
  createdAt: string;
}

interface Database {
  users: User[];
  establishments: Establishment[];
  feedbacks: Feedback[];
}

// Helper functions to read/write database
function readDb(): Database {
  const dbPath = path.join(DATA_DIR, 'db.json');
  if (!fs.existsSync(dbPath)) {
    const initialDb: Database = { users: [], establishments: [], feedbacks: [] };
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDb(db: Database): void {
  const dbPath = path.join(DATA_DIR, 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// User operations
export function createUser(email: string, hashedPassword: string): User {
  const db = readDb();
  const user: User = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

// Establishment operations
export function createEstablishment(data: {
  name: string;
  slug: string;
  alertEmail: string;
  userId: string;
}): Establishment {
  const db = readDb();
  const establishment: Establishment = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  db.establishments.push(establishment);
  writeDb(db);
  return establishment;
}

export function findEstablishmentBySlug(slug: string): Establishment | undefined {
  const db = readDb();
  return db.establishments.find(e => e.slug === slug);
}

export function findEstablishmentById(id: string): Establishment | undefined {
  const db = readDb();
  return db.establishments.find(e => e.id === id);
}

export function findEstablishmentsByUserId(userId: string): Establishment[] {
  const db = readDb();
  return db.establishments.filter(e => e.userId === userId);
}

export function updateEstablishment(id: string, data: Partial<Establishment>): Establishment | null {
  const db = readDb();
  const index = db.establishments.findIndex(e => e.id === id);
  if (index === -1) return null;
  db.establishments[index] = { ...db.establishments[index], ...data };
  writeDb(db);
  return db.establishments[index];
}

// Feedback operations
export function createFeedback(data: {
  rating: 'bad' | 'okay' | 'great';
  comment?: string;
  establishmentId: string;
}): Feedback {
  const db = readDb();
  const feedback: Feedback = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  db.feedbacks.push(feedback);
  writeDb(db);
  return feedback;
}

export function findFeedbacksByEstablishmentId(
  establishmentId: string,
  options?: { days?: number; rating?: string }
): Feedback[] {
  const db = readDb();
  let feedbacks = db.feedbacks.filter(f => f.establishmentId === establishmentId);

  if (options?.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - options.days);
    feedbacks = feedbacks.filter(f => new Date(f.createdAt) >= cutoff);
  }

  if (options?.rating) {
    feedbacks = feedbacks.filter(f => f.rating === options.rating);
  }

  return feedbacks.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getFeedbackStats(establishmentId: string): {
  total: number;
  happiness: number;
  issues: number;
} {
  const feedbacks = findFeedbacksByEstablishmentId(establishmentId);
  const total = feedbacks.length;
  const positive = feedbacks.filter(f => f.rating === 'great').length;
  const negative = feedbacks.filter(f => f.rating === 'bad').length;

  return {
    total,
    happiness: total > 0 ? Math.round((positive / total) * 100) : 0,
    issues: negative,
  };
}
