import { ref } from 'vue'

// Estado global para manejar la inserción de DBML
const dbmlInsertionRequest = ref(null)
const insertionHandlers = new Set()

export const useDbmlInsertion = () => {
  // Función para solicitar inserción de DBML (usado por ChatPanel)
  const requestDbmlInsertion = (dbmlCode, mode = 'append') => {
    console.log('🔄 Solicitando inserción de DBML:', { dbmlCode: dbmlCode.substring(0, 50) + '...', mode })
    
    const request = {
      id: Date.now(),
      dbmlCode,
      mode,
      timestamp: new Date()
    }
    
    dbmlInsertionRequest.value = request
    
    // Notificar a todos los manejadores registrados
    insertionHandlers.forEach(handler => {
      try {
        handler(request)
      } catch (error) {
        console.error('Error en handler de inserción DBML:', error)
      }
    })
  }
  
  // Función para registrar un manejador de inserción (usado por editores)
  const registerInsertionHandler = (handler) => {
    console.log('📝 Registrando handler de inserción DBML')
    insertionHandlers.add(handler)
    
    // Retornar función de limpieza
    return () => {
      insertionHandlers.delete(handler)
    }
  }
  
  // Función para obtener el estado actual
  const getCurrentRequest = () => dbmlInsertionRequest.value
  
  return {
    requestDbmlInsertion,
    registerInsertionHandler,
    getCurrentRequest
  }
}