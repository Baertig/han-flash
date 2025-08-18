<script setup>
import { computed, ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import { useRouter } from 'vue-router';
import { useLearningChatStore } from "../stores/learningChat";

const $q = useQuasar();
const router = useRouter();
const store = useLearningChatStore();
const { topic, messages, interestingWords, assistantLoading, sceneCompleted } = storeToRefs(store);

const emit = defineEmits(['messageSelected']);

const isBusy = computed(() => store.isBusy);
const input = ref("");

function selectMessage(messageId) {
  store.selectMessage(messageId);
  emit('messageSelected', messageId);
}

function send() {
  const content = input.value;
  input.value = "";
  store
    .sendMessage(content)
    .catch(() =>
      $q.notify({ type: "negative", message: "Assistant failed to reply" })
    );
}

async function endConversation() {
  try {
    const result = await store.endConversation();
    if (result) {
      $q.dialog({
        title: result.sucess ? 'Success!!!' : 'Your are not finished yet.',
        message: `${result.justification}`,
        cancel: {
          label: 'Continue',
          color: 'primary',
        },
        ok: {
          label: 'Finish',
          color: 'negative'
        },
        persistent: true
      }).onOk(() => {
        store.reset();
        router.push({ name: 'ScenesSelection' });
      });
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Verification failed' });
  }
}
</script>

<template>
  <div class="relative-position q-pa-md full-height">
    <div class="chat-layout full-height">
      <div class="row justify-between items-center">
        <div class="text-subtitle1 row items-center q-gutter-sm">
          {{ store.currentScene?.title || topic }}
          <q-icon
            v-if="sceneCompleted"
            name="check_circle"
            color="positive"
            size="md"
            class="q-ml-sm"
          >
            <q-tooltip class="bg-positive">
              Scene goal completed successfully!
            </q-tooltip>
          </q-icon>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn
            flat
            color="negative"
            icon="stop"
            label="End conversation"
            :disable="isBusy"
            @click="endConversation"
          />
        </div>
      </div>

      <div
        class="q-pa-sm bg-grey-2 chat-surface"
      >
        <div
          v-for="m in messages"
          :key="m.id"
          class="message-row q-mb-sm"
          :class="{
            selected: m.role === 'user' && store.selectedMessageId === m.id,
            'user-row': m.role === 'user',
          }"
        >
          <q-btn
            v-if="m.role === 'user'"
            dense
            flat
            round
            icon="info"
            class="info-btn"
            @click="selectMessage(m.id)"
          />
          <q-chat-message
            :name="m.role === 'user' ? 'You' : '伙伴'"
            :text="[m.text]"
            :sent="m.role === 'user'"
            class="hanzi"
            @click="m.role === 'user' && selectMessage(m.id)"
          >
            <template v-if="m.role === 'assistant' && m.meta?.tokens" #default>
              <div class="tokens-container">
                <span
                  v-for="(t, idx) in m.meta.tokens"
                  :key="idx"
                  class="token"
                >
                  {{ t.word }}
                  <q-menu
                    anchor="bottom middle"
                    self="top middle"
                    :offset="[0, 6]"
                  >
                    <q-card style="min-width: 240px">
                      <q-card-section class="q-pb-none">
                        <div class="text-subtitle1">{{ t.word }}</div>
                        <div class="text-caption text-grey-7">
                          {{ t.pinyin }}
                        </div>
                      </q-card-section>
                      <q-card-section class="q-pt-sm">{{
                        t.translation
                      }}</q-card-section>
                      <q-card-actions align="right">
                        <q-btn
                          flat
                          color="primary"
                          :icon="
                            interestingWords.some((w) => w.word === t.word)
                              ? 'star'
                              : 'star_border'
                          "
                          :label="
                            interestingWords.some((w) => w.word === t.word)
                              ? 'Unstar'
                              : 'Star'
                          "
                          @click.stop="store.toggleInteresting(t)"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-menu>
                </span>
              </div>
            </template>

            <template #stamp>
              <div v-if="m.role === 'user'" class="row items-center no-wrap">
                <q-spinner
                  v-if="m.meta?.gradingLoading"
                  size="16px"
                  color="primary"
                />
                <template v-else-if="m.meta?.grading">
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >G {{ m.meta.grading.grammarAndSyntax }}/4</q-chip
                  >
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >V {{ m.meta.grading.vocabulary }}/4</q-chip
                  >
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >I {{ m.meta.grading.interactiveCommunication }}/4</q-chip
                  >
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >C {{ m.meta.grading.contentAndTaskFulfillment }}/4</q-chip
                  >
                </template>
              </div>
            </template>
          </q-chat-message>
        </div>

        <q-chat-message v-if="assistantLoading" :name="'伙伴'" :sent="false">
          <template #default>
            <div class="row items-center q-gutter-sm">
              <q-spinner size="18px" color="primary" />
              <span class="text-grey-7">正在思考…</span>
            </div>
          </template>
        </q-chat-message>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input v-model="input" class="col-grow" dense outlined placeholder="Type your first message in Chinese..." @keyup.enter="send" />
        <q-btn color="primary" label="Send" :disable="isBusy" @click="send" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-surface {
  position: relative;
  border-radius: 8px; 
  overflow-y: auto;
  min-height: 0;
}

.chat-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.hanzi {
  font-size: 1.8rem;
  line-height: 2.2rem;
}
.token {
  display: inline;
  padding: 0 2px;
  border-radius: 4px;
  transition: background-color 0.15s ease-in-out;
}
.token:hover {
  background-color: rgba(0, 0, 0, 0.08);
}
.cursor-pointer {
  cursor: pointer;
}
.message-row {
  position: relative;
  border-radius: 8px;
  padding: 6px 8px;
}
.message-row.user-row {
  padding-right: 34px;
}
.message-row.selected {
  background-color: rgba(33, 150, 243, 0.14);
}
.info-btn {
  position: absolute;
  top: 2px;
  right: 6px;
}
</style>
