import { defineStore } from "pinia";
import { markRaw } from "vue";

export const useChartStore = defineStore("chart", {
  state: () => ({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    ctm: [1, 0, 0, 1, 0, 0],
    inverseCtm: [1, 0, 0, 1, 0, 0],
    tableGroups: {},
    tables: {},
    refs: {},
    grid: {
      size: 100,
      divisions: 10,
      snap: 5
    },
    loaded: false,
    tooltip: {
      x: 0,
      y: 0,
      show: false,
      target: null,
      component: null,
      binds: null,
      width: 0,
      height: 0
    },
    // Estado para la creación visual de relaciones
    connectionMode: {
      active: false,
      sourceField: null,
      sourceTable: null,
      tempLine: {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      },
      mousePosition: { x: 0, y: 0 }
    }
  }),
  getters: {
    subGridSize(state) {
      return state.grid.size / state.grid.divisions;
    },
    persistenceData(state) {
      const { zoom, pan, ctm, inverseCtm, tables, refs } = state;
      return  { zoom, pan, ctm, inverseCtm, tables, refs };
    },
    getPan(state) {
      return state.pan;
    },
    getZoom(state) {
      return state.zoom;
    },
    getCTM(state) {
      return state.ctm;
    },
    getTable(state) {
      return (tableId) => {
        if (!(tableId in state.tables))
          state.tables[tableId] = {
            x: 0,
            y: 0,
            width: 200,
            height: 32
          };
        return state.tables[tableId];
      };
    },
    getTableGroup(state) {
      return (tableGroupId) => {
        if (!(tableGroupId in state.tableGroups))
          state.tableGroups[tableGroupId] = {
            x: 0,
            y: 0,
            width: 200,
            height: 32
          };
        return state.tableGroups[tableGroupId];
      };
    },
    getRef(state) {
      return (refId) => {
        if (!(refId in state.refs)) {
          state.refs[refId] = {
            endpoints: [],
            vertices: [],
            auto: true,
            relationType: 'association', // Default relationship type
            startMarker: false,         // Whether to show marker at start 
            endMarker: true             // Whether to show marker at end (true for all types)
          };
        }
        // Make sure the relationship type is always defined
        if (!state.refs[refId].relationType) {
          state.refs[refId].relationType = 'association';
        }
        return state.refs[refId];
      };
    },
    save(state) {
      return {
        zoom: state.zoom,
        pan: state.pan,
        ctm: state.ctm,
        inverseCtm: state.inverseCtm,
        tables: state.tables,
        refs: state.refs,
        grid: state.grid
      };
    }
  },
  actions: {
    showTooltip(target, component, binds) {
      this.tooltip = {
        x: target.x,
        y: target.y,
        component: markRaw(component),
        binds,
        show: true
      };
    },
    hideTooltip() {
      this.tooltip = {
        x:0,
        y:0,
        width:0,
        height:0,
        component: null,
        binds: null,
        show: false
      };
    },
    
    showRelationshipTypeDialog(refId, initialType = 'association') {
      // Implementation will be in the main layout or app component
      // We'll return the info and let the component handle it
      return {
        refId, 
        initialType
      };
    },
    loadDatabase(database) {
      for(const tableGroup of database.schemas[0].tableGroups)
      {
        this.getTableGroup(tableGroup.id);
      }
      for(const table of database.schemas[0].tables)
      {
        this.getTable(table.id);
      }
      
      // Save existing relationship types before updating from the database
      const existingRefTypes = {};
      for(const refId in this.refs) {
        if(this.refs[refId].relationType) {
          existingRefTypes[refId] = {
            relationType: this.refs[refId].relationType,
            startMarker: this.refs[refId].startMarker,
            endMarker: this.refs[refId].endMarker
          };
        }
      }
      
      // Update refs from the database but preserve relationship types
      for(const ref of database.schemas[0].refs)
      {
        const currentRef = this.getRef(ref.id);
        
        // Preserve existing relationship type if available
        if(existingRefTypes[ref.id]) {
          currentRef.relationType = existingRefTypes[ref.id].relationType;
          currentRef.startMarker = existingRefTypes[ref.id].startMarker;
          currentRef.endMarker = existingRefTypes[ref.id].endMarker;
        }
      }

      this.loaded = true;
    },
    load(state) {
      this.$reset();
      this.$patch({
        ...state,
        ctm: DOMMatrix.fromMatrix(state.ctm),
        inverseCtm: DOMMatrix.fromMatrix(state.inverseCtm).inverse()
      });
    },
    updatePan(newPan) {
      this.$patch({
        pan: {
          x: newPan.x,
          y: newPan.y
        }
      });
    },

    updateZoom(newZoom) {
      this.$patch({
        zoom: newZoom
      });
    },

    updateCTM(newCTM) {
      this.$patch({
        ctm: DOMMatrix.fromMatrix(newCTM),
        inverseCtm: DOMMatrix.fromMatrix(newCTM).inverse()
      });
    },

    updateTable(tableId, newTable) {
      // Direct assignment since tables is an object, not a state property with $patch
      this.tables[tableId] = newTable;
      
      // Force reactivity by using $patch on the parent
      this.$patch({
        tables: { ...this.tables }
      });
    },
    updateRef(refId, newRef) {
      const prevPan = { ...this.pan };
      const prevZoom = this.zoom;
      console.log(`Chart store: Updating ref ${refId} from`, 
                  JSON.stringify(this.refs[refId]),
                  'to', JSON.stringify(newRef));
      // Direct assignment since refs is an object, not a state property with $patch
      this.refs[refId] = newRef;
      // Force reactivity by using $patch on the parent with a fresh object
      this.$patch({
        refs: JSON.parse(JSON.stringify(this.refs)),
        pan: prevPan,
        zoom: prevZoom
      });
      console.log(`Chart store: After update, ref ${refId} is now:`, 
                  JSON.stringify(this.refs[refId]));
    },

    // Acciones para el modo de conexión visual
    startConnection(field, table) {
      console.log('Starting connection from field:', field, 'in table:', table);
      
      this.connectionMode = {
        active: true,
        sourceField: field,
        sourceTable: table,
        tempLine: {
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0
        },
        mousePosition: { x: 0, y: 0 }
      };
    },

    updateConnectionLine(mouseX, mouseY) {
      if (this.connectionMode.active) {
        this.connectionMode.mousePosition = { x: mouseX, y: mouseY };
        this.connectionMode.tempLine.endX = mouseX;
        this.connectionMode.tempLine.endY = mouseY;
      }
    },

    cancelConnection() {
      console.log('Canceling connection');
      this.connectionMode = {
        active: false,
        sourceField: null,
        sourceTable: null,
        tempLine: {
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0
        },
        mousePosition: { x: 0, y: 0 }
      };
    },

    completeConnection(targetField, targetTable) {
      if (!this.connectionMode.active) return null;
      
      const sourceInfo = {
        field: this.connectionMode.sourceField,
        table: this.connectionMode.sourceTable
      };
      
      const targetInfo = {
        field: targetField,
        table: targetTable
      };
      
      console.log('Completing connection from', sourceInfo, 'to', targetInfo);
      
      // Cancelar el modo de conexión
      this.cancelConnection();
      
      // Retornar la información de la conexión para que el componente padre la procese
      return {
        source: sourceInfo,
        target: targetInfo
      };
    }
  }
});
