// Modificaciones propuestas para DbmlGraph.vue para soportar relaciones UML

// En el setup del componente DbmlGraph.vue, añadir manejo para tipos de relaciones UML
const refs = computed(() => {
  if (!props.schema || !props.schema.refs) return []
  
  return props.schema.refs.map(r => {
    // Mapeo existente...
    
    // Determinar el tipo de relación UML basado en los datos del esquema
    let relationType = 'association'; // Valor predeterminado
    let startNavigable = false;
    let endNavigable = false;
    
    // Esta lógica dependería de cómo se guarda la información en el esquema
    if (r.type) {
      switch (r.type) {
        case 'oneToMany':
          endNavigable = true;
          break;
        case 'manyToOne':
          startNavigable = true;
          break;
        case 'oneToOne':
          // Podría ser ambas direcciones o ninguna dependiendo de la implementación
          break;
        case 'association':
          // Asociación simple
          break;
        case 'associationTo':
          endNavigable = true;
          break;
        case 'associationFrom':
          startNavigable = true;
          break;
        case 'aggregation':
          relationType = 'aggregation';
          endNavigable = true;
          break;
        case 'composition':
          relationType = 'composition';
          endNavigable = true;
          break;
        case 'generalization':
          relationType = 'generalization';
          startNavigable = true;
          break;
        case 'realization':
          relationType = 'realization';
          startNavigable = true;
          break;
      }
    }
    
    return {
      // Propiedades existentes...
      relationType,
      startNavigable,
      endNavigable,
      // Otras propiedades necesarias...
    }
  })
});
