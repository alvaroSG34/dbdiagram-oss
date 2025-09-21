<template>
  <svg
    ref="root"
    class="db-chart"
    :class="{ 'db-chart--connection-mode': store.connectionMode.active }"
    @mousemove.passive.capture="updateCursorPosition"
  >
    <defs>
      <pattern id="db-chart__bg-grid-base"
               :width="bgGrid.pattern.width"
               :height="bgGrid.pattern.height"
               patternUnits="userSpaceOnUse"
               :viewBox="`0 0 ${bgGrid.pattern.width} ${bgGrid.pattern.height}`"
               class="db-chart__bg-grid"
               ref="bgGridRect">
        <g class="db-chart__bg-grid-small">
          <path :d="bgGrid.pattern.path" fill="none"/>
        </g>
        <path :d="`M ${bgGrid.pattern.width} 0 L 0 0 0 ${bgGrid.pattern.height}`" fill="none"/>
      </pattern>

      <pattern id="db-chart__bg-grid"
               x="0" y="0"
               :width="bgGrid.pattern.width"
               :height="bgGrid.pattern.height"
               patternUnits="userSpaceOnUse"
               :viewBox="`${bgGrid.pattern.x} ${bgGrid.pattern.y} ${bgGrid.pattern.width} ${bgGrid.pattern.height}`">
        <rect
          :x="`-${bgGrid.pattern.width}`"
          :y="`-${bgGrid.pattern.height}`"
          :width="`${bgGrid.pattern.width*3}`"
          :height="`${bgGrid.pattern.height*3}`"
          fill="url(#db-chart__bg-grid-base)"/>
      </pattern>
    </defs>

    <g id="background-layer">
      <rect ref="bgRef" class="db-chart__bg"
            @mousedown="panZoom.enablePan()"
            @mouseup="panZoom.disablePan()"
      />
      <rect class="db-chart__bg-grid"
            x="0" y="0"
            width="100%" height="100%"
            fill="url(#db-chart__bg-grid)"/>
    </g>
    <g id="viewport-layer">
      <g id="tablegroups-layer"
         v-if="store.loaded">
        <v-db-table-group v-for="tableGroup of tableGroups"
                          :key="tableGroup.id"
                          v-bind="tableGroup"
                          :container-ref="root"
                          @click.passive="dblclickHelper(onTableGroupDblClick, $event, tableGroup)"
                          @mouseenter.passive="onTableGroupMouseEnter"
                          @mouseleave.passive="onTableGroupMouseLeave"
        >

        </v-db-table-group>
      </g>
      <g id="refs-layer"
         v-if="store.loaded">
        <component :is="getRefComponent(ref)"
                  v-for="ref of refs"
                  :key="ref.id"
                  v-bind="getRefProps(ref)"
                  :container-ref="root"
                  @click.passive="dblclickHelper(onRefDblClick, $event, ref)"
                  @mouseenter.passive="onRefMouseEnter"
                  @mouseleave.passive="onRefMouseLeave"
        />
      </g>
      <g id="tables-layer"
         v-if="store.loaded">
        <v-db-table v-for="table of tables"
                    v-bind="table"
                    :key="table.id"
                    :container-ref="root"
                    @click:header="dblclickHelper(onTableDblClick, $event, table)"
                    @click:field="(...e) => dblclickHelper(onFieldDblClick, ...e)"
                    @connection-completed="onConnectionCompleted"
                    @mouseenter.passive="onTableMouseEnter"
                    @mouseleave.passive="onTableMouseLeave"
        />
      </g>
      <g id="overlays-layer"
         v-if="store.loaded">
        <v-db-tooltip/>
      </g>
      <!-- Línea de conexión temporal para crear relaciones -->
      <g id="connection-layer">
        <v-db-connection-line />
      </g>
    </g>
    <g id="tools-layer">
      <svg x="10" y="10" width="150" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">position</text>
        <text x="0">x:
          <v-number :value="position.x" decimals="1"/>
        </text>
        <text x="75">y:
          <v-number :value="position.y" decimals="1"/>
        </text>
      </svg>

      <svg x="170" y="10" width="150" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">pan</text>
        <text x="0">x:
          <v-number :value="store.pan.x" decimals="1"/>
        </text>
        <text x="75">y:
          <v-number :value="store.pan.y" decimals="1"/>
        </text>
      </svg>

      <svg x="330" y="10" width="100" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">zoom</text>
        <text x="0">
          <v-number :value="store.zoom" decimals="3"/>
        </text>
      </svg>
    </g>
  </svg>
