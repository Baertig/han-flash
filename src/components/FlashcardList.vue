<script setup>
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import Flashcard from "./flashcard/Flashcard.vue";
import NewFlashcardDialog from "../dialogs/NewFlashcardDialog.vue";
import { useFlashcardsStore } from "../stores/flashcards";

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();

// Using storeToRefs to maintain reactivity
const { flashcards } = storeToRefs(flashcardsStore);

// Function to trigger download
const downloadAnkiFile = () => {
  const ankiText = flashcardsStore.exportToAnkiFormat();
  if (!ankiText) {
    $q.notify({
      message: 'No flashcards available to export.',
      color: 'warning',
      icon: 'warning',
      position: 'top'
    });
    return;
  }

  const blob = new Blob([ankiText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'anki_export.txt'; // Filename for the download
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link); // Clean up
  URL.revokeObjectURL(url); // Free up memory
};

// Open new flashcard dialog using Quasar Dialog plugin
function openNewCardDialog() {
  $q.dialog({
    component: NewFlashcardDialog,
  }).onOk((data) => {
    flashcardsStore.addFlashcard(data);
  });
}

// Handle flashcard actions
function enhanceFlashcard(id) {
  console.log("Enhance flashcard", id);
  // To be implemented: API calls for example sentences, TTS, etc.
  // The actual implementation will use the store's enhanceFlashcard method
}

function deleteFlashcard(id) {
  flashcardsStore.deleteFlashcard(id);
}
</script>

<template>
  <div class="q-pa-md">
    <h1 class="text-h4 q-mb-md">Anki Card Creator</h1>
    <p class="q-mb-lg">
      Create content-rich flashcards for learning Chinese vocabulary
    </p>

    <!-- Add the download button here -->
    <div class="q-mb-md">
      <q-btn
        color="secondary"
        icon="download"
        label="Export for Anki"
        @click="downloadAnkiFile"
        :disable="flashcards.length === 0" 
      />
    </div>

    <div v-if="flashcards.length === 0" class="text-center q-pa-xl">
      <q-icon name="info" size="3rem" color="grey-7" />
      <p class="text-grey-7 q-mt-sm">No flashcards yet. Add your first one!</p>
    </div>

    <div class="row q-col-gutter-md">
      <div
        v-for="card in flashcards"
        :key="card.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <Flashcard
          :word="card.word"
          :pinyin="card.pinyin"
          :translation="card.translation"
          :example-sentence="card.exampleSentence"
          :sentence-pinyin="card.sentencePinyin"
          :sentence-translation="card.sentenceTranslation"
          :sentence-breakdown="card.sentenceBreakdown"
          :has-audio="card.hasAudio"
          :has-image="card.hasImage"
          @enhance="enhanceFlashcard(card.id)"
          @delete="deleteFlashcard(card.id)"
        />
      </div>
    </div>

    <!-- Floating action button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openNewCardDialog" />
    </q-page-sticky>
  </div>
</template>

<style scoped>
.flashcard {
  transition: transform 0.3s;
}
.flashcard:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
</style>
