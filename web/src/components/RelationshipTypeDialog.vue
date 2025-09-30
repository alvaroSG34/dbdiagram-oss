<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 600px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6">Change Relationship Type</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="relationship-types row q-col-gutter-md">
          <div 
            v-for="type in relationshipTypes" 
            :key="type.value" 
            class="col-6 q-mb-md"
          >
            <q-card 
              class="relationship-option cursor-pointer" 
              :class="{ 'selected-type': selectedType === type.value }"
              @click="selectType(type.value)"
              flat
              bordered
            >
              <q-card-section>
                <div class="relationship-icon flex justify-center">
                  <svg width="80" height="30" viewBox="0 0 80 30">
                    <g v-if="type.value === 'association'">
                      <path d="M 10,15 L 70,15" stroke="black" stroke-width="2" fill="none" />
                      <path d="M 60,8 L 70,15 L 60,22" stroke="black" stroke-width="2" fill="none" />
                    </g>
                    <g v-else-if="type.value === 'composition'">
                      <path d="M 20,15 L 70,15" stroke="black" stroke-width="2" fill="none" />
                      <path d="M 5,8 L 20,15 L 5,22 L -10,15 Z" stroke="black" stroke-width="2" fill="black" transform="translate(15, 0)" />
                      <path d="M 60,8 L 70,15 L 60,22" stroke="black" stroke-width="2" fill="none" />
                    </g>
                    <g v-else-if="type.value === 'aggregation'">
                      <path d="M 20,15 L 70,15" stroke="black" stroke-width="2" fill="none" />
                      <path d="M 5,8 L 20,15 L 5,22 L -10,15 Z" stroke="black" stroke-width="2" fill="white" transform="translate(15, 0)" />
                      <path d="M 60,8 L 70,15 L 60,22" stroke="black" stroke-width="2" fill="none" />
                    </g>
                    <g v-else-if="type.value === 'generalization'">
                      <path d="M 10,15 L 70,15" stroke="black" stroke-width="2" fill="none" />
                      <path d="M -5,-7 L 10,0 L -5,7 Z" stroke="black" stroke-width="2" fill="white" transform="translate(60, 15)" />
                    </g>
                  </svg>
                </div>
                <div class="text-weight-medium text-center q-mt-sm">{{ type.label }}</div>
                <div class="text-caption text-center q-mt-xs">{{ type.description }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        
        <!-- Cardinality and Name Section -->
        <div class="q-mt-lg">
          <div class="text-subtitle2 q-mb-md">UML Properties</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-4">
              <q-input
                v-model="startCardinality"
                label="Start Cardinality"
                hint="e.g., 1, 0..1, 1..*, *"
                outlined
                dense
              />
            </div>
            
            <div class="col-4">
              <q-input
                v-model="endCardinality"
                label="End Cardinality"
                hint="e.g., 1, 0..1, 1..*, *"
                outlined
                dense
              />
            </div>
            
            <div class="col-4">
              <q-input
                v-model="relationshipName"
                label="Relationship Name"
                hint="e.g., Realiza, Contiene"
                outlined
                dense
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup @click="$emit('cancel')" />
        <q-btn flat label="Apply" color="primary" @click="confirm" :disable="!selectedType" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useChartStore } from 'src/store/chart'
import { useEditorStore } from 'src/store/editor'
import { sendDiagramUpdate } from 'src/boot/socket'

const props = defineProps({
  refId: {
    type: Number,
    required: true
  },
  initialType: {
    type: String,
    default: 'association'
  }
})

const emit = defineEmits(['cancel', 'confirm'])
const chartStore = useChartStore()

const isOpen = ref(true)
const selectedType = ref(props.initialType)

// Get current cardinality values from store
const currentRef = chartStore.getRef(props.refId)
const startCardinality = ref(currentRef?.startCardinality || '')
const endCardinality = ref(currentRef?.endCardinality || '')
const relationshipName = ref(currentRef?.relationshipName || '')

const relationshipTypes = [
  {
    value: 'association',
    label: 'Association',
    description: 'A basic relationship between two entities'
  },
  {
    value: 'composition',
    label: 'Composition',
    description: 'A whole-part relationship where parts cannot exist without the whole'
  },
  {
    value: 'aggregation',
    label: 'Aggregation',
    description: 'A whole-part relationship where parts can exist independently'
  },
  {
    value: 'generalization',
    label: 'Generalization',
    description: 'An inheritance or "is-a" relationship'
  }
]

const selectType = (type) => {
  selectedType.value = type
}

