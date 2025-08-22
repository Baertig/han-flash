<script setup>
import { defineProps, defineEmits } from "vue";
import { useDialogPluginComponent } from "quasar";

const props = defineProps({
  success: {
    type: Boolean,
    default: false,
  },
  justification: {
    type: String,
    default: "",
  },
  resultImage: {
    type: String,
    default: null,
  },
});

// Props and emits for Quasar Dialog Plugin
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const emit = defineEmits([...useDialogPluginComponent.emits]);

function handleContinue() {
  onDialogCancel();
}

function handleFinish() {
  onDialogOK();
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="min-width: 400px; max-width: 600px">
      <!-- Result Image -->
      <div v-if="success" class="relative-position">
        <q-img :src="resultImage" height="200px" class="rounded-borders-top" />
        <div class="absolute-bottom bg-gradient-transparent text-white q-pa-md">
          <div class="text-h6">
            {{ success ? "Success!!!" : "Not finished yet" }}
          </div>
        </div>
      </div>

      <!-- Header for cases without image -->
      <q-card-section v-else class="row items-center q-pb-none">
        <q-icon
          :name="success ? 'check_circle' : 'info'"
          :color="success ? 'positive' : 'warning'"
          size="md"
          class="q-mr-sm"
        />
        <div class="text-h6">
          {{ success ? "Success!!!" : "Not finished yet" }}
        </div>
      </q-card-section>

      <!-- Content -->
      <q-card-section>
        <div class="text-body1">
          {{ justification || "Scene evaluation completed." }}
        </div>

        <!-- Scene completion badge -->
        <div v-if="success" class="q-mt-md">
          <q-chip
            color="positive"
            text-color="white"
            icon="star"
            class="q-mb-sm"
          >
            Scene Completed Successfully!
          </q-chip>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Continue" color="primary" @click="handleContinue" />
        <q-btn
          unelevated
          label="Finish"
          color="negative"
          @click="handleFinish"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.bg-gradient-transparent {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

.rounded-borders-top {
  border-radius: 4px 4px 0 0;
}
</style>
