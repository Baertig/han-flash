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
          { word: "你好", pinyin: "nǐ hǎo", meaning: "hello", visible: true },
          { word: "我", pinyin: "wǒ", meaning: "I", visible: true },
          { word: "是", pinyin: "shì", meaning: "am", visible: true },
          {
            word: "小明",
            pinyin: "xiǎo míng",
            meaning: "Xiao Ming (name)",
            visible: true,
          },
        ],
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
          {
            word: "谢谢",
            pinyin: "xiè xiè",
            meaning: "thank you",
            visible: true,
          },
          { word: "你的", pinyin: "nǐ de", meaning: "your", visible: true },
          { word: "帮助", pinyin: "bāng zhù", meaning: "help", visible: true },
        ],
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
      // Create a new flashcard with all the provided data
      const newCard = {
        id: this.nextId++,
        word: cardData.word || "",
        pinyin: cardData.pinyin || "",
        translation: cardData.translation || "",
        exampleSentence: cardData.exampleSentence || "",
        sentencePinyin: cardData.sentencePinyin || "",
        sentenceTranslation: cardData.sentenceTranslation || "",
        sentenceBreakdown: cardData.sentenceBreakdown?.length
          ? cardData.sentenceBreakdown.map((item) => ({
              word: item.word || "",
              pinyin: item.pinyin || "",
              meaning: item.meaning || "",
              visible: item.visible !== false,
            }))
          : [],
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

    exportToAnkiFormat() {
      const lines = this.flashcards.map((card) => {
        const front = card.translation || "";

        const breakdownString = card.sentenceBreakdown
          // include only visible items
          .filter((item) => item.visible !== false)
          .map(
            (item) =>
              `${item.word || ""} (${item.pinyin || ""}) - ${
                item.meaning || ""
              }`
          )
          .join("<br>");

        const back = [
          card.word || "",
          card.pinyin || "",
          "-----",
          card.exampleSentence || "",
          card.sentencePinyin || "",
          card.sentenceTranslation || "",
          "", // Empty line
          breakdownString || "",
        ].join("<br>");

        // Escape any existing semicolons in fields if necessary, though unlikely here.
        // For simplicity, we assume fields don't contain semicolons or newlines for now.
        return `${front};${back}`;
      });

      // Add header to allow HTML import in Anki
      // Although not strictly necessary if the user checks the box,
      // it's good practice if the format relies on HTML.
      // Anki doesn't have a specific header for *allowing* HTML,
      // the user enables it in the import dialog.
      // We just return the formatted lines.
      return lines.join("\n");
    },
  },
});
