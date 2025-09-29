<template>
  <svg
    ref="root"
    :id="`tablegroup-${id}`"
    :class="{
      'db-tablegroup':true,
      'db-tablegroup__highlight': highlight,
      'db-tablegroup__dragging': dragging
    }"
    :x="state.x"
    :y="state.y"
    :width="state.width"
    :height="state.height"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave">

    <rect class="db-tablegroup__background"
          :width="state.width"
          :height="state.height"
    />
    <g class="db-tablegroup-header"
       @mousedown.passive="startDrag"
    >
      <rect
        height="30"
        :width="state.width"
      />
      <text class="db-tablegroup-header__name"
            y="16"
      >
        {{ name }}
      </text>
      <title>{{ name }}</title>
      <line x1="0" y1="30" y2="30"
            :x2="state.width"
            class="db-tablegroup-header__separator"
      />
    </g>

  </svg>
</template>

<script setup>
  import { useChartStore } from '../../store/chart'
  import { computed, ref, watch, onMounted } from 'vue'
  import { snap } from '../../utils/MathUtil'
  import { sendDiagramUpdate } from '../../boot/socket'
  import { throttle } from 'lodash'

  const props = defineProps({
    name: String,
    tables: Array,
    schema: Object,
    dbState: Object,
    id: Number,
    containerRef: Object
  })
  const store = useChartStore()

  const state = computed(() => store.getTableGroup(props.id))
  const root = ref(null)
  const affectedTables = ref([])

  const updateSize = () => {
    const tableStates = props.tables.map(t => store.getTable(t.id));
console.log(tableStates);
    const minX = tableStates.reduce((prev, curr) => !prev ? curr.x : Math.min(prev, curr.x), 0);
    const maxX = tableStates.reduce((prev, curr) => !prev ? curr.x + curr.width : Math.max(prev, curr.x + curr.width), 0);
    const minY = tableStates.reduce((prev, curr) => !prev ? curr.y : Math.min(prev, curr.y), 0);
    const maxY = tableStates.reduce((prev, curr) => !prev ? curr.y + curr.height : Math.max(prev, curr.y + curr.height), 0);

    console.log(minX, maxX, minY, maxY);
    state.value.x = minX - 20;
    state.value.y = minY - 20 - 35;
    state.value.width = Math.abs(maxX-minX) + 40;
    state.value.height = Math.abs(maxY-minY) + 40 + 35;
  }

  watch(() => props.tables, value => {
    affectedTables.value = props.tables.map(t => store.getTable(t.id))
    updateSize()
  }, {
    deep: true
  })

  onMounted(() => {
    affectedTables.value = props.tables.map(t => store.getTable(t.id))
    updateSize()
  })

  watch(affectedTables, () => {
    updateSize()
  }, {
    deep: true
  })

  const highlight = ref(false)
  const dragging = ref(false)
  // Define dragOffset as an object with x and y properties
  const dragOffset = { x: 0, y: 0 }
  const gridSize = store.subGridSize
  const gridSnap = store.grid.snap

  const onMouseEnter = (e) => {
    highlight.value = true
  }
  const onMouseLeave = (e) => {
    highlight.value = false
    dragging.value = false
  }
  
  // Throttled function to send position updates during dragging
  const sendThrottledPositionUpdate = throttle((groupPosition, tables) => {
    // Enviar la posición del grupo de tablas durante el arrastre
    if (window.sendRoomDiagramUpdate) {
      window.sendRoomDiagramUpdate('tablegroup-position-update', {
        groupId: props.id,
        position: groupPosition,
        isDragging: true // Flag to indicate this is a throttled update during drag
      });

      // También enviar las posiciones actualizadas de cada tabla del grupo
      for(const table of tables) {
        window.sendRoomDiagramUpdate('table-position-update', {
          tableId: table.id,
          position: {
            x: table.x,
            y: table.y
          },
          isDragging: true // Flag to indicate this is a throttled update during drag
        });
      }
    } else {
      sendDiagramUpdate('tablegroup-position-update', {
        groupId: props.id,
        position: groupPosition,
        isDragging: true // Flag to indicate this is a throttled update during drag
      });

      // También enviar las posiciones actualizadas de cada tabla del grupo
      for(const table of tables) {
        sendDiagramUpdate('table-position-update', {
          tableId: table.id,
          position: {
            x: table.x,
            y: table.y
          },
          isDragging: true // Flag to indicate this is a throttled update during drag
        });
      }
    }
  }, 50); // Send at most one update every 50ms

  const drag = ({
    offsetX,
    offsetY
  }) => {
    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })
    const newX = snap(p.x - dragOffset.x, gridSnap)
    const newY = snap(p.y - dragOffset.y, gridSnap)

    const dX = newX - state.value.x;
    const dY = newY - state.value.y;

    for(const table of affectedTables.value) {
      table.x = table.x + dX;
      table.y = table.y + dY;
    }
    
    // Send throttled position updates during dragging
    sendThrottledPositionUpdate(
      { x: state.value.x, y: state.value.y },
      affectedTables.value
    );
  }
  
  const drop = (e) => {
    dragging.value = false
    highlight.value = false

    // Cancel any pending throttled updates
    sendThrottledPositionUpdate.cancel();

    console.log(`TableGroup ${props.id} movido a:`, {x: state.value.x, y: state.value.y});
    console.log("Tablas afectadas:", affectedTables.value);
    
    // Enviar actualización final con la posición exacta al soltar
    // Enviar la posición final del grupo de tablas
    if (window.sendRoomDiagramUpdate) {
      window.sendRoomDiagramUpdate('tablegroup-position-update', {
        groupId: props.id,
        position: {
          x: state.value.x,
          y: state.value.y
        },
        isDragging: false // Final position update
      });

      // También enviar las posiciones actualizadas de cada tabla del grupo
      for(const table of affectedTables.value) {
        window.sendRoomDiagramUpdate('table-position-update', {
          tableId: table.id,
          position: {
            x: table.x,
            y: table.y
          },
          isDragging: false // Final position update
        });
      }
    } else {
      sendDiagramUpdate('tablegroup-position-update', {
        groupId: props.id,
        position: {
          x: state.value.x,
          y: state.value.y
        },
        isDragging: false // Final position update
      });

      // También enviar las posiciones actualizadas de cada tabla del grupo
      for(const table of affectedTables.value) {
        sendDiagramUpdate('table-position-update', {
          tableId: table.id,
          position: {
            x: table.x,
            y: table.y
          },
          isDragging: false // Final position update
        });
      }
    }
    
    // Reset drag offset and remove event listeners
    dragOffset.x = 0
    dragOffset.y = 0
    props.containerRef.removeEventListener('mousemove', drag, { passive: true })
    props.containerRef.removeEventListener('mouseup', drop, { passive: true })
    props.containerRef.removeEventListener('mouseleave', onMouseLeave, { passive: true })
  }
  
  const startDrag = ({
    offsetX,
    offsetY
  }) => {
    dragging.value = true

    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })
    dragOffset.x = p.x - state.value.x
    dragOffset.y = p.y - state.value.y

    props.containerRef.addEventListener('mousemove', drag, { passive: true })
    props.containerRef.addEventListener('mouseup', drop, { passive: true })
    props.containerRef.addEventListener('mouseleave', onMouseLeave, { passive: true })
  }
</script>
