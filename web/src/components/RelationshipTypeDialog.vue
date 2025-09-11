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
  
  // Force reactivity by creating a completely new object
  const updatedRefData = {
    ...ref,
    relationType: selectedType.value,
    startMarker: ['composition', 'aggregation', 'generalization'].includes(selectedType.value),
    endMarker: true // All relationship types should have an end marker now
  };
  
  // Directly update the store with the new object
  chartStore.updateRef(props.refId, updatedRefData);
  
  // Check if the update was successful
  const updatedRef = chartStore.getRef(props.refId);
  
  // Force DbmlGraph to refresh
  if (window.refreshDbmlGraph) {
    console.log("Triggering graph refresh");
    window.refreshDbmlGraph();
  }
  
  // Send update to all connected users
  sendDiagramUpdate('relation-type-update', {
    refId: props.refId,
    relationType: selectedType.value,
    startMarker: updatedRef.startMarker,
    endMarker: updatedRef.endMarker
  })
  
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
