<template>
  <div class="dbml-graph-wrapper">
    <v-db-chart v-if="schema && chart.loaded"
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
  import { computed, onMounted, ref, watch, nextTick } from 'vue'
  import VDbChart from './VDbChart/VDbChart'
  import { useChartStore } from '../store/chart'
  import VDbStructure from './VDbStructure'
  import { sendDiagramUpdate, onDiagramUpdate, joinProject } from 'src/boot/socket'

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits([
    'update:positions',
  ])
  const editor = useEditorStore()
  const chart = useChartStore()

  const locateInEditor = (e, thing) => {
    console.log("locateInEditor", e, thing);
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

  // Escuchar actualizaciones de posición de tablas y grupos
  onMounted(() => {
    // Unirse al mismo proyecto que el editor
    const projectId = 'default-project';
    joinProject(projectId);
    console.log("DbmlGraph: Unido al proyecto", projectId);
    
    // Escuchar actualizaciones del diagrama
    onDiagramUpdate((data) => {
      console.log("DbmlGraph: Recibida actualización", data);
      
      try {
        if (data.updateType === 'table-position-update' && data.payload && data.payload.tableId && data.payload.position) {
          // Actualizar la posición de una tabla
          const { tableId, position } = data.payload;
          
          // Verificar que tenemos posiciones válidas
          if (typeof position.x !== 'number' || typeof position.y !== 'number') {
            console.error("Posición inválida recibida:", position);
            return;
          }
          
          // Actualizar en el store de chart
          try {
            const tableStore = chart.getTable(tableId);
            if (tableStore) {
              console.log("Actualizando posición de tabla en store:", tableId, position);
              tableStore.x = position.x;
              tableStore.y = position.y;
            }
          } catch (error) {
            console.error("Error al actualizar tabla en store:", error);
          }
          
          // También actualizar en el schema si está disponible
          try {
            if (props.schema && props.schema.tables && Array.isArray(props.schema.tables)) {
              const table = props.schema.tables.find(t => t && t.id === tableId);
              if (table) {
                console.log("Actualizando posición de tabla en schema:", tableId, position);
                if (!table.position) table.position = {};
                table.position.x = position.x;
                table.position.y = position.y;
              }
            }
          } catch (error) {
            console.error("Error al actualizar tabla en schema:", error);
          }
        } else if (data.updateType === 'tablegroup-position-update' && data.payload && data.payload.groupId && data.payload.position) {
          // Actualizar la posición de un grupo de tablas
          const { groupId, position } = data.payload;
          
          // Verificar que tenemos posiciones válidas
          if (typeof position.x !== 'number' || typeof position.y !== 'number') {
            console.error("Posición inválida recibida:", position);
            return;
          }
          
          // Actualizar en el store de chart
          try {
            const groupStore = chart.getTableGroup(groupId);
            if (groupStore) {
              console.log("Actualizando posición de grupo en store:", groupId, position);
              groupStore.x = position.x;
              groupStore.y = position.y;
            }
          } catch (error) {
            console.error("Error al actualizar grupo en store:", error);
          }
          
          // También actualizar en el schema si está disponible
          try {
            if (props.schema && props.schema.tableGroups && Array.isArray(props.schema.tableGroups)) {
              const group = props.schema.tableGroups.find(g => g && g.id === groupId);
              if (group) {
                console.log("Actualizando posición de grupo en schema:", groupId, position);
                if (!group.position) group.position = {};
                group.position.x = position.x;
                group.position.y = position.y;
              }
            }
          } catch (error) {
            console.error("Error al actualizar grupo en schema:", error);
          }
        } else if (data.updateType === 'relation-type-update' && data.payload && data.payload.refId) {
          // Actualizar el tipo de relación
          const { refId, relationType, startMarker, endMarker } = data.payload;
          
          // Actualizar en el store de chart
          try {
            console.log("Socket recibido para actualizar relación:", refId, relationType);
            const refStore = chart.getRef(refId);
            if (refStore) {
              console.log("Relación antes de actualizar:", JSON.stringify(refStore));
              console.log("Actualizando tipo de relación en store:", refId, relationType);
              
              // Force Vue to detect the changes by creating a completely new object
              // and properly applying the relationship type
              const updatedRef = JSON.parse(JSON.stringify(refStore)); // Deep clone
              updatedRef.relationType = relationType;
              updatedRef.startMarker = startMarker;
              updatedRef.endMarker = endMarker;
              
              // Update the ref in the store
              chart.updateRef(refId, updatedRef);
              
              // Force a re-render if needed
              nextTick(() => {
                console.log("Forced re-render after relationship type update");
              });
              
              // Verify the update was successful
              const afterUpdate = chart.getRef(refId);
              console.log("Relación después de actualizar:", JSON.stringify(afterUpdate));
              console.log("¿Actualización exitosa?", afterUpdate.relationType === relationType);
            }
          } catch (error) {
            console.error("Error al actualizar relación en store:", error);
          }
        }
      } catch (error) {
        console.error("Error al procesar actualización del diagrama:", error);
      }
    });
  });

  // Las actualizaciones ya están siendo enviadas por los componentes VDbTable y VDbTableGroup
  // No necesitamos un watcher adicional aquí
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
