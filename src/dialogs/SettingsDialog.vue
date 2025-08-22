<script setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";

import { useSettingsStore } from "../stores/settings";

// Props and emits for Quasar Dialog Plugin
const props = defineProps({ modelValue: Boolean });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const emit = defineEmits([...useDialogPluginComponent.emits]);

const settingsStore = useSettingsStore();

// I only need the initial value here ... purposefully not calling "storeToRefs"
const { openaiApiKey, openrouterApiKey } = settingsStore;
const apiKey = ref(openaiApiKey);
const openrouterKey = ref(openrouterApiKey);

function save() {
  if (apiKey.value !== "") {
    settingsStore.setOpenAiApiKey(apiKey.value);
  }
  if (openrouterKey.value !== "") {
    settingsStore.setOpenRouterApiKey(openrouterKey.value);
  }
  onDialogOK();
}

const showApiKey = ref(false);
const showOpenRouterKey = ref(false);
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 600px">
      <q-card-section class="text-h6">Settings</q-card-section>

      <q-card-section>
        <q-input
          v-model="apiKey"
          label="OpenAI API Key"
          :type="showApiKey ? 'text' : 'password'"
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-icon
              :name="showApiKey ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              @click="showApiKey = !showApiKey"
            /> </template
        ></q-input>

        <q-input
          v-model="openrouterKey"
          label="OpenRouter API Key"
          :type="showOpenRouterKey ? 'text' : 'password'"
        >
          <template v-slot:append>
            <q-icon
              :name="showOpenRouterKey ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              @click="showOpenRouterKey = !showOpenRouterKey"
            /> </template
        ></q-input>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />

        <q-btn flat label="Save" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
