import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  // Initialize API key ref
  const openaiApiKey = ref(
    import.meta.env.DEV ? import.meta.env.VITE_OPENAI_API_KEY : ""
  );

  // Retrieve stored credential in production
  if (!import.meta.env.DEV && navigator.credentials) {
    navigator.credentials
      .get({ password: true })
      .then((cred) => {
        if (cred?.password) {
          openaiApiKey.value = cred.password;
        }
      })
      .catch((e) => {
        console.error("Error when retrieving password", e);
      });
  }

  const hasApiKey = computed(() => !!openaiApiKey.value);

  // Store API key using Credentials Management API
  async function setApiKey(key) {
    openaiApiKey.value = key;

    if (!import.meta.env.DEV && navigator.credentials) {
      const cred = new PasswordCredential({ id: "open ai key", password: key });
      await navigator.credentials.store(cred);
    }
  }

  return { openaiApiKey, setApiKey, hasApiKey };
});
