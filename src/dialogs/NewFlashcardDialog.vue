<script setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";

const props = defineProps({
  // Custom props can be defined here
});

defineEmits([
  // Need to specify events that the component will emit through useDialogPluginComponent
  ...useDialogPluginComponent.emits,
]);

// Required: must be called inside of script setup
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const form = ref({
  word: "",
  pinyin: "",
  translation: "",
});

function onSubmit() {
  if (form.value.word && form.value.translation) {
    // Call onDialogOK with the form data to close the dialog and pass the data back
    onDialogOK({ ...form.value });
    form.value = { word: "", pinyin: "", translation: "" };
  }
}

// Expose the form for external access if needed
defineExpose({
  form,
});
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New Flashcard</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit.prevent="onSubmit">
          <q-input
            v-model="form.word"
            label="Chinese Word/Character *"
            outlined
            class="q-mb-md"
            :rules="[(val) => !!val || 'Word is required']"
          />

          <q-input
            v-model="form.pinyin"
            label="Pinyin"
            outlined
            class="q-mb-md"
            placeholder="e.g. nǐ hǎo"
          />

          <q-input
            v-model="form.translation"
            label="Translation *"
            outlined
            class="q-mb-md"
            :rules="[(val) => !!val || 'Trans(lat)ion is required']"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="onDialogCancel" />
        <q-btn flat label="Save" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
