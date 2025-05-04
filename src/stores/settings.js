import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const key = import.meta.env.DEV
    ? import.meta.env.VITE_OPENAI_API_KEY
    : localStorage.getItem("openaiApiKey");

  const openaiApiKey = ref(key);

  const hasApiKey = computed(() => !!openaiApiKey);

  function setApiKey(key) {
    openaiApiKey.value = key;
    localStorage.setItem("openaiApiKey", key);
  }

  return { openaiApiKey, setApiKey, hasApiKey };
});
