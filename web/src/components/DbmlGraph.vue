<template>
  <div class="dbml-graph-wrapper">
    <v-db-chart v-if="schema && schema.tables && chart.loaded"
                v-bind="schema"
                @dblclick:table-group="locateInEditor"
                @dblclick:table="locateInEditor"
                @dblclick:field="locateInEditor"
                @dblclick:ref="locateInEditor"
     />

    <div class="dbml-structure-wrapper" v-if="false">
      <q-card class="shadow-6">
        <v-db-structure v-if="editor.database.schemas"
                        :database="editor.database"
        />
      </q-card>
    </div>

    <div class="dbml-toolbar-wrapper">
      <q-card class="shadow-6">
        <q-toolbar class="rounded-borders">
          <q-btn
            class="q-mr-xs q-px-md"
            color="secondary"
            dense
            @click="applyAutoLayout"
          >
            Auto-Layout
          </q-btn>
          <q-btn
            class="q-mx-xs q-px-md"
            color="secondary"
            dense
            @click="applyScaleToFit">
            fit
          </q-btn>
          <q-btn
            class="q-mx-xs q-px-md"
            color="primary"
            dense
            @click="centerView"
            icon="center_focus_strong"
            :title="'Reset zoom to 100% and center view on tables'"
          >
            Center
          </q-btn>
          <q-space/>

          <q-slider
            class="q-mx-sm"
            style="width: 25%; min-width: 100px; max-width: 200px;"
            v-model="scale"
            :min="minScale"
            :max="maxScale"
          />
          <div
            class="q-mx-sm non-selectable"
            style="width: 2.5rem; flex: 0 0 auto;">{{ Math.round(scale) }} %
          </div>

        </q-toolbar>
      </q-card>
    </div>
  </div>
</template>

