<template>
  <g
    ref="root"
    :id="`ref-${id}`"
    :class="{
      'db-ref':true,
      'db-ref__highlight': highlight,
      'db-ref__association': relationType === 'association',
      'db-ref__composition': relationType === 'composition',
      'db-ref__aggregation': relationType === 'aggregation',
      'db-ref__generalization': relationType === 'generalization'
    }"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave"
  >
    <path
      class="db-ref__hitbox"
      :d="path"
    />
    <path
      class="db-ref__path"
      :d="path"
    />
    
    <!-- Start Marker based on relationship type -->
    <g v-if="startMarker" :transform="`translate(${startMarkerPosition.x}, ${startMarkerPosition.y}) rotate(${startMarkerRotation})`">
      <g v-if="relationType === 'composition'" class="db-ref__marker db-ref__marker-composition-start">
        <path d="M 50,0 L 25,-15 L 0,0 L 25,15 Z" fill="black" stroke="black" stroke-width="3" />
      </g>
      <g v-else-if="relationType === 'aggregation'" class="db-ref__marker db-ref__marker-aggregation-start">
        <path d="M 50,0 L 25,-15 L 0,0 L 25,15 Z" fill="white" stroke="black" stroke-width="3" />
      </g>
      <g v-else-if="relationType === 'generalization'" class="db-ref__marker db-ref__marker-generalization-start">
        <path d="M -15,-10 L 0,0 L -50,10 Z" fill="white" stroke="black" stroke-width="2" />
      </g>
      <g v-else-if="relationType === 'association'" class="db-ref__marker db-ref__marker-association-start">
        <!-- No marker for simple association start -->
      </g>
    </g>

    <!-- End Marker based on relationship type -->
    <g v-if="endMarker" :transform="`translate(${endMarkerPosition.x}, ${endMarkerPosition.y}) rotate(${endMarkerRotation})`">
      <g v-if="relationType === 'association'" class="db-ref__marker db-ref__marker-association-end">
        <path d="M 0,-7.5 L 15,0 L 0,7.5" fill="none" stroke="black" stroke-width="2" />
      </g>
      <g v-else-if="relationType === 'generalization'" class="db-ref__marker db-ref__marker-generalization-end">
        <path d="M -25,-18 L 0,0 L -25,18 Z" fill="white" stroke="black" stroke-width="3" />
      </g>
      <g v-else-if="relationType === 'composition'" class="db-ref__marker db-ref__marker-composition-end">
        <path d="M 0,-7.5 L 15,0 L 0,7.5" fill="none" stroke="black" stroke-width="2" />
      </g>
      <g v-else-if="relationType === 'aggregation'" class="db-ref__marker db-ref__marker-aggregation-end">
        <path d="M -15,-10 L 0,0 L -15,10 Z" fill="none" stroke="black" stroke-width="2" />
      </g>
    </g>
    
    <g class="db-ref__control-points">
      <circle v-for="(v,i) of controlPoints"
              :key="i"
              :cx="v.x"
              :cy="v.y"
              :class="{
                'db-ref__control-point': true,
                'db-ref__control-point__highlight': i === controlPoint_highlighted,
                'db-ref__control-point__dragging': i === controlPoint_dragging,
              }"
              :data-id="i"
              @dblclick.passive="controlPoint_onDblClick"
              @mousedown.passive="controlPoint_startDrag"
              @mouseenter.passive="controlPoint_onMouseEnter"
              @mouseleave.passive="controlPoint_onMouseLeave"
      />
    </g>

  </g>
</template>

