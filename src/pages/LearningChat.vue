<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import LLMChat from '../components/LLMChat.vue';
import InterestingWordsList from '../components/InterestingWordsList.vue';
import GradingDetails from '../components/GradingDetails.vue';
import { useLearningChatStore } from '../stores/learningChat';

const $q = useQuasar();
const store = useLearningChatStore();
const { interestingWords, selectedMessage, avgScores } = storeToRefs(store);

const route = useRoute();

// Dialogs state
const wordsDialogOpen = ref(false);
const gradingDialogOpen = ref(false);

// Responsive breakpoint detection
const isSmallScreen = computed(() => $q.screen.lt.sm);
const isExtraSmallScreen = computed(() => $q.screen.xs);

// Show/hide asides based on breakpoints
const showLeftAside = computed(() => !isSmallScreen.value);
const showRightAside = computed(() => !isExtraSmallScreen.value);

function removeInterestingWord(index) {
  store.interestingWords.splice(index, 1);
}

function onMessageSelected(messageId) {
  // If right aside is hidden, open grading dialog
  if (!showRightAside.value) {
    gradingDialogOpen.value = true;
  }
}

onMounted(() => {
  const sceneName = route.query.scene;
  if (sceneName) {
    store.loadScene(sceneName);
  }
});
</script>

<template>
  <div class="holy-grail" style="container-type: size;">
    <aside v-if="showLeftAside" class="left">
      <InterestingWordsList
        :interesting-words="interestingWords"
        @remove="removeInterestingWord"
      />
    </aside>

    <main class="center" style="height: 100cqh">
      <LLMChat @message-selected="onMessageSelected" />
    </main>

    <aside v-if="showRightAside" class="right">
      <GradingDetails
        :selected-message="selectedMessage"
        :avg-scores="avgScores"
      />
    </aside>

    <q-page-sticky
      v-if="!showLeftAside"
      position="bottom-left"
      :offset="[18, 77]"
    >
      <q-btn
        fab
        icon="star"
        color="primary"
        @click="wordsDialogOpen = true"
      >
        <q-badge
          v-if="interestingWords.length > 0"
          color="red"
          floating
        >
          {{ interestingWords.length }}
        </q-badge>
      </q-btn>
    </q-page-sticky>

    <!-- Words Dialog -->
    <q-dialog v-model="wordsDialogOpen">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Starred Words</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <InterestingWordsList
            :interesting-words="interestingWords"
            @remove="removeInterestingWord"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Grading Dialog -->
    <q-dialog v-model="gradingDialogOpen">
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">Message Grading</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <GradingDetails
            :selected-message="selectedMessage"
            :avg-scores="avgScores"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.holy-grail {
  display: grid;
  grid-template-columns: 400px minmax(400px, 2fr) 400px;
  grid-template-areas: 'left center right';
  gap: 16px;
  padding: 16px;
  height: 100%;
}

/* Medium screens and below - hide left aside */
@media (max-width: 1023.98px) {
  .holy-grail {
    grid-template-columns: minmax(400px, 1fr) 400px;
    grid-template-areas: 'center right';
  }
}

/* Small screens and below - hide both asides */
@media (max-width: 599.98px) {
  .holy-grail {
    grid-template-columns: 1fr;
    grid-template-areas: 'center';
    padding: 8px;
  }
}

.left { 
  grid-area: left; 
}

.center { 
  grid-area: center; 
}

.right { 
  grid-area: right; 
}



.placeholder {
  background: #f0f2f5;
  border: 1px dashed #cfd8dc;
  border-radius: 8px;
  padding: 12px;
  color: #78909c;
}
</style>
