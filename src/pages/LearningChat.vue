<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import {
  gradeUserMessage,
  generateLearningChatAssistantReply,
  generateConversationSummary,
} from "../service/openai-client";

const $q = useQuasar();

// Form state
const level = ref("A1");
const topic = ref("日常对话");
const practiceWordsInput = ref("");
const started = ref(false);

// Chat state
const messages = ref([]); // { role: 'assistant'|'user', text: string, meta?: { tokens?, grading?, gradingLoading? } }
const input = ref("");
const interestingWords = ref([]); // { word, pinyin, translation }

// Summary & loading state
const showSummary = ref(false);
const summaryData = ref(null);
const assistantLoading = ref(false);
const summaryLoading = ref(false);
const isBusy = computed(() => assistantLoading.value || summaryLoading.value);

const practiceWords = computed(() =>
  practiceWordsInput.value
    .split(/\s|,|;|\n/)
    .map((w) => w.trim())
    .filter(Boolean)
);

const gradedUserMessages = computed(() =>
  messages.value.filter((m) => m.role === "user" && m.meta?.grading)
);
const avgScores = computed(() => {
  if (!gradedUserMessages.value.length) return null;
  const acc = gradedUserMessages.value.reduce(
    (o, m) => {
      o.naturalness += m.meta.grading.naturalness || 0;
      o.grammar += m.meta.grading.grammar || 0;
      o.complexity += m.meta.grading.complexity || 0;
      return o;
    },
    { naturalness: 0, grammar: 0, complexity: 0 }
  );
  const len = gradedUserMessages.value.length;
  return {
    naturalness: (acc.naturalness / len).toFixed(1),
    grammar: (acc.grammar / len).toFixed(1),
    complexity: (acc.complexity / len).toFixed(1),
  };
});

function reset() {
  started.value = false;
  messages.value = [];
  input.value = "";
  interestingWords.value = [];
  summaryData.value = null;
  showSummary.value = false;
}

async function startConversation() {
  started.value = true;
  try {
    assistantLoading.value = true;
    const history = [
      {
        role: "user",
        content: `请用纯中文开始一段对话。主题: ${topic.value}。适应学生水平: ${
          level.value
        }。尽量使用以下词汇（如果合适）: ${practiceWords.value.join(", ")}。`,
      },
    ];
    const reply = await generateLearningChatAssistantReply({
      userLevel: level.value,
      history,
    });

    messages.value.push({
      role: "assistant",
      text: reply.tokens.map((t) => t.word).join(""),
      meta: {
        tokens: reply.tokens,
        suggested: reply.suggested_followup_question,
      },
    });
  } catch (err) {
    $q.notify({ type: "negative", message: "Failed to start conversation" });
  } finally {
    assistantLoading.value = false;
  }
}

async function send() {
  const content = input.value.trim();
  if (!content) return;
  const myMsg = { role: "user", text: content, meta: { gradingLoading: true } };
  messages.value.push(myMsg);
  input.value = "";

  // Trigger grading in background (do not block assistant reply)
  (async () => {
    try {
      const grading = await gradeUserMessage({
        message: content,
        userLevel: level.value,
        topic: topic.value,
      });
      myMsg.meta.grading = grading;
    } catch (e) {
      console.error("error grading user message", e);
      $q.notify({ type: "negative", message: "Grading failed" });
    } finally {
      myMsg.meta.gradingLoading = false;
    }
  })();

  // Ask assistant to respond, provide prior history
  try {
    assistantLoading.value = true;
    const history = messages.value.map((m) => ({
      role: m.role,
      content: m.text,
    }));
    const reply = await generateLearningChatAssistantReply({
      userLevel: level.value,
      history,
    });
    messages.value.push({
      role: "assistant",
      text: reply.tokens.map((t) => t.word).join(""),
      meta: {
        tokens: reply.tokens,
        suggested: reply.suggested_followup_question,
      },
    });
  } catch (e) {
    $q.notify({ type: "negative", message: "Assistant failed to reply" });
  } finally {
    assistantLoading.value = false;
  }
}

function toggleInteresting(token) {
  const idx = interestingWords.value.findIndex((w) => w.word === token.word);
  if (idx >= 0) {
    interestingWords.value.splice(idx, 1);
  } else {
    interestingWords.value.push(token);
  }
}

async function endConversation() {
  try {
    summaryLoading.value = true;
    const summary = await generateConversationSummary({
      history: messages.value,
      userLevel: level.value,
    });
    summaryData.value = summary;
  } catch (e) {
    summaryData.value = null;
  } finally {
    summaryLoading.value = false;
    showSummary.value = true;
  }
}
</script>

