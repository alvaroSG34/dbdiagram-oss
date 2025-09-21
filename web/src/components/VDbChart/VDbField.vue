<template>
  <svg
    ref="root"
    :id="`field-${id}`"
    :class="{
      'db-field':true,
      'db-field__highlight': highlight,
      'db-field__dragging': dragging,
      'db-field__pk': pk,
      'db-field__unique': unique,
      'db-field__not_null': not_null,
      'db-field__increment': increment,
      'db-field__ref': endpoints.length > 0,
      'db-field__connection-source': isConnectionSource,
      'db-field__connection-target': isConnectionTarget
    }"
    :x="position.x"
    :y="position.y"
    :width="size.width"
    :height="size.height"
    @mousedown.passive="onMouseDown"
    @mouseup.passive="onMouseUp"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave"
  >
    <rect
      :height="size.height"
      :width="size.width"
    />
    <text class="db-field__name"
          :y="size.height/2">
      {{ name }}
    </text>
    <text class="db-field__type"
          :x="size.width"
          :y="size.height/2">
      {{ type.type_name }}
    </text>
    <title>{{name}} ({{type.type_name}})</title>
  </svg>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useChartStore } from '../../store/chart'

  const props = defineProps({
    id: Number,
    selection: String,
    token: Object,
    name: String,
    type: Object,
    unique: Boolean,
    pk: Boolean,
    dbState: Object,
    not_null: Boolean,
    note: String,
    dbdefault: Object,
    increment: Boolean,
    width: Number,
    table: Object,
    endpoints: Array,
    _enum: Object
  })
  const root = ref(null)
  const store = useChartStore()
  
  const emit = defineEmits(['connection-completed'])

  const size = computed(() => ({
    width: props.width,
    height: 30
  }))

  const position = computed(() => ({
    x: 0,
    y: 35 + (props.table.fields.findIndex(f => f.id === props.id) * 30)
  }))

  const mounted = onMounted(() => {
    // nothing so far
  })

  const highlight = ref(false)
  const dragging = ref(false)
  
  // Estados para el modo de conexión
  const isConnectionTarget = computed(() => {
    return store.connectionMode.active && 
           store.connectionMode.sourceField?.id !== props.id
  })
  
  const isConnectionSource = computed(() => {
    return store.connectionMode.active && 
           store.connectionMode.sourceField?.id === props.id
  })

  const onMouseEnter = (e) => {
    highlight.value = true
    
    // Mostrar feedback visual si es un destino válido para conexión
    if (isConnectionTarget.value) {
      e.target.style.cursor = 'crosshair'
      console.log(`Field ${props.name} is a valid connection target`)
    }
  }
  
  const onMouseLeave = (e) => {
    highlight.value = false
    dragging.value = false
    
    // Restaurar cursor
    if (isConnectionTarget.value) {
      e.target.style.cursor = 'default'
    }
  }
  
  const onMouseUp = (e) => {
    dragging.value = false
    
    // Si estamos en modo de conexión y este campo es un destino válido
    if (isConnectionTarget.value) {
      console.log(`Completing connection to field: ${props.name} in table: ${props.table.name}`)
      
      const connectionInfo = store.completeConnection(props, props.table)
      
      if (connectionInfo) {
        // Emitir evento para que el componente padre maneje la creación de la relación
        emit('connection-completed', connectionInfo)
      }
    }
  }
  
  const onMouseDown = (e) => {
    dragging.value = true
    
    // Si no estamos en modo de conexión, podemos iniciar una nueva conexión
    if (!store.connectionMode.active) {
      // Por ahora, usar Ctrl+Click para iniciar conexión
      if (e.ctrlKey || e.metaKey) {
        console.log(`Starting connection from field: ${props.name} in table: ${props.table.name}`)
        store.startConnection(props, props.table)
        
        // Actualizar posición inicial de la línea
        const fieldRect = e.target.getBoundingClientRect()
        const svgRect = e.target.closest('svg').getBoundingClientRect()
        
        const startX = fieldRect.right - svgRect.left
        const startY = fieldRect.top + fieldRect.height/2 - svgRect.top
        
        // Transformar coordenadas SVG
        const p = store.inverseCtm.transformPoint({ x: startX, y: startY })
        
        store.connectionMode.tempLine.startX = p.x
        store.connectionMode.tempLine.startY = p.y
        
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }

</script>

<style scoped>
.db-field__connection-source {
  filter: drop-shadow(0 0 8px rgba(0, 123, 255, 0.8));
}

.db-field__connection-source rect {
  stroke: rgba(0, 123, 255, 0.8);
  stroke-width: 2;
}

.db-field__connection-target:hover {
  filter: drop-shadow(0 0 6px rgba(40, 167, 69, 0.8));
}

.db-field__connection-target:hover rect {
  stroke: rgba(40, 167, 69, 0.8);
  stroke-width: 2;
  fill: rgba(40, 167, 69, 0.1);
}
</style>
