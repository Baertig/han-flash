import axios from "axios";

import { useSettingsStore } from "../stores/settings";
import translationSchema from "./gpt-translation-schema.json";
import imageIdeasSchema from "./gpt-image-ideas-schema.json";
import tokenizationSchema from "./gpt-tokenization-schema.json";
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

  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
    messages,
  });

  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  console.error("Data missing from openai response", data);
  return "";
}

export async function tokenizeChineseText(text) {
  const { data } = await openAiClient.post("/chat/completions", {
    model: TEXT_MODEL,
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

  console.error("Data missing from openai tokenization response", data);
  return [];
}

export async function gradeUserMessage({ message, userLevel, topic }) {
  const systemPrompt = `
    You are a supportive Chinese teacher. Evaluate the students text based on the following Rubric Criteria. The feedback directed at the student should be in english.

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

    Interactive Communication: The ability to engage in a dialogue, respond, and manage the conversation.
      - Level 4 (Excellent): Initiates and responds to turns in the dialogue with ease. Asks for and gives clarification naturally and effectively. Effortlessly manages the conversation flow.
      - Level 3 (Proficient): Participates effectively in the dialogue. Is able to initiate, respond, and take turns appropriately. May occasionally need help or time to formulate a response.
      - Level 2 (Developing): Can respond to direct questions but has difficulty initiating conversation or elaborating. Requires prompts or rephrasing from the other speaker to maintain the dialogue.
      - Level 1 (Limited): Responds with single words or short phrases. Is unable to initiate or sustain the conversation. Communication often breaks down.
      - Level 0 (Unacceptable): Does not respond or engage in any way.

    Content & Task Fulfillment: How well the student addresses the topic or prompt.
      - Level 4 (Excellent): The content is highly relevant, detailed, and well-developed. The student fully addresses all aspects of the task and provides thoughtful and insightful contributions.
      - Level 3 (Proficient): The content is relevant to the topic and the student addresses the task sufficiently. Ideas are clear but may lack some depth or elaboration.
      - Level 2 (Developing): The content is somewhat relevant, but the student may stray off-topic or fail to address all aspects of the task. Ideas are basic and lack detail.
      - Level 1 (Limited): The content is often irrelevant or disconnected from the topic. The student shows little understanding of the task requirements.
      - Level 0 (Unacceptable): The student's contribution has no relevance to the task or topic.
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

export async function verifySceneGoal({ history, verification }) {
  const messages = [
    {
      role: "system",
      content:
        "You are a Chinese roleplay assistant." +
        "\nYou will now evaluate whether the user achieved the scene goal. Reply ONLY with JSON using the provided schema.",
    },
    ...history,
    {
      role: "user",
      content: `场景目标: ${verification}\n请判断用户是否完成该目标。如果完成, sucess 设为 true, 否则 false。用简短中文解释理由到 justification。只返回 JSON。`,
    },
  ];

  const sceneVerificationSchema = {
    name: "scene_verification",
    schema: {
      type: "object",
      properties: {
        sucess: {
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
