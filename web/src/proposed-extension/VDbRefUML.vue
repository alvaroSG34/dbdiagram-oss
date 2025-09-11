// Extensión propuesta para VDbRef.vue para soportar relaciones UML

<template>
  <g
    ref="root"
    :id="`ref-${id}`"
    :class="{
      'db-ref':true,
      'db-ref__highlight': highlight,
      'db-ref__association': isAssociation,
      'db-ref__aggregation': isAggregation,
      'db-ref__composition': isComposition,
      'db-ref__generalization': isGeneralization,
      'db-ref__realization': isRealization
    }"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave"
  >
    <!-- Línea base de la relación -->
    <path
      class="db-ref__hitbox"
      :d="path"
    />
    <path
      class="db-ref__path"
      :d="path"
      :stroke-dasharray="isDashed ? '5,5' : 'none'"
    />

    <!-- Marcadores de inicio y fin según el tipo de relación -->
    <marker v-if="showStartMarker" 
            :id="`marker-start-${id}`" 
            :orient="startMarkerOrient" 
            markerWidth="10" 
            markerHeight="10"
            refX="0" 
            refY="5">
      <g :transform="`rotate(${startMarkerRotation} 5 5)`">
        <!-- Para asociación navegable -->
        <polygon v-if="isNavigableStart" 
                 points="0,0 10,5 0,10" 
                 fill="black" />
        
        <!-- Para agregación -->
        <polygon v-if="isAggregation && isEndStart" 
                 points="0,5 5,0 10,5 5,10" 
                 fill="white" 
                 stroke="black" 
                 stroke-width="1" />
        
        <!-- Para composición -->
        <polygon v-if="isComposition && isEndStart" 
                 points="0,5 5,0 10,5 5,10" 
                 fill="black" />
        
        <!-- Para generalización/herencia -->
        <polygon v-if="isGeneralization && isEndStart" 
                 points="0,0 10,5 0,10" 
                 fill="white" 
                 stroke="black" 
                 stroke-width="1" />
      </g>
    </marker>

    <marker v-if="showEndMarker" 
            :id="`marker-end-${id}`" 
            :orient="endMarkerOrient" 
            markerWidth="10" 
            markerHeight="10"
            refX="10" 
            refY="5">
      <g :transform="`rotate(${endMarkerRotation} 5 5)`">
        <!-- Para asociación navegable -->
        <polygon v-if="isNavigableEnd" 
                 points="0,0 10,5 0,10" 
                 fill="black" />
        
        <!-- Para agregación -->
        <polygon v-if="isAggregation && isEndEnd" 
                 points="0,5 5,0 10,5 5,10" 
                 fill="white" 
                 stroke="black" 
                 stroke-width="1" />
        
        <!-- Para composición -->
        <polygon v-if="isComposition && isEndEnd" 
                 points="0,5 5,0 10,5 5,10" 
                 fill="black" />
        
        <!-- Para generalización/herencia -->
        <polygon v-if="isGeneralization && isEndEnd" 
                 points="0,0 10,5 0,10" 
                 fill="white" 
                 stroke="black" 
                 stroke-width="1" />
      </g>
    </marker>

    <!-- Puntos de control para editar la forma de la relación -->
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

    <!-- Etiqueta de relación (opcional) -->
    <text v-if="name" 
          :x="labelPosition.x" 
          :y="labelPosition.y" 
          class="db-ref__label">
      {{ name }}
    </text>
  </g>
</template>

<script setup>
  // Importaciones y configuración básica similar al VDbRef.vue original
  // Añade cálculos para determinar qué tipo de relación es y cómo mostrarla
  
  const props = defineProps({
    id: Number,
    name: String,
    endpoints: Array,
    // Nueva propiedad para el tipo de relación
    relationType: {
      type: String,
      default: 'association' // Valores: association, aggregation, composition, generalization, realization
    },
    // Propiedades para la navegabilidad
    startNavigable: {
      type: Boolean,
      default: false
    },
    endNavigable: {
      type: Boolean,
      default: false
    },
    // Otras propiedades existentes
    onUpdate: [String, Object, undefined],
    onDelete: [String, Object, undefined],
    schema: Object,
    dbState: Object,
    database: Object,
    token: Object,
    containerRef: Object
  });

  // Computed properties para determinar el tipo de relación
  const isAssociation = computed(() => props.relationType === 'association');
  const isAggregation = computed(() => props.relationType === 'aggregation');
  const isComposition = computed(() => props.relationType === 'composition');
  const isGeneralization = computed(() => props.relationType === 'generalization');
  const isRealization = computed(() => props.relationType === 'realization');
  
  // Para líneas punteadas en realizaciones
  const isDashed = computed(() => props.relationType === 'realization');
  
  // Determina si mostrar marcadores en los extremos
  const showStartMarker = computed(() => 
    props.startNavigable || 
    isAggregation.value || 
    isComposition.value || 
    (isGeneralization.value && isEndStart.value)
  );
  
  const showEndMarker = computed(() => 
    props.endNavigable || 
    (isAggregation.value && isEndEnd.value) || 
    (isComposition.value && isEndEnd.value) || 
    (isGeneralization.value && isEndEnd.value)
  );
  
  // Determina qué extremo tiene el marcador especial
  const isEndStart = computed(() => {
    // Lógica para determinar si el marcador especial va en el inicio
    // Esto dependería de cómo se define la dirección en DBML
  });
  
  const isEndEnd = computed(() => {
    // Lógica para determinar si el marcador especial va en el final
    // Esto dependería de cómo se define la dirección en DBML
  });
  
  // Para calcular la orientación de los marcadores
  const startMarkerOrient = computed(() => {
    // Calcula la orientación basada en la dirección de la línea
  });
  
  const endMarkerOrient = computed(() => {
    // Calcula la orientación basada en la dirección de la línea
  });
  
  // Rotación de los marcadores
  const startMarkerRotation = computed(() => {
    // Calcula la rotación para que el marcador se alinee correctamente
  });
  
  const endMarkerRotation = computed(() => {
    // Calcula la rotación para que el marcador se alinee correctamente
  });
  
  // Posición de la etiqueta
  const labelPosition = computed(() => {
    // Calcula una posición adecuada para la etiqueta de la relación
  });
  
  // Resto del código existente para puntos de control, etc.
  // ...
</script>

<style lang="scss" scoped>
// Los estilos se definirían en _refs.scss
</style>
