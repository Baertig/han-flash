<script setup>
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import Flashcard from "../components/Flashcard.vue";
import { useFlashcardsStore } from "../stores/flashcards";
import { useRouter } from 'vue-router';

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();
const router = useRouter();

// Using storeToRefs to maintain reactivity
const { flashcards } = storeToRefs(flashcardsStore);

// Simplified download logic: delegate to store action
const downloadAnkiFile = () => {
  const success = flashcardsStore.downloadAnkiFile();
  if (!success) {
    $q.notify({ message: 'No flashcards available to export.', color: 'warning', icon: 'warning', position: 'top' });
  }
};

// New handler to download all audio media
const downloadMedia = async () => {
  const success = await flashcardsStore.downloadMedia();
  if (!success) {
    $q.notify({ message: 'No media available to download.', color: 'warning', icon: 'warning', position: 'top' });
  }
};

// Navigate to new card page
function goToNewCard() {
  router.push({ name: 'NewCard' });
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
      <q-btn
        color="secondary"
        icon="music_note"
        label="Download Media"
        class="q-ml-sm"
        @click="downloadMedia"
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
          :audio-url="card.audioUrl"
          @enhance="enhanceFlashcard(card.id)"
          @delete="deleteFlashcard(card.id)"
        />
      </div>
    </div>

    <!-- Floating action button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="goToNewCard" />
    </q-page-sticky>
  </div>
</template>
