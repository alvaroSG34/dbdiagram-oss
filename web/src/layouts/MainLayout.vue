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
      </q-toolbar>
    </q-header>
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
  </q-layout>
</template>

<script>

  import { defineComponent, ref, onMounted } from 'vue'
  import ConnectedUsers from 'src/components/ConnectedUsers.vue'
  import RelationshipTypeDialog from 'src/components/RelationshipTypeDialog.vue'
  import { useChartStore } from 'src/store/chart'

  export default defineComponent({
    name: 'MainLayout',

    components: {
      ConnectedUsers,
      RelationshipTypeDialog
    },

    setup () {
      const chartStore = useChartStore()
      const leftDrawerOpen = ref(false)
      const showRelationshipDialog = ref(false)
      const relationshipDialogData = ref({
        refId: null,
        initialType: 'association'
      })

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

      const onRelationshipTypeConfirm = (type) => {
        showRelationshipDialog.value = false
        // The relationship update is handled in the dialog component
      }

      return {
        leftDrawerOpen,
        showRelationshipDialog,
        relationshipDialogData,
        onRelationshipTypeConfirm,
        toggleLeftDrawer () {
          leftDrawerOpen.value = !leftDrawerOpen.value
        }
      }
    }
  })
</script>