<template>
  <div class="q-pa-md">
    <div class="app-container relative-position">
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
          <q-btn
            color="primary"
            label="Start"
            :disable="isBusy"
            @click="startConversation"
          />
        </div>
      </div>

      <div v-else class="q-gutter-md">
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
            @click="endConversation"
          />
        </div>

        <div
          class="q-pa-sm bg-grey-2 chat-surface"
          style="border-radius: 8px; max-height: 55vh; overflow-y: auto"
        >
          <q-chat-message
            v-for="(m, i) in messages"
            :key="i"
            :name="m.role === 'user' ? 'You' : '伙伴'"
            :text="[m.text]"
            :sent="m.role === 'user'"
          >
            <template v-if="m.role === 'assistant' && m.meta?.tokens" #default>
              <div class="tokens-container">
                <span
                  v-for="(t, idx) in m.meta.tokens"
                  :key="idx"
                  class="token hanzi"
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
                      <q-card-section class="q-pt-sm">
                        {{ t.translation }}
                      </q-card-section>
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
                          @click.stop="toggleInteresting(t)"
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
                  <q-btn
                    dense
                    flat
                    round
                    icon="info"
                    @click="
                      $q.dialog({
                        title: 'Feedback',
                        message: `<div>
                          <div class='text-subtitle2 q-mb-xs'>Scores</div>
                          <ul style='margin: 0 0 8px 18px; padding: 0;'>
                            <li>自然度 (Naturalness): <b>${
                              m.meta.grading.naturalness
                            }/5</b></li>
                            <li>语法 (Grammar): <b>${
                              m.meta.grading.grammar
                            }/5</b></li>
                            <li>复杂度 (Complexity): <b>${
                              m.meta.grading.complexity
                            }/5</b></li>
                          </ul>
                          <div class='text-subtitle2 q-mt-sm q-mb-xs'>Explanations</div>
                          <div><b>自然度:</b> ${
                            m.meta.grading.explanations.naturalness
                          }</div>
                          <div><b>语法:</b> ${
                            m.meta.grading.explanations.grammar
                          }</div>
                          <div><b>复杂度:</b> ${
                            m.meta.grading.explanations.complexity
                          }</div>
                          <div class='text-subtitle2 q-mt-sm q-mb-xs'>Improved sentence</div>
                          <blockquote style='margin: 4px 0 0 0;'>${
                            m.meta.grading.suggested_improved_sentence || ''
                          }</blockquote>
                        </div>`,
                        html: true,
                      })
                    "
                  />
                </template>
              </div>
            </template>
          </q-chat-message>

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
                  @click="interestingWords.splice(idx, 1)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </div>

      <q-dialog v-model="showSummary" persistent>
        <q-card style="min-width: 380px; max-width: 90vw">
          <q-card-section class="text-h6">Conversation Summary</q-card-section>
          <q-separator />
          <q-card-section>
            <div v-if="avgScores" class="q-mb-sm">
              <div class="text-subtitle2 q-mb-xs">Average scores</div>
              <div class="row q-col-gutter-sm">
                <div class="col">
                  Naturalness: <b>{{ avgScores.naturalness }}</b>
                </div>
                <div class="col">
                  Grammar: <b>{{ avgScores.grammar }}</b>
                </div>
                <div class="col">
                  Complexity: <b>{{ avgScores.complexity }}</b>
                </div>
              </div>
            </div>
            <div v-if="summaryData">
              <div class="text-subtitle2 q-mt-sm">总结 (ZH)</div>
              <div class="q-mb-sm">{{ summaryData.summary_zh }}</div>
              <div v-if="summaryData.summary_en" class="text-subtitle2 q-mt-sm">
                Summary (EN)
              </div>
              <div v-if="summaryData.summary_en" class="q-mb-sm">
                {{ summaryData.summary_en }}
              </div>
            </div>
            <div v-if="interestingWords.length" class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Interesting words</div>
              <q-list bordered>
                <q-item v-for="(w, idx) in interestingWords" :key="idx">
                  <q-item-section>
                    <q-item-label>{{ w.word }} · {{ w.pinyin }}</q-item-label>
                    <q-item-label caption>{{ w.translation }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" @click="reset" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
}
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
  background-color: rgba(0, 0, 0, 0.08); /* subtle hover highlight */
}
.cursor-pointer {
  cursor: pointer;
}
</style>
