import { MongoClient, Db } from 'mongodb'

const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient> | null = null

function getClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local')
  }

  if (clientPromise) {
    return clientPromise
  }

  const uri: string = process.env.MONGODB_URI

  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

// Export a function instead of the promise to avoid evaluation at build time
export default getClientPromise

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  return client.db('pixelplace')
}

