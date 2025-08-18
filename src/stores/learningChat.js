import { defineStore } from "pinia";
import {
  gradeUserMessage,
  generateLearningChatAssistantText,
  tokenizeChineseText,
  verifySceneGoal,
} from "../service/openai-client";
import { scenes } from "../service/scenes";

export const useLearningChatStore = defineStore("learningChat", {
  state: () => ({
    level: "A1",
    topic: "日常对话",
    practiceWordsInput: "",

    messages: [], // { id, role: 'assistant'|'user', text, meta: { tokens?, grading?, gradingLoading? } }
    nextId: 1,

    interestingWords: [], // { word, pinyin, translation }

    assistantLoading: false,
    summaryLoading: false,
    summaryData: null,

    selectedMessageId: null,
    currentScene: null,
    verificationResult: null,
    sceneCompleted: false,
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
          o.grammarAndSyntax += m.meta.grading.grammarAndSyntax || 0;
          o.vocabulary += m.meta.grading.vocabulary || 0;
          o.interactiveCommunication +=
            m.meta.grading.interactiveCommunication || 0;
          o.contentAndTaskFulfillment +=
            m.meta.grading.contentAndTaskFulfillment || 0;
          return o;
        },
        {
          grammarAndSyntax: 0,
          vocabulary: 0,
          interactiveCommunication: 0,
          contentAndTaskFulfillment: 0,
        }
      );
      const len = arr.length;
      return {
        grammarAndSyntax: (acc.grammarAndSyntax / len).toFixed(1),
        vocabulary: (acc.vocabulary / len).toFixed(1),
        interactiveCommunication: (acc.interactiveCommunication / len).toFixed(
          1
        ),
        contentAndTaskFulfillment: (
          acc.contentAndTaskFulfillment / len
        ).toFixed(1),
      };
    },

    selectedMessage: (s) =>
      s.messages.find((m) => m.id === s.selectedMessageId) || null,

    systemPrompt: (s) => s.currentScene?.systemPrompt || null,
  },
  actions: {
    reset() {
      this.level = "A1";
      this.topic = "日常对话";
      this.practiceWordsInput = "";
      this.messages = [];
      this.nextId = 1;
      this.interestingWords = [];
      this.assistantLoading = false;
      this.summaryLoading = false;
      this.summaryData = null;
      this.selectedMessageId = null;
      this.currentScene = null;
      this.verificationResult = null;
      this.sceneCompleted = false;
    },

    loadScene(sceneName) {
      const scn = scenes.find((s) => s.name === sceneName);
      this.currentScene = scn;
      if (scn?.title) this.topic = scn.title; // show title as topic / header
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

        // First, generate the plain text response
        const text = await generateLearningChatAssistantText({
          userLevel: this.level,
          history,
          systemPrompt: this.systemPrompt,
        });

        // Then tokenize the response
        const tokens = await tokenizeChineseText(text);

        const assMsg = {
          id: this.nextId++,
          role: "assistant",
          text,
          meta: {
            tokens: tokens,
          },
        };
        this.messages.push(assMsg);
      } finally {
        this.assistantLoading = false;
      }
    },

    async endConversation() {
      if (!this.currentScene) return;

      if (this.verificationResult) {
        return this.verificationResult;
      }

      try {
        this.summaryLoading = true;
        const history = this.messages.map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const result = await verifySceneGoal({
          history,
          verification: this.currentScene.verification,
        });

        this.verificationResult = result; // { sucess, justification }

        if (result && result.sucess) {
          this.sceneCompleted = true;
        }

        return result;
      } finally {
        this.summaryLoading = false;
      }
    },
  },
});
