<script setup>
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { onKeyStroke } from "@vueuse/core";

import Flashcard from "../components/Flashcard.vue";
import { useFlashcardsStore } from "../stores/flashcards";

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();
const router = useRouter();


// Using storeToRefs to maintain reactivity
const { flashcards, isMediaAvailable } = storeToRefs(flashcardsStore);

// Simplified download logic: delegate to store action
const downloadAnkiFile = () => {
  const success = flashcardsStore.downloadAnkiFile();

  if (!success) {
    $q.notify({
      message: "Flashcard export failed",
      color: "negative",
      icon: "error",
      position: "top",
    });
  }
};

// New handler to download all media (audio or image)
const downloadMedia = async () => {
  const success = await flashcardsStore.downloadMedia();

  if (!success) {
    $q.notify({
      message: "Failed to download media.",
      color: "negative",
      icon: "error",
      position: "top",
    });
  }
};

// Navigate to new card page
function goToNewCard() {
  router.push({ name: "NewCard" });
}

// Handle flashcard actions
function editFlashcard(id) {
  router.push({ name: "EditCard", params: { id } });
}

function deleteFlashcard(id) {
  flashcardsStore.deleteFlashcard(id);
}

onKeyStroke('n', (e) => {
  e.preventDefault()

  goToNewCard();
})

</script>

<template>
  <div class="q-pa-md">
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
        :disable="!isMediaAvailable"
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
          :image-url="card.imageUrl"
          :type="card.type"
          @update:type="(newType) => card.type = newType"
          @edit="editFlashcard(card.id)"
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