</template>

<script setup>
  import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch, watchEffect } from 'vue'
  import VDbTable from './VDbTable'
  import VDbRef from './VDbRef'
  import VDbRefUml from './VDbRefUml'
  import VDbConnectionLine from './VDbConnectionLine'
  import svgPanZoom from 'svg-pan-zoom'
  import { useChartStore } from '../../store/chart'
  import { useEditorStore } from '../../store/editor'
  import { sendDiagramUpdate, onDiagramUpdate } from '../../boot/socket'
  import VDbTooltip from './VDbTooltip'
  import VDbTableGroup from './VDbTableGroup'

  const store = useChartStore()
  const editorStore = useEditorStore()

  const props = defineProps({
    tableGroups: {
      type: Array,
      default: () => ([])
    },
    tables: {
      type: Array,
      default: () => ([])
    },
    refs: {
      type: Array,
      default: () => ([])
    }
  })

  const emit = defineEmits([
    'dblclick:table-group',
    'dblclick:table',
    'dblclick:ref',
    'dblclick:field',
  ])

  const root = ref(null)
  const bgGrid2 = ref(null)
  const bgGridRect = ref(null)

  const bgGrid = reactive({
    pattern: {
      viewport: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      },
      rect: {
        x: -100,
        y: -100,
        width: 300,
        height: 300
      },
      path: '',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    offset: {
      x: 0,
      y: 0
    }

  })
  const panZoom = ref({})
  const position = reactive({
    x: 0,
    y: 0
  },)
  let initialized = false

  const updateCursorPosition = (e) => {
    const p = store.inverseCtm.transformPoint({
      x: e.offsetX,
      y: e.offsetY
    })
    position.x = p.x
    position.y = p.y
    
    // Actualizar línea de conexión si está activa
    if (store.connectionMode.active) {
      store.updateConnectionLine(p.x, p.y)
    }
  }
  
  // Helper function to determine which component to use for the reference
  const getRefComponent = (ref) => {
    // Always use UML version for now since we're implementing UML relationships
    return VDbRefUml;
  }
  
  // Helper function to prepare props for the reference component
  const getRefProps = (ref) => {
    // Get the ref from the store to ensure we have the latest data
    const storeRef = store.getRef(ref.id)
    
    // Start with all the ref props, preferring store values
    const props = { 
      ...ref,
      relationType: storeRef.relationType || ref.relationType,
      startMarker: storeRef.startMarker !== undefined ? storeRef.startMarker : ref.startMarker,
      endMarker: storeRef.endMarker !== undefined ? storeRef.endMarker : ref.endMarker
    }
    
    // If no relationType is defined, set a default
    if (!props.relationType) {
      props.relationType = 'association'
    }
    
    // If start/endMarker are not defined, set defaults based on relationType
    if (props.startMarker === undefined) {
      props.startMarker = ['composition', 'aggregation'].includes(props.relationType)
    }
    
    if (props.endMarker === undefined) {
      props.endMarker = true // All relationship types should have an end marker now
    }
    
    return props
  }

  const saveSizes = () => {
    const s = panZoom.value.getSizes()
    const p = panZoom.value.getPan()
    const z = panZoom.value.getZoom()
    const pan = {
      x: p.x - (s.width / 2),
      y: p.y - (s.height / 2)
    }
    store.$patch({
      pan: pan,
      zoom: z
    })
  }

  const loadSizes = () => {
    const s = panZoom.value.getSizes()
    const p = store.pan
    const z = store.zoom
    const pan = {
      x: p.x,
      y: p.y
    }
    panZoom.value.resize()
    // Solo centrar en el primer render
    if (!panZoom.value._hasCentered) {
      panZoom.value.center()
      panZoom.value._hasCentered = true
    }
    panZoom.value.zoom(z)
    panZoom.value.panBy(pan)
  }

  function updateGrid (matrix) {
    let p = ''
    const {
      size: c,
      divisions: d
    } = store.grid
    const e = c / d

    const restrainedMatrix = DOMMatrix.fromMatrix(matrix)
    const minPos = restrainedMatrix.transformPoint({
      x: 0,
      y: 0
    })
    const maxPos = restrainedMatrix.transformPoint({
      x: c,
      y: c
    })

    const cx = Math.abs(maxPos.x - minPos.x)
    const cy = Math.abs(maxPos.y - minPos.y)
    const dx = cx / d
    const dy = cy / d

    const tx = minPos.x
    const ty = minPos.y
    const mx = ((tx % cx) + cx) % cx
    const my = ((ty % cy) + cy) % cy

    p += 'M 0 0'
    for (let i = 1; i < d; i++) {
      p += ` m ${dx * i} 0 l 0 ${cy} m -${dx * i} -${cy}`
    }
    p += 'M 0 0'
    for (let i = 1; i < d; i++) {
      p += ` m 0 ${dy * i} l ${cx} 0 m -${cx} -${dy * i}`
    }

    bgGrid.pattern.x = -mx
    bgGrid.pattern.y = -my
    bgGrid.pattern.width = cx
    bgGrid.pattern.height = cy
    bgGrid.pattern.path = p
  }

  const updateCTM = (newCTM) => {
    store.updateCTM(newCTM)
    updateGrid(newCTM)
  }

  const updateZoom = () => {
    saveSizes()

  }

  onMounted(() => {
    panZoom.value = svgPanZoom(root.value, {
      viewportSelector: '#viewport-layer',
      panEnabled: false,
      fit: false,
      center: false,
      dblClickZoomEnabled: false,
      zoomScaleSensitivity: 0.2,
      minZoom: 0.1,
      maxZoom: 2.0,
      // onPan: (newPan) => {
      //   saveSizes()
      // },
      // onZoom: (newZoom) => {
      //   saveSizes()
      // },
      // onUpdatedCTM: (newCTM) => {
      //   store.updateCTM(newCTM)
      // }
    })
    nextTick(() => {
      loadSizes()
      panZoom.value.disablePan()
      panZoom.value.setOnPan(() => saveSizes())
      panZoom.value.setOnZoom(() => updateZoom())
      panZoom.value.setOnUpdatedCTM((newCTM) => updateCTM(newCTM))
    })
    initialized = true

    // Event listeners para teclado
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && store.connectionMode.active) {
        console.log('ESC pressed, canceling connection')
        store.cancelConnection()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    
    // Configurar listener para actualizaciones de WebSocket
    setupWebSocketListeners()
    
    // Exponer la función de creación de DBML globalmente
    window.createDbmlRelationship = createDbmlRelationship
  })

  onBeforeUnmount(() => {
    // Cleanup event listeners
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && store.connectionMode.active) {
        store.cancelConnection()
      }
    }
    document.removeEventListener('keydown', handleKeyPress)
    
    // Limpiar función global
    if (window.createDbmlRelationship === createDbmlRelationship) {
      delete window.createDbmlRelationship
    }
  })

  watch(() => props.tables, () => {
  panZoom.value.updateBBox()
  })

  watch(() => props.refs, () => {
  panZoom.value.updateBBox()
  })

  watch(() => store.zoom, (newZoom) => {
    panZoom.value.zoom(newZoom)
  })

  function onRefDblClick (e, ref) {
    console.log("onRefDblClick", e, ref);
    
    // Get the latest ref data from the store to ensure we have the correct type
    const storeRef = store.getRef(ref.id);
    const relationType = storeRef.relationType || 'association';
    
    // Show the relationship type dialog when double clicking a ref
    if (window.showRelationshipTypeDialogHandler) {
      console.log("Showing relationship dialog for ref:", ref.id, "current type:", relationType);
      window.showRelationshipTypeDialogHandler(ref.id, relationType);
    } else {
      console.error("showRelationshipTypeDialogHandler not available on window!");
    }
    
    emit('dblclick:ref', e, ref);
  }
  function onFieldDblClick (e, field) {
    console.log("onFieldDblClick", e, field);
    emit('dblclick:field', e, field);
  }
  function onTableDblClick (e, table) {
    console.log("onTableDblClick", e, table);
    emit('dblclick:table', e, table);
  }
  function onTableGroupDblClick (e, tableGroup) {
    console.log("onTableGroupDblClick", e, tableGroup);
    emit('dblclick:table-group', e, tableGroup);
  }

  function onConnectionCompleted (connectionInfo) {
    console.log('Connection completed in VDbChart:', connectionInfo);
    
    // Mostrar el diálogo para seleccionar el tipo de relación
    if (window.showRelationshipCreationDialog) {
      window.showRelationshipCreationDialog(connectionInfo);
    } else {
      console.error('Relationship creation dialog not available!');
      // Fallback: crear relación básica
      createDbmlRelationship({
        type: 'association',
        name: '',
        source: connectionInfo.source,
        target: connectionInfo.target
      });
    }
  }

  // Función para crear relación DBML automáticamente
  function createDbmlRelationship(relationshipData) {
    console.log('Creating DBML relationship:', relationshipData);
    
    const { type, name, source, target } = relationshipData;
    
    // Generar la sintaxis DBML para la nueva relación
    const sourceRef = `${source.table.name}.${source.field.name}`;
    const targetRef = `${target.table.name}.${target.field.name}`;
    
    // Determinar el tipo de relación DBML basado en el tipo UML
    let dbmlRelationType = '>';
    switch (type) {
      case 'association':
        dbmlRelationType = '-';
        break;
      case 'composition':
        dbmlRelationType = '>';
        break;
      case 'aggregation':
        dbmlRelationType = '<>';
        break;
      case 'generalization':
        dbmlRelationType = '<';
        break;
    }
    
    // Construir la línea DBML
    let dbmlLine = `Ref`;
    if (name && name.trim()) {
      dbmlLine += ` ${name.trim()}`;
    }
    dbmlLine += `: ${sourceRef} ${dbmlRelationType} ${targetRef}`;
    
    // Obtener el contenido actual del editor
    const currentDbml = editorStore.source.text;
    
    // Añadir la nueva relación al final del DBML
    const newDbml = currentDbml.trim() + '\n\n' + dbmlLine + '\n';
    
    console.log('Generated DBML line:', dbmlLine);
    console.log('New DBML content:', newDbml);
    
    // Actualizar el editor con el nuevo contenido
    editorStore.updateSourceText(newDbml);
    
    // Enviar actualización via WebSocket para sincronizar con otros usuarios
    sendDiagramUpdate('relationship-created', {
      relationshipData: relationshipData,
      dbmlLine: dbmlLine,
      newDbmlContent: newDbml,
      sourceRef: sourceRef,
      targetRef: targetRef,
      timestamp: Date.now()
    }).then(() => {
      console.log('✅ Relationship creation synchronized with other users');
    }).catch((error) => {
      console.warn('⚠️ Failed to synchronize relationship creation:', error);
    });
    
    // Mostrar mensaje de confirmación
    alert(`✅ Relationship created!\n${sourceRef} ${dbmlRelationType} ${targetRef}`);
    
    // Cancelar el modo de conexión
    store.cancelConnection();
  }

  // Configurar listeners de WebSocket para actualizaciones remotas
  function setupWebSocketListeners() {
    console.log('Setting up WebSocket listeners for relationship updates');
    
    onDiagramUpdate((data) => {
      console.log('Received diagram update from WebSocket:', data);
      
      if (data.updateType === 'relationship-created') {
        console.log('Processing remote relationship creation:', data.payload);
        
        // Actualizar el editor con el nuevo contenido DBML
        if (data.payload.newDbmlContent) {
          editorStore.updateSourceText(data.payload.newDbmlContent);
          
          // Mostrar notificación de que otro usuario creó una relación
          console.log(`🔄 Remote user created relationship: ${data.payload.sourceRef} ${data.payload.dbmlLine.split(' ')[2]} ${data.payload.targetRef}`);
          
          // Opcional: mostrar toast o notificación visual
          // En lugar de alert (que es intrusivo), usar console.log por ahora
        }
      }
    });
  }

  function onRefMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onRefMouseLeave (e) {
  }

  function onTableMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onTableMouseLeave (e) {
  }

  function onTableGroupMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onTableGroupMouseLeave (e) {
  }

  let lastClick = Date.now();
  let lastClicked = null;
  function dblclickHelper(fn, e, ...args) {
    const nowClick = Date.now();

    if (((nowClick - lastClick) < 500) && lastClicked === e.target) {
      fn(e, ...args);
    }
    lastClicked = e.target;
    lastClick = nowClick;
  }

  // Función de prueba para activar modo de conexión (temporal)
  const startConnectionTest = () => {
    // Para prueba, crearemos un campo fake
    const testField = { id: 1, name: 'test_field' }
    const testTable = { id: 1, name: 'test_table', fields: [testField] }
    store.startConnection(testField, testTable)
    console.log('Connection mode activated! Use ESC to cancel.')
  }

  // Exponer funciones de prueba en desarrollo
  if (process.env.NODE_ENV === 'development') {
    window.startConnectionTest = startConnectionTest
    window.chartStore = store
  }

</script>

<style scoped>
.db-chart--connection-mode {
  cursor: crosshair;
}

.db-chart--connection-mode .db-field {
  cursor: crosshair;
}
</style>

<style scoped>
.db-chart--connection-mode {
  cursor: crosshair !important;
}

.db-chart--connection-mode * {
  cursor: crosshair !important;
}
</style>
