<template>
  <div class="relationship-legend">
    <div class="legend-header">
      <q-icon name="info_outline" size="16px" class="q-mr-xs" />
      <span class="legend-title">Relationship Types</span>
      <q-btn 
        flat 
        dense 
        round 
        size="sm" 
        icon="close" 
        @click="$emit('close')"
        class="q-ml-auto"
      />
    </div>
    
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-line one-to-many"></div>
        <span class="legend-text">One-to-Many (1:N)</span>
      </div>
      
      <div class="legend-item">
        <div class="legend-line many-to-many"></div>
        <span class="legend-text">Many-to-Many (N:M)</span>
      </div>
      
      <div class="legend-item">
        <div class="legend-line one-to-one"></div>
        <span class="legend-text">One-to-One (1:1)</span>
      </div>
      
      <div class="legend-item">
        <div class="legend-line composition"></div>
        <span class="legend-text">Composition</span>
      </div>
      
      <div class="legend-item">
        <div class="legend-line aggregation"></div>
        <span class="legend-text">Aggregation</span>
      </div>
      
      <div class="legend-item">
        <div class="legend-line inheritance"></div>
        <span class="legend-text">Inheritance</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Emits
defineEmits(['close'])
</script>

<style scoped>
.relationship-legend {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  font-size: 13px;
}

.legend-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: #424242;
}

.legend-title {
  font-size: 14px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-line {
  width: 30px;
  height: 3px;
  border-radius: 2px;
  position: relative;
}

.legend-line::after {
  content: '';
  position: absolute;
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

.legend-line.one-to-many {
  background: #2196F3;
}
.legend-line.one-to-many::after {
  border-left-color: #2196F3;
}

.legend-line.many-to-many {
  background: linear-gradient(90deg, #4CAF50 50%, transparent 50%);
  background-size: 4px 3px;
}
.legend-line.many-to-many::after {
  border-left-color: #4CAF50;
}

.legend-line.one-to-one {
  background: #9C27B0;
  height: 2px;
}
.legend-line.one-to-one::after {
  border-left-color: #9C27B0;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}

.legend-line.composition {
  background: #D32F2F;
}
.legend-line.composition::after {
  border-left-color: #D32F2F;
}

.legend-line.aggregation {
  background: #FF9800;
}
.legend-line.aggregation::after {
  border-left-color: #FF9800;
}

.legend-line.inheritance {
  background: #009688;
  height: 2px;
}
.legend-line.inheritance::after {
  border-left-color: #009688;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}

.legend-text {
  color: #616161;
  font-size: 12px;
}

/* Dark mode styles */
.body--dark .relationship-legend {
  background: #2d2d2d;
  border-color: #424242;
  color: #e0e0e0;
}

.body--dark .legend-header {
  color: #e0e0e0;
}

.body--dark .legend-text {
  color: #bdbdbd;
}
</style>