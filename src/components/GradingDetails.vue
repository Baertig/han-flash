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
    <div v-else class="grading-text">
      <pre class="grading-content">{{ selectedGrading }}</pre>
    </div>
  </div>
</template>

<style scoped>
.grading-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}

.grading-text {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
}

.grading-content {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>
