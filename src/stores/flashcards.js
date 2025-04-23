import { defineStore } from "pinia";

export const useFlashcardsStore = defineStore("flashcards", {
  state: () => ({
    flashcards: [
      {
        id: 1,
        word: "你好",
        pinyin: "nǐ hǎo",
        translation: "Hello",
        exampleSentence: "你好，我是小明。",
        sentencePinyin: "nǐ hǎo, wǒ shì xiǎo míng.",
        sentenceTranslation: "Hello, I am Xiao Ming.",
        sentenceBreakdown: [
          { word: "你好", pinyin: "nǐ hǎo", meaning: "hello" },
          { word: "我", pinyin: "wǒ", meaning: "I" },
          { word: "是", pinyin: "shì", meaning: "am" },
          { word: "小明", pinyin: "xiǎo míng", meaning: "Xiao Ming (name)" },
        ],
        hasAudio: false,
        hasImage: false,
      },
      {
        id: 2,
        word: "谢谢",
        pinyin: "xiè xiè",
        translation: "Thank you",
        exampleSentence: "谢谢你的帮助。",
        sentencePinyin: "xiè xiè nǐ de bāng zhù.",
        sentenceTranslation: "Thank you for your help.",
        sentenceBreakdown: [
          { word: "谢谢", pinyin: "xiè xiè", meaning: "thank you" },
          { word: "你的", pinyin: "nǐ de", meaning: "your" },
          { word: "帮助", pinyin: "bāng zhù", meaning: "help" },
        ],
        hasAudio: false,
        hasImage: false,
      },
    ],
    nextId: 3,
  }),

  getters: {
    getFlashcards: (state) => state.flashcards,
    getFlashcardById: (state) => (id) =>
      state.flashcards.find((card) => card.id === id),
    totalFlashcards: (state) => state.flashcards.length,
  },

  actions: {
    addFlashcard(cardData) {
      const newCard = {
        id: this.nextId++,
        ...cardData,
        exampleSentence: "",
        sentencePinyin: "",
        sentenceTranslation: "",
        sentenceBreakdown: [],
        hasAudio: false,
        hasImage: false,
      };

      this.flashcards.push(newCard);
      return newCard;
    },

    updateFlashcard(id, updatedData) {
      const index = this.flashcards.findIndex((card) => card.id === id);
      if (index !== -1) {
        this.flashcards[index] = { ...this.flashcards[index], ...updatedData };
        return true;
      }
      return false;
    },

    deleteFlashcard(id) {
      const index = this.flashcards.findIndex((card) => card.id === id);
      if (index !== -1) {
        this.flashcards.splice(index, 1);
        return true;
      }
      return false;
    },

    enhanceFlashcard(id, enhancementData) {
      // This will be expanded later to handle API calls for example sentences,
      // text-to-speech, images, etc.
      return this.updateFlashcard(id, enhancementData);
    },
  },
});
