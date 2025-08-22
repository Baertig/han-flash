import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  // Initialize API key refs
  const openaiApiKey = ref(
    import.meta.env.DEV ? import.meta.env.VITE_OPENAI_API_KEY : ""
  );

  const openrouterApiKey = ref(
    import.meta.env.DEV ? import.meta.env.VITE_OPEN_ROUTER_API_KEY : ""
  );

  // Retrieve stored credentials in production
  if (!import.meta.env.DEV && navigator.credentials) {
    navigator.credentials
      .get({ password: true })
      .then((cred) => {
        if (cred?.password) {
          openrouterApiKey.value = cred.password;
        }
      })
      .catch((e) => {
        console.error("Error when retrieving password", e);
      });
  }

  const hasOpenAiApiKey = computed(() => !!openaiApiKey.value);
  const hasOpenRouterApiKey = computed(() => !!openrouterApiKey.value);

  // Store API keys using Credentials Management API
  async function setOpenAiApiKey(key) {
    openaiApiKey.value = key;
    // OpenAI key is stored locally only for now
  }

  async function setOpenRouterApiKey(key) {
    openrouterApiKey.value = key;

    if (!import.meta.env.DEV && navigator.credentials) {
      const cred = new PasswordCredential({
        id: "openrouter key",
        password: key,
      });
      await navigator.credentials.store(cred);
    }
  }

  return {
    openaiApiKey,
    openrouterApiKey,
    setOpenAiApiKey,
    setOpenRouterApiKey,
    hasOpenAiApiKey,
    hasOpenRouterApiKey,
  };
});
