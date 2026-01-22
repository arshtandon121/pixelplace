/**
 * Script to create database indexes
 * Run this once: npx ts-node scripts/createIndexes.ts
 * Or import and call createIndexes() in your app startup
 */

import { createIndexes } from '../lib/dbIndexes'

async function main() {
  console.log('Creating database indexes...')
  await createIndexes()
  console.log('Done!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

