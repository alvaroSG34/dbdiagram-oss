/**
 * Script de prueba para verificar la generación de SpringBoot
 */

import { springBootExportService } from './src/services/springBootExportService.js'

// Schema de prueba con diferentes tipos de datos
const testSchema = {
  tables: [
    {
      name: 'products',
      fields: [
        { name: 'id', type: 'int', pk: true, increment: true },
        { name: 'name', type: 'varchar(255)', not_null: true },
        { name: 'price', type: 'decimal(10,2)', not_null: true },
        { name: 'description', type: 'text' },
        { name: 'created_at', type: 'timestamp', not_null: true },
        { name: 'updated_at', type: 'timestamp' },
        { name: 'is_active', type: 'boolean', not_null: true }
      ]
    },
    {
      name: 'categories',
      fields: [
        { name: 'id', type: 'int', pk: true, increment: true },
        { name: 'name', type: 'varchar(100)', not_null: true },
        { name: 'description', type: 'text' },
        { name: 'created_at', type: 'timestamp', not_null: true }
      ]
    }
  ]
}

async function testGeneration() {
  try {
    console.log('🧪 Iniciando prueba de generación SpringBoot...')
    
    const zipBlob = await springBootExportService.exportToSpringBoot(testSchema, {
      packageName: 'com.test.generated',
      artifactId: 'test-project',
      groupId: 'com.test'
    })
    
    console.log('✅ Generación exitosa!')
    console.log('📦 Tamaño del ZIP:', zipBlob.size, 'bytes')
    
    // Crear y descargar el archivo de prueba
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `test-springboot-project-${new Date().getTime()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    console.log('📥 Archivo descargado para verificación')
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar prueba si estamos en el navegador
if (typeof window !== 'undefined') {
  testGeneration()
}

export { testGeneration }

