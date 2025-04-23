<script setup>
import FlashcardList from './components/FlashcardList.vue'
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          Anki Card Creator
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <FlashcardList />
    </q-page-container>
  </q-layout>
</template>

<style>
/* Global styles */
body {
  font-family: 'Roboto', sans-serif;
  background-color: #f5f5f5;
}
</style>
