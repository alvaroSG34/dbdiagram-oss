<template>
  <g
    v-if="connectionMode.active"
    class="db-connection-line"
  >
    <!-- Línea temporal durante la conexión -->
    <path
      class="db-connection-line__path"
      :d="connectionPath"
      stroke="rgba(0, 123, 255, 0.8)"
      stroke-width="3"
      stroke-dasharray="5,5"
      fill="none"
    />
    
    <!-- Punto de inicio -->
    <circle
      :cx="startPosition.x"
      :cy="startPosition.y"
      r="6"
      fill="rgba(0, 123, 255, 0.8)"
      class="db-connection-line__start-point"
    />
    
    <!-- Punto final (sigue al mouse) -->
    <circle
      :cx="endPosition.x"
      :cy="endPosition.y"
      r="4"
      fill="rgba(0, 123, 255, 0.6)"
      class="db-connection-line__end-point"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { useChartStore } from '../../store/chart'

const store = useChartStore()

const connectionMode = computed(() => store.connectionMode)

const startPosition = computed(() => {
  if (!connectionMode.value.active) {
    return { x: connectionMode.value.tempLine.startX, y: connectionMode.value.tempLine.startY }
  }
  
  if (!connectionMode.value.sourceField || !connectionMode.value.sourceTable) {
    return { x: connectionMode.value.tempLine.startX, y: connectionMode.value.tempLine.startY }
  }
  
  const sourceTable = store.getTable(connectionMode.value.sourceTable.id)
  const fieldIndex = connectionMode.value.sourceTable.fields.findIndex(f => f.id === connectionMode.value.sourceField.id)
  
  return {
    x: sourceTable.x + sourceTable.width, // Lado derecho de la tabla
    y: sourceTable.y + 35 + (30 * fieldIndex) + 15 // Centro del campo
  }
})

const endPosition = computed(() => {
  if (!connectionMode.value.active) {
    return { x: 0, y: 0 }
  }
  
  return {
    x: connectionMode.value.mousePosition.x,
    y: connectionMode.value.mousePosition.y
  }
})

const connectionPath = computed(() => {
  const start = startPosition.value
  const end = endPosition.value
  
  if (!connectionMode.value.active) {
    return ''
  }
  
  // Crear una línea simple entre el punto de inicio y el punto final
  return `M ${start.x},${start.y} L ${end.x},${end.y}`
})
</script>

<style scoped>
.db-connection-line__path {
  pointer-events: none;
  z-index: 999;
}

.db-connection-line__start-point,
.db-connection-line__end-point {
  pointer-events: none;
  z-index: 1000;
}

.db-connection-line__path {
  animation: dash 2s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: 20;
  }
}
</style>