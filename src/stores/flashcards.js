import { defineStore } from "pinia";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import axios from "axios";

export const TYPE = Object.freeze({
  ACTIVE: "ACTIVE", //L1 to L2
  PASSIVE: "PASSIVE", //L2 to L1
});

function normalizePinyin(pinyin) {
  // 1. Normalize to NFD form to decompose characters and diacritics
  // 2. Remove everything except letters, numbers, and whitespace
  // 3. Replace whitespace sequences with single underscores
  return pinyin
    ?.normalize("NFD")
    .replace(/[^A-Za-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}

function generateAudioFilename(card) {
  const base = normalizePinyin(card.sentencePinyin) || `audio_${card.id}`;

  return `${base}.mp3`;
}

function generateImageFilename(card) {
  const base = normalizePinyin(card.pinyin) || `image_${card.id}`;

  return `${base}.jpg`;
}

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
        audioUrl: "/han-flash/ni_hao_wo_shi_xiao_ming.mp3",
        imageUrl: "/han-flash/ni_hao.jpg",
        type: TYPE.ACTIVE,
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
        audioUrl: "/han-flash/xie_xie_ni_de_bang_zhu.mp3",
        imageUrl: "/han-flash/xie_xie.jpg",
        type: TYPE.PASSIVE,
      },
    ],
    nextId: 3,
  }),

  getters: {
    getFlashcards: (state) => state.flashcards,

    getFlashcardById: (state) => (id) =>
      state.flashcards.find((card) => card.id === id),

    totalFlashcards: (state) => state.flashcards.length,

    isMediaAvailable: (state) =>
      state.flashcards.some((card) => card.audioUrl || card.imageUrl),
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
              visible: !!item.visible, //undefined will result in invisible
            }))
          : [],
        audioUrl: cardData.audioUrl || "",
        imageUrl: cardData.imageUrl || "",
        type: cardData.type || TYPE.PASSIVE,
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
        const imageTag = card.imageUrl
          ? `<img src="${generateImageFilename(card)}"><br>`
          : "";

        const audioTag = card.audioUrl
          ? `[sound:${generateAudioFilename(card)}]`
          : "";

        const breakdownString = card.sentenceBreakdown
          // include only visible items
          .filter((item) => item.visible !== false)
          .map((item) => `${item.word} (${item.pinyin}) - ${item.meaning}`)
          .join("<br>");

        // Create audio tag if audio exists

        if (card.type === TYPE.ACTIVE) {
          const front = `${imageTag}${card.translation || ""}`;

          const back = [
            card.word,
            card.pinyin,
            "-----",
            `${card.exampleSentence} ${audioTag}`,
            card.sentencePinyin,
            card.sentenceTranslation,
            "", // Empty line
            breakdownString,
          ].join("<br>");

          return `${front};${back}`;
        } else if (card.type === TYPE.PASSIVE) {
          const sentence = card.exampleSentence.replace(
            card.word,
            `<span style="font-size: 30px">${card.word}</span>`
          );
          const front = `${imageTag}${sentence}`;

          const back = [
            `${card.sentencePinyin.replace(
              card.pinyin,
              `<strong>${card.pinyin}</strong>`
            )} ${audioTag}`,
            card.sentenceTranslation,
            "", // Empty line
            `${card.word} (${card.pinyin})- ${card.translation}`,
            breakdownString,
          ].join("<br>");

          return `${front};${back}`;
        } else {
          console.error(`type of card ${card.id}: ${card.type} not supported`);
        }
      });

      return lines.join("\n");
    },

    // New action to create and trigger download using saveAs
    downloadAnkiFile() {
      const ankiText = this.exportToAnkiFormat();
      if (!ankiText) {
        return false;
      }
      const blob = new Blob([ankiText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, "anki_export.txt");
      return true;
    },

    // New action to download all audio media as a ZIP
    async downloadMedia() {
      // Only process flashcards that have an audioUrl
      const cardsWithAudio = this.flashcards.filter((card) => card.audioUrl);

      if (!cardsWithAudio.length) {
        return false;
      }

      const zip = new JSZip();
      for (const card of cardsWithAudio) {
        try {
          const { data } = await axios.get(card.audioUrl, {
            responseType: "arraybuffer",
          });

          const filename = generateAudioFilename(card);
          zip.file(filename, data);
        } catch (e) {
          console.error("Error fetching audio for card", card.id, e);
        }
      }

      // Also include images in the zip
      const cardsWithImages = this.flashcards.filter((card) => card.imageUrl);
      for (const card of cardsWithImages) {
        try {
          const { data } = await axios.get(card.imageUrl, {
            responseType: "arraybuffer",
          });

          const filename = generateImageFilename(card);
          zip.file(filename, data);
        } catch (e) {
          console.error("Error fetching image for card", card.id, e);
        }
      }

      try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "flashcards_media.zip");

        return true;
      } catch (e) {
        console.error("Error creating zip", e);
        return false;
      }
    },
  },
});