<script setup>
  import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, reactive, ref, watch, watchEffect } from 'vue'
  import { useChartStore } from '../../store/chart'
  import { snap } from '../../utils/MathUtil'

  const props = defineProps({
    id: Number,
    name: String,
    endpoints: Array,
    onUpdate: [String, Object, undefined],
    onDelete: [String, Object, undefined],
    schema: Object,
    dbState: Object,
    database: Object,
    token: Object,
    containerRef: Object,
    relationType: {
      type: String,
      default: 'association', // association, composition, aggregation, generalization
      validator: (value) => ['association', 'composition', 'aggregation', 'generalization'].includes(value)
    },
    startMarker: {
      type: Boolean,
      default: false
    },
    endMarker: {
      type: Boolean,
      default: true
    }
  })

  const store = useChartStore()
  let s = store.getRef(props.id)

  // Create a reactive property for the relationship type
  const relationType = ref(s.relationType || props.relationType || 'association')
  
  // Always update the relationType when the store changes
  watch(() => store.refs[props.id]?.relationType, (newType) => {
    if (newType && newType !== relationType.value) {
      console.log(`VDbRefUml ${props.id}: Updating relationType from ${relationType.value} to ${newType}`)
      relationType.value = newType
    }
  })

  const gridSize = store.subGridSize
  const gridSnap = store.grid.snap

  const highlight = ref(false)
  const affectedTables = ref([])
  const d = ref('')

  const getPositionAnchors = (endpoint) => {
    const s = store.getTable(endpoint.fields[0].table.id)
    const fieldIndex = endpoint.fields[0].table.fields.findIndex(f => f.id === endpoint.fields[0].id)

    return [
      {
        x: s.x,
        y: s.y + 35 + (30 * fieldIndex) + (30 / 2.0)
      },
      {
        x: s.x + s.width,
        y: s.y + 35 + (30 * fieldIndex) + (30 / 2.0)
      }
    ]
  }

  const getClosestAnchor = (point, anchors) => {
    const withDistances = anchors.map(a => ({
        distanceXY: {
          x: (a.x - point.x),
          y: (a.y - point.y)
        },
        distance: Math.sqrt(
          ((a.x - point.x) * (a.x - point.x))
          + ((a.y - point.y) * (a.y - point.y))
        ),
        anchor: a
      })
    )

    let smallest = withDistances[0]
    for (const withDistance of withDistances) {
      if (withDistance.distance < smallest.distance) {
        smallest = withDistance
      }
    }

    return smallest.anchor
  }

  const getClosest = (anchorsA, anchorsB) => {
    const withDistances = anchorsA.flatMap(a => anchorsB.map(b => ({
        distanceXY: {
          x: (a.x - b.x),
          y: (a.y - b.y)
        },
        distance: Math.sqrt(
          ((a.x - b.x) * (a.x - b.x))
          + ((a.y - b.y) * (a.y - b.y))
        ),
        a: a,
        b: b
      })
    ))
    let smallest = withDistances[0]
    for (const withDistance of withDistances) {
      if (withDistance.distance < smallest.distance) {
        smallest = withDistance
      }
    }

    return [smallest.a, smallest.b]
  }

  const startAnchors = computed(() => {
    return getPositionAnchors(props.endpoints[0])
  })
  const endAnchors = computed(() => {
    return getPositionAnchors(props.endpoints[1])
  })

  const controlPoints = computed(() => {
    if (!s.vertices.length || s.vertices.some(v => Number.isNaN(v.x) || Number.isNaN(v.y))) {
      updateControlPoints()
    }
    if (!s.vertices.length || s.vertices.some(v => Number.isNaN(v.x) || Number.isNaN(v.y))) {
      return []
    }
    return s.vertices
  })

  const updateControlPoints = () => {
    const startElAnchors = startAnchors.value
    const endElAnchors = endAnchors.value

    // Para líneas rectas: sin puntos intermedios, conexión directa
    if (!s.vertices.length || s.vertices.some(v => Number.isNaN(v.x) || Number.isNaN(v.y))) {
      s.auto = true
      // No necesitamos puntos intermedios para líneas rectas
      s.vertices = []
    }
  }

  const path = computed(() => {
    const startElAnchors = startAnchors.value
    const endElAnchors = endAnchors.value

    // Para líneas rectas: conexión directa entre los puntos más cercanos
    const [start, end] = getClosest(startElAnchors, endElAnchors)
    
    // Línea recta directa sin puntos intermedios
    return `M ${start.x},${start.y} L ${end.x},${end.y}`
  })

  // Calculate marker positions and rotation angles for straight lines
  const startMarkerPosition = computed(() => {
    const startElAnchors = startAnchors.value
    const endElAnchors = endAnchors.value
    const [start, end] = getClosest(startElAnchors, endElAnchors)
    return start
  })

  const endMarkerPosition = computed(() => {
    const startElAnchors = startAnchors.value
    const endElAnchors = endAnchors.value
    const [start, end] = getClosest(startElAnchors, endElAnchors)
    return end
  })

  const startMarkerRotation = computed(() => {
    const startPos = startMarkerPosition.value
    const endPos = endMarkerPosition.value
    
    const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * 180 / Math.PI
    return angle
  })

  const endMarkerRotation = computed(() => {
    const startPos = startMarkerPosition.value
    const endPos = endMarkerPosition.value
    
    const angle = Math.atan2(startPos.y - endPos.y, startPos.x - endPos.x) * 180 / Math.PI
    return angle
  })

  const onMouseEnter = (e) => {
    highlight.value = true
  }
  const onMouseLeave = (e) => {
    highlight.value = false
  }

  const controlPoint_highlighted = ref(null)
  const controlPoint_dragging = ref(null)
  const controlPoint_dragOffset = reactive({
    x: 0,
    y: 0
  })

  const controlPoint_onMouseEnter = ({ target }) => {
    const controlPointId = Number(target.getAttribute('data-id'))
    controlPoint_highlighted.value = controlPointId
  }
  const controlPoint_onMouseLeave = ({ target }) => {
    controlPoint_highlighted.value = null
    controlPoint_highlighted.value = null
  }
  const controlPoint_startDrag = ({
    target,
    offsetX,
    offsetY
  }) => {
    const controlPointId = Number(target.getAttribute('data-id'))
    const v = s.vertices[controlPointId]

    controlPoint_dragging.value = controlPointId

    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })

    controlPoint_dragOffset.x = p.x - v.x
    controlPoint_dragOffset.y = p.y - v.y
    props.containerRef.addEventListener('mousemove', controlPoint_drag, { passive: true })
    props.containerRef.addEventListener('mouseup', controlPoint_drop, { passive: true })
    props.containerRef.addEventListener('mouseleave', controlPoint_onMouseLeave, { passive: true })
  }
  const controlPoint_drag = ({
    target,
    offsetX,
    offsetY
  }) => {
    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })
    const controlPointId = controlPoint_dragging.value
    if (s.auto) {
      s.auto = false
    }

    const v = s.vertices[controlPointId]
    v.x = snap((p.x - controlPoint_dragOffset.x), gridSnap)
    v.y = snap((p.y - controlPoint_dragOffset.y), gridSnap)

  }
  const controlPoint_drop = (e) => {
    controlPoint_dragOffset.x = 0
    controlPoint_dragOffset.y = 0
    controlPoint_dragging.value = null
    controlPoint_highlighted.value = null

    props.containerRef.removeEventListener('mousemove', controlPoint_drag, { passive: true })
    props.containerRef.removeEventListener('mouseup', controlPoint_drop, { passive: true })
    props.containerRef.removeEventListener('mouseleave', controlPoint_onMouseLeave, { passive: true })
  }

  const controlPoint_onDblClick = ({target}) => {
    s.auto = true;
    updateControlPoints()
  }

  onMounted(() => {
    affectedTables.value = props.endpoints.map(e => store.getTable(e.fields[0].table.id))
    nextTick(() => {
      updateControlPoints()
    })
  })

  watch(() => props.id, (newId) => {
    s = store.getRef(newId)
    // Update relationship type when ID changes
    relationType.value = s.relationType || 'association'
  })
  
  // Update from props if they change
  watch(() => props.relationType, (newType) => {
    if (newType && newType !== relationType.value) {
      console.log(`VDbRefUml ${props.id}: Prop relationType changed to ${newType}`);
      relationType.value = newType;
    }
  })

  watch(props.endpoints, () => {
    affectedTables.value = props.endpoints.map(e => store.getTable(e.fields[0].table.id))
  }, {
    deep: true
  })

  watch(affectedTables, () => {
    updateControlPoints()
  }, {
    deep: true
  })
</script>

<style scoped>
.db-ref__marker {
  z-index: 1000;
}
.db-ref__marker-generalization-end {
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
}
.db-ref__marker-composition-start {
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.8));
}
.db-ref__marker-aggregation-start {
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.7));
}
</style>