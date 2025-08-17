<script setup>
import { Dialog } from 'quasar';
import { useRouter } from 'vue-router';

import { useSettingsStore } from './stores/settings';
import SettingsDialog from './dialogs/SettingsDialog.vue';
import { storeToRefs } from 'pinia';
import { useLearningChatStore } from './stores/learningChat';

const { hasApiKey } = storeToRefs(useSettingsStore());
const router = useRouter();
const chatStore = useLearningChatStore();

function openSettingsDialog() {
  Dialog.create({
    component: SettingsDialog
  });
}

function goChat() {
  if (chatStore.currentScene) {
    router.push({ name: 'LearningChat', query: { scene: chatStore.currentScene.name } });
  } else {
    router.push({ name: 'ScenesSelection' });
  }
}
</script>

<template>
  <q-layout view="hHh lpR fFf" style="height: 100vh">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="cursor-pointer" @click="router.push({ name: 'ScenesSelection' })">HanFlash</q-toolbar-title>
        <q-space />
        <q-btn flat dense label="Scenes" icon="dashboard" @click="router.push({ name: 'ScenesSelection' })" />
        <q-btn flat dense label="Chat" icon="chat" @click="goChat" />
        <q-btn flat dense round icon="settings" @click="openSettingsDialog" />
      </q-toolbar>
    </q-header>

    <q-page-container class="full-height">
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
