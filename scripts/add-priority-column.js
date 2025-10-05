#!/usr/bin/env node
// scripts/add-priority-column.js
const { PrismaClient } = require('@prisma/client');

async function addPriorityColumn() {
  console.log('🔧 Füge priority Spalte zur tasks-Tabelle hinzu...');
  
  const prisma = new PrismaClient();
  
  try {
    // Teste die Verbindung
    await prisma.$connect();
    console.log('✅ Verbindung zur Datenbank erfolgreich');
    
    // Prüfe ob priority Spalte bereits existiert
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND table_schema = 'public'
    `;
    
    const columnNames = columns.map(c => c.column_name);
    console.log('📋 Vorhandene Spalten in tasks:', columnNames);
    
    if (columnNames.includes('priority')) {
      console.log('✅ priority Spalte bereits vorhanden');
    } else {
      console.log('📝 Füge priority Spalte hinzu...');
      await prisma.$executeRaw`
        ALTER TABLE "tasks" 
        ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'mittel'
      `;
      console.log('✅ priority Spalte erfolgreich hinzugefügt');
    }
    
    // Prüfe die aktuelle Struktur
    const updatedColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Aktuelle tasks-Tabelle Struktur:');
    updatedColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (Default: ${col.column_default || 'NULL'})`);
    });
    
    // Teste die priority Spalte
    const taskCount = await prisma.task.count();
    console.log(`📊 Aktuelle Aufgaben: ${taskCount}`);
    
    if (taskCount > 0) {
      const sampleTasks = await prisma.task.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true
        }
      });
      
      console.log('📋 Beispiel-Aufgaben:');
      sampleTasks.forEach(task => {
        console.log(`   - ${task.title}: priority=${task.priority}, status=${task.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen der priority Spalte:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addPriorityColumn()
    .then(() => {
      console.log('🎉 priority Spalte erfolgreich hinzugefügt!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fehler:', error);
      process.exit(1);
    });
}

module.exports = { addPriorityColumn };
