<template>
  <q-list bordered separator>
    <q-item v-for="(word, idx) in interestingWords" :key="idx">
      <q-item-section>
        <q-item-label>{{ word.word }} · {{ word.pinyin }}</q-item-label>
        <q-item-label caption>{{ word.translation }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          size="sm"
          color="negative"
          icon="delete"
          @click="$emit('remove', idx)"
        />
      </q-item-section>
    </q-item>
    <q-item v-if="interestingWords.length === 0">
      <q-item-section>
        <q-item-label class="text-grey-7">No starred words yet</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
defineProps({
  interestingWords: {
    type: Array,
    required: true
  }
});

defineEmits(['remove']);
</script>
