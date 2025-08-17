<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import LLMChat from '../components/LLMChat.vue';
import { useLearningChatStore } from '../stores/learningChat';

const store = useLearningChatStore();
const { interestingWords, selectedMessage, avgScores } = storeToRefs(store);

const selectedGrading = computed(() => selectedMessage.value?.meta?.grading || null);

const route = useRoute();

onMounted(() => {
  const sceneName = route.query.scene;
  if (sceneName) {
    store.loadScene(sceneName);
  }
});

</script>

<template>
  <div class="holy-grail" style="container-type: size;">
    <aside class="left">
        <q-expansion-item
          icon="star"
          label="Interesting words"
          v-if="interestingWords.length"
        >
          <q-list bordered separator>
            <q-item v-for="(w, idx) in interestingWords" :key="idx">
              <q-item-section>
                <q-item-label>{{ w.word }} · {{ w.pinyin }}</q-item-label>
                <q-item-label caption>{{ w.translation }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="store.interestingWords.splice(idx, 1)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
    </aside>

    <main class="center" style="height: 100cqh">
      <LLMChat />
    </main>

    <aside class="right">
      <div class="grading-panel">
        <div class="text-h6 q-mb-sm">Grading</div>
        <div v-if="!selectedGrading" class="text-grey-7">Select one of your messages to see details.</div>
        <div v-else>
          <div class="q-mb-sm">
            <div><b>语法和句法</b>: {{ selectedGrading.grammarAndSyntax }}/4</div>
            <div><b>词汇</b>: {{ selectedGrading.vocabulary }}/4</div>
            <div><b>互动交流</b>: {{ selectedGrading.interactiveCommunication }}/4</div>
            <div><b>内容和任务完成</b>: {{ selectedGrading.contentAndTaskFulfillment }}/4</div>
          </div>
          <div class="q-mb-sm">
            <div class="text-subtitle2 q-mb-xs">Explanations</div>
            <div><b>语法和句法:</b> {{ selectedGrading.explanations.grammarAndSyntax }}</div>
            <div><b>词汇:</b> {{ selectedGrading.explanations.vocabulary }}</div>
            <div><b>互动交流:</b> {{ selectedGrading.explanations.interactiveCommunication }}</div>
            <div><b>内容和任务完成:</b> {{ selectedGrading.explanations.contentAndTaskFulfillment }}</div>
          </div>
          <div>
            <div class="text-subtitle2 q-mb-xs">Improved sentence</div>
            <q-banner>{{ selectedGrading.suggested_improved_sentence }}</q-banner>
          </div>
        </div>

        <q-separator class="q-my-md" />
        <div class="text-subtitle2 q-mb-xs">Averages</div>
        <div v-if="avgScores">
          <div>Grammar & Syntax: <b>{{ avgScores.grammarAndSyntax }}</b></div>
          <div>Vocabulary: <b>{{ avgScores.vocabulary }}</b></div>
          <div>Interactive Communication: <b>{{ avgScores.interactiveCommunication }}</b></div>
          <div>Content & Task Fulfillment: <b>{{ avgScores.contentAndTaskFulfillment }}</b></div>
        </div>
        <div v-else class="text-grey-7">No graded messages yet.</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.holy-grail {
  display: grid;
  grid-template-columns: 400px minmax(400px, 1fr) 620px;
  grid-template-areas: 'left center right';
  gap: 16px;
  padding: 16px;
  height: 100%;
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
