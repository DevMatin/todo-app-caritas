#!/usr/bin/env node

/**
 * Script to add urgency column to tasks table
 * Run this script to migrate the database schema
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Starting database migration...')
    
    // Execute SQL statements directly
    console.log('⚡ Adding urgency column...')
    await prisma.$executeRawUnsafe('ALTER TABLE tasks ADD COLUMN urgency VARCHAR(50)')
    
    console.log('⚡ Creating index...')
    await prisma.$executeRawUnsafe('CREATE INDEX idx_tasks_urgency ON tasks(urgency)')
    
    console.log('⚡ Setting default values...')
    await prisma.$executeRawUnsafe('UPDATE tasks SET urgency = NULL WHERE urgency IS NULL')
    
    console.log('✅ Database migration completed successfully!')
    
    // Verify the column was added
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'urgency'
    `
    
    if (result.length > 0) {
      console.log('✅ Urgency column verified:', result[0])
    } else {
      console.log('❌ Urgency column not found!')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
