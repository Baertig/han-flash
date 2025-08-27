import { defineStore } from "pinia";
import { gradeUserMessage, verifySceneGoal } from "../service/openai-client";
import {
  generateLearningChatAssistantText,
  tokenizeChineseText,
} from "../service/openrouter-client";
import { scenes } from "../service/scenes";

function isPunctuation(char) {
  return [
    "⟨",
    "⟩",
    "，",
    "！",
    "？",
    "；",
    "：",
    "（",
    "）",
    "［",
    "］",
    "【",
    "】",
    "。",
  ].includes(char);
}

async function translateAssistantMessage(text) {
  const tokens = await tokenizeChineseText(text);
  const renderTokens = [];

  for (let i = 0; i < text.length; i++) {
    const firstWord = tokens.at(0)?.word;
    const firstLength = firstWord ? firstWord.length : 1;
    const firstSupposedWortInText = text.substring(i, i + firstLength);

    const secondWord = tokens.at(1)?.word;
    const secondLength = secondWord ? secondWord.length : 1;
    const alternativeSupposedWortInText = text.substring(i, i + secondLength);

    // exclude punctuation characters from the ones that are translated
    if (isPunctuation(firstSupposedWortInText)) {
      if (firstWord == firstSupposedWortInText) {
        tokens.shift();
      } else if (firstWord && firstWord.startsWith(firstSupposedWortInText)) {
        tokens.at(0).word = firstWord.replace(firstSupposedWortInText, "");
      }

      renderTokens.push({
        word: firstSupposedWortInText,
        translation: false,
      });
    } else if (firstSupposedWortInText == firstWord) {
      console.log(
        "firstSupposedWortInText == firstWord",
        firstSupposedWortInText,
        firstWord
      );
      const firstToken = tokens.shift();
      renderTokens.push(firstToken);
      i += firstSupposedWortInText.length - 1; // - 1 because that is done by the loop anyway

      //This is a hack to allow for synchronization the translation of the LLM somtimes has double words in it.
    } else if (alternativeSupposedWortInText == secondWord) {
      console.log(
        "alternativeSupposedWortInText == secondWord",
        alternativeSupposedWortInText,
        secondWord
      );
      tokens.shift();
      const secondToken = tokens.shift();
      renderTokens.push(secondToken);
      i += alternativeSupposedWortInText.length - 1;
    } else {
      console.log(
        `firstSupposedWortInTexT (${firstSupposedWortInText}) !== firstWord (${firstWord})`
      );
      const currentChar = text[i];
      renderTokens.push({
        word: currentChar,
        translation: false,
      });
    }
  }

  return renderTokens;
}

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
          return o;
        },
        {
          grammarAndSyntax: 0,
          vocabulary: 0,
        }
      );
      const len = arr.length;
      return {
        grammarAndSyntax: (acc.grammarAndSyntax / len).toFixed(1),
        vocabulary: (acc.vocabulary / len).toFixed(1),
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
          console.error("error during grading:", e);
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

        const openParentesis = ["(", "（"];
        const closeParentesis = [")", "）"];

        const messages = text
          .split("")
          .reduce(
            (msgs, char) => {
              if (openParentesis.includes(char)) {
                return [...msgs, { type: "action", text: "" }];
              } else if (closeParentesis.includes(char)) {
                return [...msgs, { type: "speech", text: "" }];
              } else {
                msgs.at(-1).text += char;
                return msgs;
              }
            },
            [{ type: "speech", text: "" }]
          )
          .map((m) => ({
            ...m,
            text: m.text.trimStart(),
          }))
          .filter((m) => m.text.length > 0);

        const translated = await Promise.all(
          messages.map(async (m) => {
            const tokens = await translateAssistantMessage(m.text);

            return {
              text,
              meta: {
                tokens,
                type: m.type,
              },
            };
          })
        );

        const withIds = translated.map((m) => ({
          ...m,
          id: this.nextId++,
          role: "assistant",
        }));

        this.messages = this.messages.concat(withIds);
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

        this.verificationResult = result; // { success, justification }

        return result;
      } finally {
        this.summaryLoading = false;
      }
    },
  },
});
