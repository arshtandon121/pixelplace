import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface User {
  _id?: string
  email: string
  password: string
  name: string
  createdAt?: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb()
  const user = await db.collection('users').findOne({ email: email.toLowerCase() })
  if (!user) return null
  return {
    _id: user._id.toString(),
    email: user.email,
    password: user.password,
    name: user.name,
    createdAt: user.createdAt,
  }
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const db = await getDb()
  const hashedPassword = await hashPassword(password)
  const userData = {
    email: email.toLowerCase(), // Store email in lowercase for consistency
    password: hashedPassword,
    name,
    createdAt: new Date(),
  }
  const result = await db.collection('users').insertOne(userData)
  return {
    _id: result.insertedId.toString(),
    ...userData,
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = await getDb()
  const { ObjectId } = await import('mongodb')
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    if (!user) return null
    return {
      _id: user._id.toString(),
      email: user.email,
      password: user.password,
      name: user.name,
      createdAt: user.createdAt,
    }
  } catch {
    return null
  }
}

