<script setup>
import { defineProps } from "vue";

const props = defineProps({
  word: {
    type: String,
    required: true,
  },
  pinyin: {
    type: String,
    default: "",
  },
  translation: {
    type: String,
    required: true,
  },
  exampleSentence: {
    type: String,
    default: "",
  },
  sentencePinyin: {
    type: String,
    default: "",
  },
  sentenceTranslation: {
    type: String,
    default: "",
  },
  sentenceBreakdown: {
    type: Array,
    default: () => [],
  },
  hasAudio: {
    type: Boolean,
    default: false,
  },
  hasImage: {
    type: Boolean,
    default: false,
  },
});

// Emits for actions
const emit = defineEmits(["enhance", "delete"]);
</script>

<template>
  <q-card class="flashcard">
    <q-card-section>
      <div class="row items-baseline">
        <div class="text-h5 q-mr-md">{{ word }}</div>
        <div class="text-subtitle1 text-primary">{{ pinyin }}</div>
      </div>
      <div class="text-subtitle1">{{ translation }}</div>
    </q-card-section>

    <q-card-section v-if="exampleSentence" class="q-pt-none">
      <q-separator class="q-mb-sm" />
      <div class="text-body1">{{ exampleSentence }}</div>
      <div class="text-caption text-primary q-mb-sm">{{ sentencePinyin }}</div>
      <div class="text-caption">{{ sentenceTranslation }}</div>

      <q-expansion-item
        v-if="sentenceBreakdown && sentenceBreakdown.length > 0"
        label="Breakdown"
        header-class="text-primary"
        class="q-mt-sm"
        dense
      >
        <q-card>
          <q-card-section>
            <div
              v-for="(item, index) in sentenceBreakdown"
              :key="index"
              class="q-mb-xs"
            >
              <span class="text-weight-bold">{{ item.word }}</span>
              <span v-if="item.pinyin" class="text-primary q-ml-xs"
                >({{ item.pinyin }})</span
              >:
              <span class="q-ml-xs">{{ item.meaning }}</span>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-card-section>

    <q-card-actions>
      <q-btn
        flat
        color="primary"
        label="Enhance"
        icon="auto_awesome"
        @click="emit('enhance')"
      />
      <q-btn
        flat
        color="negative"
        label="Delete"
        icon="delete"
        @click="emit('delete')"
      />

      <q-space />

      <q-btn v-if="hasAudio" flat round color="primary" icon="volume_up" />
      <q-btn v-if="hasImage" flat round color="primary" icon="image" />
    </q-card-actions>
  </q-card>
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
