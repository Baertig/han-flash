import axios from "axios";

import { useSettingsStore } from "../stores/settings";
import translationSchema from "./gpt-translation-schema.json";
import imageIdeasSchema from "./gpt-image-ideas-schema.json";
import chatReplySchema from "./gpt-chat-reply-schema.json";
import gradingSchema from "./gpt-grading-schema.json";
import summarySchema from "./gpt-conversation-summary-schema.json";

export const openAiClient = axios.create({
  baseURL: "https://api.openai.com/v1/",
});

// Automatically inject OpenAI API key into headers
openAiClient.interceptors.request.use((config) => {
  //destructuring will give me the value immeditaly
  const { openaiApiKey } = useSettingsStore();

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing");
  }

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${openaiApiKey}`,
  };
  return config;
});

const TEXT_MODEL = "gpt-4o";
const AUDIO_MODEL = "gpt-4o-mini-tts";
const IMAGE_MODEL = "gpt-image-1";

export async function generateEnglishToChineseCardTextConent(chineseWord) {
  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that provides Chinese language translations and example sentences. Respond with a JSON object following the provided schema.",
      },
      {
        role: "user",
        content: `Translate the Chinese word "${chineseWord}" and provide details.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: translationSchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    const result = JSON.parse(data.choices[0].message.content);

    return result;
  }

  console.error("Data missing from openai response", data);
  return {};
}

export async function generateChineseAudio(text) {
  const { data } = await openAiClient.post(
    "/audio/speech",
    {
      model: AUDIO_MODEL,
      input: text,
      instructions: "请说得清楚、友好，而且发音要准确。特别注意语调的准确性。",
      voice: "ash",
      response_format: "mp3",
    },
    { responseType: "blob" }
  );

  const blob = new Blob([data], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);

  return url;
}

export async function generateImage(prompt) {
  const { data } = await openAiClient.post("/images/generations", {
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: "1024x1024",
    output_format: "jpeg",
  });

  const b64 = data.data[0].b64_json;
  const binary = atob(b64);

  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([array], { type: "image/png" });
  const url = URL.createObjectURL(blob);

  return url;
}

// New function to generate image ideas using chat completions with JSON schema
export async function generateImageIdeas(word) {
  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that generates image ideas to help remember a Chinese word. Respond with a JSON object following the provided schema.",
      },
      {
        role: "user",
        content: `Generate image descriptions that will help remember the Chinese word "${word}". I want to include these images in my flashcards so that they provide a visual clue when learning.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: imageIdeasSchema,
    },
  });
  const result = JSON.parse(data.choices[0].message.content);
  return result.ideas;
}

export async function generateLearningChatAssistantReply({ systemPrompt, history }) {
  const messages = [
    {
      role: "system",
      content:
        systemPrompt ||
        "You are a helpful Chinese conversation partner. Always reply in Chinese appropriate to the user's CEFR level. Try to teach the user something about the topic he chose. Split your reply into tokens using the provided JSON schema so the UI can show per-word pinyin and translation.",
    },
    ...history,
  ];

  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: chatReplySchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    return JSON.parse(data.choices[0].message.content);
  }

  console.error("Data missing from openai response", data);
  return { tokens: [] };
}

export async function gradeUserMessage({ message, userLevel, topic }) {
  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a strict but supportive Chinese teacher. Evaluate a single student sentence and return scores 1-5 for naturalness, grammar, and complexity (relative to the student's level). Provide helpful explanations and an improved sentence.",
      },
      {
        role: "user",
        content: `Student CEFR level: ${userLevel}. Topic: ${topic}.\nSentence: ${message}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: gradingSchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    return JSON.parse(data.choices[0].message.content);
  }

  console.error("Data missing from openai response", data);
  return null;
}

export async function generateConversationSummary({ history, userLevel }) {
  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Summarize the conversation for a Chinese learner at the given level. Keep it short and readable.",
      },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ],
    response_format: {
      type: "json_schema",
      json_schema: summarySchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    return JSON.parse(data.choices[0].message.content);
  }
  return null;
}
