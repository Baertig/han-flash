<script setup>
import { computed } from "vue";

const props = defineProps({
  selectedMessage: {
    type: Object,
    default: null,
  },
  avgScores: {
    type: Object,
    default: null,
  },
});

const selectedGrading = computed(
  () => props.selectedMessage?.meta?.grading || null
);
</script>

<template>
  <div class="grading-panel">
    <div class="text-h6 q-mb-sm">Grading</div>
    <div v-if="!selectedGrading" class="text-grey-7">
      Select one of your messages to see details.
    </div>
    <div v-else>
      <div class="q-mb-sm">
        <div><b>语法和句法</b>: {{ selectedGrading.grammarAndSyntax }}/4</div>
        <div><b>词汇</b>: {{ selectedGrading.vocabulary }}/4</div>
        <div>
          <b>互动交流</b>: {{ selectedGrading.interactiveCommunication }}/4
        </div>
        <div>
          <b>内容和任务完成</b>:
          {{ selectedGrading.contentAndTaskFulfillment }}/4
        </div>
      </div>
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">Explanations</div>
        <div>
          <b>语法和句法:</b> {{ selectedGrading.explanations.grammarAndSyntax }}
        </div>
        <div><b>词汇:</b> {{ selectedGrading.explanations.vocabulary }}</div>
        <div>
          <b>互动交流:</b>
          {{ selectedGrading.explanations.interactiveCommunication }}
        </div>
        <div>
          <b>内容和任务完成:</b>
          {{ selectedGrading.explanations.contentAndTaskFulfillment }}
        </div>
      </div>
      <div>
        <div class="text-subtitle2 q-mb-xs">Improved sentence</div>
        <q-banner>{{ selectedGrading.suggested_improved_sentence }}</q-banner>
      </div>
    </div>

    <q-separator class="q-my-md" />
    <div class="text-subtitle2 q-mb-xs">Averages</div>
    <div v-if="avgScores">
      <div>
        Grammar & Syntax: <b>{{ avgScores.grammarAndSyntax }}</b>
      </div>
      <div>
        Vocabulary: <b>{{ avgScores.vocabulary }}</b>
      </div>
      <div>
        Interactive Communication:
        <b>{{ avgScores.interactiveCommunication }}</b>
      </div>
      <div>
        Content & Task Fulfillment:
        <b>{{ avgScores.contentAndTaskFulfillment }}</b>
      </div>
    </div>
    <div v-else class="text-grey-7">No graded messages yet.</div>
  </div>
</template>

<style scoped>
.grading-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}
</style>
