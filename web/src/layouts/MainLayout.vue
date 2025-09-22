<template>
  <q-layout view="hHh lpr lfr">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title shrink>
          <q-avatar rounded>
            <q-img src="~assets/logo.png" />
          </q-avatar>
        </q-toolbar-title>
        <router-view name="toolbar"/>
        <connected-users />
        <!-- Chat Toggle Button -->
        <q-btn 
          flat 
          round 
          icon="chat"
          size="sm"
          @click="toggleRightDrawer"
          :color="rightDrawerOpen ? 'primary' : 'white'"
          class="q-ml-sm"
        >
          <q-tooltip>AI Assistant</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Right Drawer for Chat Panel -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      overlay
      :width="400"
      :breakpoint="768"
      class="bg-dark"
    >
      <chat-panel />
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
    
    <!-- Relationship Type Dialog -->
    <relationship-type-dialog 
      v-if="showRelationshipDialog"
      :ref-id="relationshipDialogData.refId"
      :initial-type="relationshipDialogData.initialType"
      @confirm="onRelationshipTypeConfirm"
      @cancel="showRelationshipDialog = false"
    />

    <!-- Relationship Creation Dialog -->
    <relationship-creation-dialog 
      v-if="showRelationshipCreationDialog && relationshipCreationData"
      :connection-info="relationshipCreationData"
      @confirm="onRelationshipCreationConfirm"
      @cancel="onRelationshipCreationCancel"
    />
  </q-layout>
</template>

<script>

  import { defineComponent, ref, onMounted } from 'vue'
  import ConnectedUsers from 'src/components/ConnectedUsers.vue'
  import RelationshipTypeDialog from 'src/components/RelationshipTypeDialog.vue'
  import RelationshipCreationDialog from 'src/components/RelationshipCreationDialog.vue'
  import ChatPanel from 'src/components/ChatPanel.vue'
  import { useChartStore } from 'src/store/chart'

  export default defineComponent({
    name: 'MainLayout',

    components: {
      ConnectedUsers,
      RelationshipTypeDialog,
      RelationshipCreationDialog,
      ChatPanel
    },

    setup () {
      const chartStore = useChartStore()
      const leftDrawerOpen = ref(false)
      const rightDrawerOpen = ref(false)
      const showRelationshipDialog = ref(false)
      const relationshipDialogData = ref({
        refId: null,
        initialType: 'association'
      })

      // Estado para el diálogo de creación de relaciones
      const showRelationshipCreationDialog = ref(false)
      const relationshipCreationData = ref(null)

      // Create a method to show the dialog
      const showRelationshipTypeDialogHandler = (refId, initialType = 'association') => {
        relationshipDialogData.value = {
          refId,
          initialType
        }
        showRelationshipDialog.value = true
      }
      
      // Add this method to the window for global access from components
      window.showRelationshipTypeDialogHandler = showRelationshipTypeDialogHandler

      // Método para mostrar el diálogo de creación de relaciones
      const showRelationshipCreationDialogHandler = (connectionInfo) => {
        relationshipCreationData.value = connectionInfo
        showRelationshipCreationDialog.value = true
      }
      
      // Añadir al window para acceso global
      window.showRelationshipCreationDialog = showRelationshipCreationDialogHandler

      const onRelationshipTypeConfirm = (type) => {
        showRelationshipDialog.value = false
        // The relationship update is handled in the dialog component
      }

      const onRelationshipCreationConfirm = (relationshipData) => {
        console.log('New relationship confirmed:', relationshipData)
        showRelationshipCreationDialog.value = false
        
        // Llamar a la función global de creación de DBML
        if (window.createDbmlRelationship) {
          window.createDbmlRelationship(relationshipData)
        } else {
          console.error('DBML relationship creation function not available!')
          alert('Error: Could not create relationship. Please check console.')
        }
      }

      const onRelationshipCreationCancel = () => {
        showRelationshipCreationDialog.value = false
        relationshipCreationData.value = null
      }

      return {
        leftDrawerOpen,
        rightDrawerOpen,
        showRelationshipDialog,
        relationshipDialogData,
        showRelationshipCreationDialog,
        relationshipCreationData,
        onRelationshipTypeConfirm,
        onRelationshipCreationConfirm,
        onRelationshipCreationCancel,
        toggleLeftDrawer () {
          leftDrawerOpen.value = !leftDrawerOpen.value
        },
        toggleRightDrawer () {
          rightDrawerOpen.value = !rightDrawerOpen.value
        }
      }
    }
  })
</script>