<script setup>
  import { useEditorStore } from '../store/editor'
  import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
  import VDbChart from './VDbChart/VDbChart'
  import { useChartStore } from '../store/chart'
  import VDbStructure from './VDbStructure'
  import { sendDiagramUpdate, onDiagramUpdate, joinProject } from 'src/boot/socket'

  const props = defineProps({
    schema: {
      type: Object,
      required: false, // Changed from true to false to handle undefined cases
      default: () => ({
        tableGroups: [],
        tables: [],
        refs: []
      })
    }
  })

  const emit = defineEmits([
    'update:positions',
  ])
  const editor = useEditorStore()
  const chart = useChartStore()

  const locateInEditor = (e, thing) => {
    if (thing) {
      const token = thing.token
      editor.updateSelectionMarker(token.start, token.end)
    }
  }

  const scale = computed({
    get () {
      return (chart.zoom || 1) * 100.0
    },
    set (value) {
      chart.updateZoom(value / 100.0)
    }
  })

  const minScale = ref(10)
  const maxScale = ref(200)

  const applyAutoLayout = () => {
    // do nothing
  }

  const applyScaleToFit = () => {
    // do nothing
  }

  const centerView = () => {
    
    if (window.centerViewOnTables) {
      window.centerViewOnTables()
    } else {
    }
  }

  // Función para detectar si estamos en modo sala
  const isRoomMode = () => {
    return window.location.pathname.includes('/room/') || window.location.href.includes('/room/')
  }

  // Función para manejar actualizaciones de posición de tabla
  const handleTablePositionUpdate = (data) => {
    if (data.updateType === 'table-position-update' && data.payload && data.payload.tableId && data.payload.position) {
      const { tableId, position, isDragging } = data.payload;
      const dragStatus = isDragging ? '🔄 (arrastrando)' : '✅ (posición final)';
      
      console.log(`\n📥 [DBML-GRAPH] === ACTUALIZANDO TABLA ===`);
      console.log(`👤 De usuario: ${data.username || 'Desconocido'}`);
      console.log(`📦 Tabla ID: ${tableId}`);
      console.log(`📍 Posición: x=${position.x}, y=${position.y}`);
      console.log(`⚡ Estado: ${dragStatus}`);
      
      // Verificar que tenemos posiciones válidas
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        console.error(`❌ [DBML-GRAPH] Posiciones inválidas: x=${position.x}, y=${position.y}`);
        return;
      }
      
      // Actualizar en el store de chart
      try {
        const tableStore = chart.getTable(tableId);
        if (tableStore) {
          console.log(`✅ [DBML-GRAPH] Tabla encontrada en chart store, actualizando...`);
          tableStore.x = position.x;
          tableStore.y = position.y;
          
          // Forzar reactividad y re-render
          nextTick(() => {
            console.log(`✅ [DBML-GRAPH] Tabla actualizada en chart store`);
          });
        } else {
          console.warn(`⚠️ [DBML-GRAPH] Tabla ${tableId} no encontrada en chart store`);
        }
      } catch (error) {
        console.error("❌ [DBML-GRAPH] Error al actualizar tabla en store:", error);
      }
      
      // También actualizar en el schema si está disponible
      try {
        if (props.schema && props.schema.tables && Array.isArray(props.schema.tables)) {
          const table = props.schema.tables.find(t => t && t.id === tableId);
          if (table) {
            console.log(`✅ [DBML-GRAPH] Tabla encontrada en schema, actualizando...`);
            if (!table.position) table.position = {};
            table.position.x = position.x;
            table.position.y = position.y;
            console.log(`✅ [DBML-GRAPH] Tabla actualizada en schema`);
          } else {
            console.warn(`⚠️ [DBML-GRAPH] Tabla ${tableId} no encontrada en schema`);
          }
        }
      } catch (error) {
        console.error("❌ [DBML-GRAPH] Error al actualizar tabla en schema:", error);
      }
      
      console.log(`==========================================\n`);
    }
  }

  // Función para manejar actualizaciones de posición de grupo
  const handleTableGroupPositionUpdate = (data) => {
    if (data.updateType === 'tablegroup-position-update' && data.payload && data.payload.groupId && data.payload.position) {
      const { groupId, position } = data.payload;
      
      // Verificar que tenemos posiciones válidas
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        return;
      }
      
      // Actualizar en el store de chart
      try {
        const groupStore = chart.getTableGroup(groupId);
        if (groupStore) {
          groupStore.x = position.x;
          groupStore.y = position.y;
          
          // Forzar reactividad y re-render
          nextTick(() => {
            // Grupo actualizado
          });
        }
      } catch (error) {
        console.error("Error al actualizar grupo en store:", error);
      }
      
      // También actualizar en el schema si está disponible
      try {
        if (props.schema && props.schema.tableGroups && Array.isArray(props.schema.tableGroups)) {
          const group = props.schema.tableGroups.find(g => g && g.id === groupId);
          if (group) {
            if (!group.position) group.position = {};
            group.position.x = position.x;
            group.position.y = position.y;
          }
        }
      } catch (error) {
        console.error("Error al actualizar grupo en schema:", error);
      }
    }
  }

  // Función para manejar actualizaciones de relaciones - SIMPLIFICADA
  const handleRelationshipUpdate = (data) => {
    console.log('🔥 handleRelationshipUpdate llamada con:', data)
    
    if (!data || !data.relationshipChanges) {
      console.error('❌ Datos de relación inválidos:', data)
      return
    }
    
    const { 
      refId, 
      relationType, 
      startMarker, 
      endMarker,
      startCardinality,
      endCardinality,
      relationshipName 
    } = data.relationshipChanges
    
    try {
      console.log('🔗 Actualizando relación:', refId, 'a tipo:', relationType)
      
      const refStore = chart.getRef(refId)
      if (refStore) {
        // Actualizar directamente en el store
        refStore.relationType = relationType
        refStore.startMarker = startMarker  
        refStore.endMarker = endMarker
        
        // Actualizar cardinalidades si están presentes
        if (startCardinality !== undefined) {
          refStore.startCardinality = startCardinality
        }
        if (endCardinality !== undefined) {
          refStore.endCardinality = endCardinality
        }
        if (relationshipName !== undefined) {
          refStore.relationshipName = relationshipName
        }
        
        // Forzar re-render
        nextTick(() => {
          console.log('✅ Relación actualizada exitosamente con cardinalidades')
        })
      } else {
        console.warn('⚠️ No se encontró relación en store:', refId)
      }
    } catch (error) {
      console.error('❌ Error actualizando relación:', error)
    }
  }

  // Función para manejar actualizaciones del estado del diagrama (zoom, pan, position)
  const handleDiagramStateUpdate = (data) => {
    if (data.updateType === 'diagram-state-update' && data.payload) {
      const { zoom, pan, position } = data.payload
      
      try {
        // Actualizar zoom
        if (typeof zoom === 'number') {
          chart.updateZoom(zoom)
        }
        
        // Actualizar pan
        if (pan && typeof pan.x === 'number' && typeof pan.y === 'number') {
          chart.updatePan(pan.x, pan.y)
        }
        
        // Actualizar position si está disponible
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
          // Position se maneja internamente por el diagrama
        }
      } catch (error) {
        console.error('Error al actualizar estado del diagrama:', error)
      }
    }
  }

  // Escuchar actualizaciones de posición de tablas y grupos
  onMounted(() => {
    if (isRoomMode()) {
      // En modo sala, los eventos se manejarán a través del Editor/Index.vue
      // Registrar funciones globales para que el editor las pueda llamar
      window.handleTablePositionUpdate = handleTablePositionUpdate;
      window.handleTableGroupPositionUpdate = handleTableGroupPositionUpdate;
      window.handleRelationshipUpdate = handleRelationshipUpdate;
      window.handleDiagramStateUpdate = handleDiagramStateUpdate;
    } else {
      // Modo normal: usar el socket original
      const projectId = 'default-project';
      joinProject(projectId);
      
      // Escuchar actualizaciones del diagrama en modo normal
      onDiagramUpdate((data) => {
        
        try {
          handleTablePositionUpdate(data);
          handleTableGroupPositionUpdate(data);
          
          // También manejar actualizaciones de relaciones (código existente)
          if (data.updateType === 'relationship-type-update' && data.payload && data.payload.refId) {
            const { refId, relationType, startMarker, endMarker } = data.payload;
            
            try {
              const refStore = chart.getRef(refId);
              if (refStore) {
                const updatedRef = JSON.parse(JSON.stringify(refStore));
                updatedRef.relationType = relationType;
                updatedRef.startMarker = startMarker;
                updatedRef.endMarker = endMarker;
                
                chart.updateRef(refId, updatedRef);
                
                nextTick(() => {
                  // Relación actualizada
                });
              }
            } catch (error) {
              console.error("Error al actualizar relación en store:", error);
            }
          }
        } catch (error) {
          console.error("Error al procesar actualización del diagrama:", error);
        }
      });
    }
  })

  // Watcher para detectar cambios en el schema y forzar re-render del diagrama
  watch(() => props.schema, (newSchema, oldSchema) => {
    console.log('🔄 [DBML-GRAPH] Schema changed, forcing diagram update...')
    console.log('📊 Old schema:', oldSchema ? {
      tables: oldSchema.tables?.length || 0,
      refs: oldSchema.refs?.length || 0
    } : 'undefined')
    console.log('📊 New schema:', newSchema ? {
      tables: newSchema.tables?.length || 0,
      refs: newSchema.refs?.length || 0
    } : 'undefined')
    
    if (newSchema && (newSchema.tables || newSchema.refs || newSchema.tableGroups)) {
      // Forzar actualización del chart store
      nextTick(() => {
        try {
          // Crear un objeto database mock para el loadDatabase
          const mockDatabase = {
            schemas: [newSchema]
          }
          
          // Recargar el diagrama con el nuevo schema
          chart.loadDatabase(mockDatabase)
          console.log('✅ [DBML-GRAPH] Chart store reloaded with new schema')
        } catch (error) {
          console.error('❌ [DBML-GRAPH] Error updating chart store:', error)
        }
      })
    }
  }, { 
    deep: true,
    immediate: false 
  })

  onUnmounted(() => {
    // Limpiar funciones globales si las creamos
    if (window.handleTablePositionUpdate) {
      delete window.handleTablePositionUpdate;
    }
    if (window.handleTableGroupPositionUpdate) {
      delete window.handleTableGroupPositionUpdate;
    }
  })
</script>

<style scoped lang="scss">
  .dbml-graph, .db-chart {
    height: 100% !important;
    width: 100% !important;
  }

  .dbml-graph-wrapper {
    height: 100% !important;
    width: 100% !important;
    position: relative;
  }

  .dbml-toolbar-wrapper {
    width: 600px;
    align-self: center;
    position: absolute;
    bottom: 1rem;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .dbml-structure-wrapper {
    width: 400px;
    max-height: 300px;
    height: 300px;
    align-self: start;
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    margin-right: auto;

    > .q-card {
      max-height: 300px;
      overflow: auto;
    }
  }
</style>