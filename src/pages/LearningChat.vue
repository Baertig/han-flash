<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import LearningChat from '../components/LearningChat.vue';
import { useLearningChatStore } from '../stores/learningChat';

const store = useLearningChatStore();
const { messages, selectedMessage, avgScores } = storeToRefs(store);

const selectedGrading = computed(() => selectedMessage.value?.meta?.grading || null);
</script>

<template>
  <div class="holy-grail">
    <aside class="left">
      <!-- Placeholder left sidebar -->
      <div class="placeholder">Left sidebar (coming soon)</div>
    </aside>

    <main class="center">
      <LearningChat />
    </main>

    <aside class="right">
      <div class="grading-panel">
        <div class="text-h6 q-mb-sm">Grading</div>
        <div v-if="!selectedGrading" class="text-grey-7">Select one of your messages to see details.</div>
        <div v-else>
          <div class="q-mb-sm">
            <div><b>自然度</b>: {{ selectedGrading.naturalness }}/5</div>
            <div><b>语法</b>: {{ selectedGrading.grammar }}/5</div>
            <div><b>复杂度</b>: {{ selectedGrading.complexity }}/5</div>
          </div>
          <div class="q-mb-sm">
            <div class="text-subtitle2 q-mb-xs">Explanations</div>
            <div><b>自然度:</b> {{ selectedGrading.explanations.naturalness }}</div>
            <div><b>语法:</b> {{ selectedGrading.explanations.grammar }}</div>
            <div><b>复杂度:</b> {{ selectedGrading.explanations.complexity }}</div>
          </div>
          <div>
            <div class="text-subtitle2 q-mb-xs">Improved sentence</div>
            <q-banner>{{ selectedGrading.suggested_improved_sentence }}</q-banner>
          </div>
        </div>

        <q-separator class="q-my-md" />
        <div class="text-subtitle2 q-mb-xs">Averages</div>
        <div v-if="avgScores">
          <div>Naturalness: <b>{{ avgScores.naturalness }}</b></div>
          <div>Grammar: <b>{{ avgScores.grammar }}</b></div>
          <div>Complexity: <b>{{ avgScores.complexity }}</b></div>
        </div>
        <div v-else class="text-grey-7">No graded messages yet.</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.holy-grail {
  display: grid;
  grid-template-columns: 240px minmax(400px, 1fr) 320px;
  grid-template-areas: 'left center right';
  gap: 16px;
  padding: 16px;
}
.left { grid-area: left; }
.center { grid-area: center; }
.right { grid-area: right; }

.placeholder {
  background: #f0f2f5;
  border: 1px dashed #cfd8dc;
  border-radius: 8px;
  padding: 12px;
  color: #78909c;
}

.grading-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}
</style>
