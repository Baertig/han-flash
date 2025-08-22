import axios from "axios";

import { useSettingsStore } from "../stores/settings";
import tokenizationSchema from "./gpt-tokenization-schema.json";

export const openRouterClient = axios.create({
  baseURL: "https://openrouter.ai/api/v1/",
});

openRouterClient.interceptors.request.use((config) => {
  //destructuring will give me the value immediately
  const { openrouterApiKey } = useSettingsStore();

  if (!openrouterApiKey) {
    throw new Error("OpenRouter API key is missing");
  }

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${openrouterApiKey}`,
  };
  return config;
});

const TEXT_MODEL = "deepseek/deepseek-chat-v3-0324";
const TOKENIZATION_MODEL = "google/gemini-2.0-flash-001";

export async function generateLearningChatAssistantText({
  systemPrompt,
  history,
  userLevel,
}) {
  const messages = [
    {
      role: "system",
      content:
        systemPrompt ||
        `You are a helpful Chinese conversation partner. Always reply in Chinese appropriate to the user's ${userLevel} CEFR level. Try to teach the user something about the topic he chose. Respond with natural Chinese text only.`,
    },
    ...history,
  ];

  const { data } = await openRouterClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages,
  });

  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  console.error("Data missing from openrouter response", data);
  return "";
}

export async function tokenizeChineseText(text) {
  const { data } = await openRouterClient.post("/chat/completions", {
    model: TOKENIZATION_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a Chinese language translation assistant. Split the given Chinese text into individual words and provide pinyin and English translation for each word. Preserve the exact order",
      },
      {
        role: "user",
        content: `Please translate this Chinese text and provide pinyin and translation for each word: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: tokenizationSchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    const result = JSON.parse(data.choices[0].message.content);
    return result.tokens;
  }

  console.error("Data missing from openrouter tokenization response", data);
  return [];
}
