import axios from "axios";

import { useSettingsStore } from "../stores/settings";
import translationSchema from "./gpt-translation-schema.json";
import imageIdeasSchema from "./gpt-image-ideas-schema.json";
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

const TEXT_MODEL = "gpt-5-nano";
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

export async function gradeUserMessage({ message, userLevel, topic }) {
  const systemPrompt = `
    You are a supportive Chinese teacher. Evaluate the students text based on the following Rubric Criteria. The explenations for the grading should be in english. The improved sentence should be chinese.

    Rubric Criteria:
    Grammar & Syntax: The accuracy and complexity of sentence structures.
      - Level 4 (Excellent): Demonstrates a wide range of complex grammatical structures with a high degree of accuracy. Errors are rare and are often corrected immediately.
      - Level 3 (Proficient): Uses a mix of simple and complex structures with good control. Minor grammatical errors may occur but do not obscure meaning.
      - Level 2 (Developing): Uses basic grammatical structures but makes frequent errors, particularly with tenses or more complex constructions. Errors sometimes cause confusion.
      - Level 1 (Limited): Makes pervasive and consistent grammatical errors, even with basic structures, which makes the message difficult to understand.
      - Level 0 (Unacceptable): No comprehensible grammatical structures are used.

    Vocabulary: The range, precision, and appropriateness of word choice.
      - Level 4 (Excellent): Uses a broad and precise range of vocabulary, including idiomatic expressions, to express ideas effectively. Word choice is consistently appropriate for the context.
      - Level 3 (Proficient): Uses a sufficient range of vocabulary to communicate clearly. May occasionally search for a word or use a less precise one, but meaning is generally clear.
      - Level 2 (Developing): Has a limited vocabulary and often relies on simple, repeated words. May use inappropriate words or phrases that cause confusion.
      - Level 1 (Limited): Has a very limited vocabulary and cannot express ideas beyond the most basic concepts. Frequent use of paraphrasing due to lack of words.
      - Level 0 (Unacceptable): Vocabulary is insufficient to convey any meaning.
  `;

  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Student CEFR level: ${userLevel}. \n text: ${message}`,
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

export async function verifySceneGoal({ history, verification }) {
  const messages = [
    {
      role: "system",
      content:
        "You are a Chinese teacher." +
        `\nYou will now evaluate whether the user (your student) achieved the roleplay goal: ${verification}. Reply ONLY with JSON using the provided schema. If achieved, set success to true, otherwise false. Provide a brief explanation in ENGLISH in the justification field. Return only JSON.`,
    },
    ...history,
  ];

  const sceneVerificationSchema = {
    name: "scene_verification",
    schema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the user achieved the goal",
        },
        justification: {
          type: "string",
          description: "Short Chinese explanation why the goal was met or not",
        },
      },
      required: ["sucess", "justification"],
      additionalProperties: false,
    },
  };

  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: sceneVerificationSchema,
    },
  });

  if (data.choices && data.choices[0]?.message?.content) {
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("Failed parsing verification JSON", e);
    }
  }
  console.error("Data missing from openai verification response", data);
  return { sucess: false, justification: "无法判定 (解析失败)" };
}
