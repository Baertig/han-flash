<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import { useLearningChatStore } from "../stores/learningChat";

const $q = useQuasar();
const store = useLearningChatStore();
const {
  level,
  topic,
  practiceWordsInput,
  started,
  messages,
  interestingWords,
  assistantLoading,
} = storeToRefs(store);

const isBusy = computed(() => store.isBusy);
const input = ref("");

function start() {
  store
    .startConversation()
    .catch(() =>
      $q.notify({ type: "negative", message: "Failed to start conversation" })
    );
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
</script>

<template>
  <div class="relative-position q-pa-md full-height">
    <div v-if="!started">
      <q-input
        v-model="practiceWordsInput"
        type="textarea"
        label="Words to practice (comma/space separated)"
        autogrow
      />

      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-select
            v-model="level"
            :options="['A1', 'A2', 'B1', 'B2', 'C1', 'C2']"
            label="Level"
          />
        </div>

        <div class="col-6">
          <q-input v-model="topic" label="Topic" />
        </div>
      </div>

      <div class="row items-center q-gutter-sm q-mt-sm">
        <q-btn color="primary" label="Start" :disable="isBusy" @click="start" />
      </div>
    </div>

    <div v-else class="q-gutter-md full-height column">
      <div class="row justify-between items-center">
        <div class="text-subtitle1">
          Level: {{ level }} · Topic: {{ topic }}
        </div>
        <q-btn
          flat
          color="negative"
          icon="stop"
          label="End conversation"
          :disable="isBusy"
          @click="store.endConversation()"
        />
      </div>

      <div
        class="q-pa-sm bg-grey-2 chat-surface"
        style="border-radius: 8px; overflow-y: auto"
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
            @click="store.selectMessage(m.id)"
          />
          <q-chat-message
            :name="m.role === 'user' ? 'You' : '伙伴'"
            :text="[m.text]"
            :sent="m.role === 'user'"
            class="hanzi"
            @click="m.role === 'user' && store.selectMessage(m.id)"
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
                    >N {{ m.meta.grading.naturalness }}/5</q-chip
                  >
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >G {{ m.meta.grading.grammar }}/5</q-chip
                  >
                  <q-chip
                    dense
                    color="grey-8"
                    text-color="white"
                    class="q-mr-xs"
                    >C {{ m.meta.grading.complexity }}/5</q-chip
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

      <div class="row items-center q-gutter-sm q-mt-auto">
        <q-input
          v-model="input"
          class="col-grow"
          dense
          outlined
          placeholder="Reply in Chinese..."
          @keyup.enter="send"
        />
        <q-btn color="primary" label="Send" :disable="isBusy" @click="send" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-surface {
  position: relative;
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