const confirm = () => {
  const ref = chartStore.getRef(props.refId)

  // Actualizar el store visual
  const updatedRefData = {
    ...ref,
    relationType: selectedType.value,
    startMarker: ['composition', 'aggregation'].includes(selectedType.value),
    endMarker: true
  };
  chartStore.updateRef(props.refId, updatedRefData);

  // Actualizar el texto DBML en el editor
  try {
    const editorStore = useEditorStore();
    let dbml = editorStore.getSourceText;
    
    // IMPORTANTE: El parser DBML estándar solo reconoce '>' como operador válido
    // Los otros operadores (<>, -, <|--) causan errores de sintaxis
    // Por eso SIEMPRE usamos '>' en el código DBML y guardamos el tipo visual en metadatos
    const relationOperators = {
      association: '>',        // Asociación: tabla1.id > tabla2.id
      composition: '>',        // Composición: tabla1.id > tabla2.id (visual diferente)
      aggregation: '>',        // Agregación: tabla1.id > tabla2.id (visual diferente)
      generalization: '>'      // Generalización: tabla1.id > tabla2.id (visual diferente)
    };
    
    // Expresión regular para eliminar cualquier comentario de tipo relación previo
    const relationCommentRegex = /\s*\/\/\s*(Relación simple|Composición: parte no puede existir sin el todo|Agregación: parte puede existir independientemente|Generalización: herencia o "es-un")\s*$/i;
    
    dbml = dbml.split('\n').map(line => {
      if (line.trim().toLowerCase().startsWith('ref:')) {
        // Quitar cualquier comentario anterior de tipo relación
        let lineWithoutComment = line.replace(relationCommentRegex, '');
        
        // Cambiar el operador de relación según el tipo seleccionado
        const newOperator = relationOperators[selectedType.value] || '>';
        
        console.log(`🔧 Procesando línea: "${lineWithoutComment}"`);
        console.log(`🔧 Tipo seleccionado: "${selectedType.value}" -> operador: "${newOperator}"`);
        
        // Como el parser DBML solo acepta '>', no necesitamos cambiar la sintaxis
        // El tipo visual se guarda en el store y se sincroniza por separado
        console.log(`🔧 Manteniendo sintaxis DBML estándar (>) y guardando tipo visual en store`);
        
        return lineWithoutComment.trimEnd();
      }
      return line;
    }).join('\n');
    // Deshabilitar actualizaciones de BBox mientras se actualiza la relación
    if (window.disableBBoxUpdates) {
      window.disableBBoxUpdates();
    }
    
    console.log('📝 Actualizando texto DBML en el editor con nuevo operador');
    editorStore.updateSourceText(dbml);
    
    // Forzar actualización de la base de datos para que el parser reconozca los cambios
    editorStore.updateDatabase();
    
    setTimeout(() => {
      if (window && window.refreshDbmlGraph) {
        console.log('🔄 Refrescando diagrama después de cambiar sintaxis DBML');
        window.refreshDbmlGraph();
      }
    }, 100);
  } catch (e) {
  }

  // Refrescar el diagrama
  if (window.refreshDbmlGraph) {
    window.refreshDbmlGraph();
  }

  // Sincronizar con otros usuarios
  console.log('🔗 Enviando actualización de tipo de relación:', {
    refId: props.refId,
    relationType: selectedType.value,
    startCardinality: startCardinality.value,
    endCardinality: endCardinality.value,
    relationshipName: relationshipName.value
  })
  
  // Detectar si estamos en modo Room o Individual
  if (window.sendRoomDiagramUpdate) {
    // Modo Room - usar función global de RoomEditor
    console.log('📡 Usando sendRoomDiagramUpdate para modo colaborativo')
    window.sendRoomDiagramUpdate('relationship-type-update', {
      refId: props.refId,
      relationType: selectedType.value,
      startCardinality: startCardinality.value,
      endCardinality: endCardinality.value,
      relationshipName: relationshipName.value,
      startMarker: updatedRefData.startMarker,
      endMarker: updatedRefData.endMarker
    })
  } else {
    // Modo Individual - usar función original
    console.log('📡 Usando sendDiagramUpdate para modo individual')
    sendDiagramUpdate('relationship-type-update', {
      refId: props.refId,
      relationType: selectedType.value,
      startCardinality: startCardinality.value,
      endCardinality: endCardinality.value,
      relationshipName: relationshipName.value,
      startMarker: updatedRefData.startMarker,
      endMarker: updatedRefData.endMarker
    })
  }

  emit('confirm', selectedType.value)
}

// Watch for dialog close
watch(isOpen, (val) => {
  if (!val) {
    emit('cancel')
  }
})
</script>

<style lang="scss" scoped>
.relationship-option {
  transition: all 0.2s ease;
  border: 1px solid #ddd;
  
  &:hover {
    border-color: #aaa;
  }
  
  &.selected-type {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
  }
}
</style>
