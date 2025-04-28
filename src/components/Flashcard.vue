<script setup>
import { defineProps, ref, watch } from "vue";

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
  audioUrl: {
    type: String,
    default: "",
  },
});

// Emits for actions
const emit = defineEmits(["enhance", "delete"]);

// reference to hidden audio element
const audioRef = ref(null);
// update audio src when prop changes
watch(() => props.audioUrl, src => {
  if (audioRef.value && src) audioRef.value.src = src;
});
// play audio on button click
function playAudio() {
  if (audioRef.value) audioRef.value.play();
}
</script>

<template>
  <q-card class="flashcard">
    <!-- hidden audio element for playback -->
    <audio ref="audioRef" :src="audioUrl" hidden />

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
            <!-- only show visible breakdown items -->
            <div
              v-for="(item, index) in sentenceBreakdown.filter(i => i.visible !== false)"
              :key="index"
              class="q-mb-xs"
            >
              <span>{{ item.word }}</span>
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

      <q-btn v-if="!!props.audioUrl" flat color="primary" icon="volume_up" @click="playAudio" />
    </q-card-actions>
  </q-card>
</template>

