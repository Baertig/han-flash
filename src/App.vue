<script setup>
import { Dialog } from 'quasar';

import { useSettingsStore } from './stores/settings';
import SettingsDialog from './dialogs/SettingsDialog.vue';

const { hasApiKey } = useSettingsStore();

function openSettingsDialog() {
  Dialog.create({
    component: SettingsDialog
  });
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>HanFlash</q-toolbar-title>
        <q-space />
        <q-btn flat dense round icon="settings" @click="openSettingsDialog" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-banner v-if="!hasApiKey" class="bg-negative text-white" dense> OpenAI API key is missing. Please set it in settings.
      </q-banner>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
/* Global styles */
body {
  font-family: "Roboto", sans-serif;
  background-color: #f5f5f5;
}
</style>
