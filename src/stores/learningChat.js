import { defineStore } from "pinia";
import {
  gradeUserMessage,
  generateLearningChatAssistantReply,
  generateConversationSummary,
} from "../service/openai-client";

export const useLearningChatStore = defineStore("learningChat", {
  state: () => ({
    level: "A1",
    topic: "日常对话",
    practiceWordsInput: "",
    started: false,

    messages: [], // { id, role: 'assistant'|'user', text, meta: { tokens?, grading?, gradingLoading? } }
    nextId: 1,

    interestingWords: [], // { word, pinyin, translation }

    assistantLoading: false,
    summaryLoading: false,
    summaryData: null,

    selectedMessageId: null,
  }),
  getters: {
    isBusy: (s) => s.assistantLoading || s.summaryLoading,

    practiceWords: (s) =>
      s.practiceWordsInput
        .split(/\s|,|;|\n/)
        .map((w) => w.trim())
        .filter(Boolean),

    gradedUserMessages: (s) =>
      s.messages.filter((m) => m.role === "user" && m.meta?.grading),

    avgScores: (s) => {
      const arr = s.messages.filter(
        (m) => m.role === "user" && m.meta?.grading
      );
      if (!arr.length) return null;
      const acc = arr.reduce(
        (o, m) => {
          o.naturalness += m.meta.grading.naturalness || 0;
          o.grammar += m.meta.grading.grammar || 0;
          o.complexity += m.meta.grading.complexity || 0;
          return o;
        },
        { naturalness: 0, grammar: 0, complexity: 0 }
      );
      const len = arr.length;
      return {
        naturalness: (acc.naturalness / len).toFixed(1),
        grammar: (acc.grammar / len).toFixed(1),
        complexity: (acc.complexity / len).toFixed(1),
      };
    },

    selectedMessage: (s) =>
      s.messages.find((m) => m.id === s.selectedMessageId) || null,
  },
  actions: {
    reset() {
      this.level = "A1";
      this.topic = "日常对话";
      this.practiceWordsInput = "";
      this.started = false;
      this.messages = [];
      this.nextId = 1;
      this.interestingWords = [];
      this.assistantLoading = false;
      this.summaryLoading = false;
      this.summaryData = null;
      this.selectedMessageId = null;
    },

    setLevel(val) {
      this.level = val;
    },

    setTopic(val) {
      this.topic = val;
    },

    setPracticeWordsInput(val) {
      this.practiceWordsInput = val;
    },

    selectMessage(id) {
      this.selectedMessageId = id;
    },

    toggleInteresting(token) {
      const idx = this.interestingWords.findIndex((w) => w.word === token.word);
      if (idx >= 0) this.interestingWords.splice(idx, 1);
      else this.interestingWords.push(token);
    },

    async startConversation() {
      this.started = true;
      try {
        this.assistantLoading = true;
        const history = [
          {
            role: "user",
            content: `请用纯中文开始一段对话。主题: ${
              this.topic
            }。适应学生水平: ${
              this.level
            }。尽量使用以下词汇（如果合适）: ${this.practiceWords.join(
              ", "
            )}。`,
          },
        ];
        const reply = await generateLearningChatAssistantReply({
          userLevel: this.level,
          history,
        });
        const msg = {
          id: this.nextId++,
          role: "assistant",
          text: reply.tokens.map((t) => t.word).join(""),
          meta: {
            tokens: reply.tokens,
            suggested: reply.suggested_followup_question,
          },
        };
        this.messages.push(msg);
      } finally {
        this.assistantLoading = false;
      }
    },

    async sendMessage(content) {
      const text = content.trim();
      if (!text) return;

      const userMsg = {
        id: this.nextId++,
        role: "user",
        text,
        meta: { gradingLoading: true },
      };
      this.messages.push(userMsg);

      // grading background
      (async () => {
        try {
          const grading = await gradeUserMessage({
            message: text,
            userLevel: this.level,
            topic: this.topic,
          });
          // find and update in place
          const msg = this.messages.find((m) => m.id === userMsg.id);
          if (msg) {
            msg.meta.grading = grading;
            // auto-select the latest graded message
            this.selectedMessageId = userMsg.id;
          }
        } catch (e) {
          /* ignore */
        } finally {
          const msg = this.messages.find((m) => m.id === userMsg.id);
          if (msg) msg.meta.gradingLoading = false;
        }
      })();

      // assistant reply
      try {
        this.assistantLoading = true;
        const history = this.messages.map((m) => ({
          role: m.role,
          content: m.text,
        }));
        const reply = await generateLearningChatAssistantReply({
          userLevel: this.level,
          history,
        });
        const assMsg = {
          id: this.nextId++,
          role: "assistant",
          text: reply.tokens.map((t) => t.word).join(""),
          meta: {
            tokens: reply.tokens,
            suggested: reply.suggested_followup_question,
          },
        };
        this.messages.push(assMsg);
      } finally {
        this.assistantLoading = false;
      }
    },

    async endConversation() {
      try {
        this.summaryLoading = true;
        const summary = await generateConversationSummary({
          history: this.messages,
          userLevel: this.level,
        });
        this.summaryData = summary;
      } finally {
        this.summaryLoading = false;
      }
    },
  },
});
