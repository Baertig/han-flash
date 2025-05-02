import axios from "axios";
import translationSchema from "./gpt-translation-schema.json";
import imageIdeasSchema from "./gpt-image-ideas-schema.json";

export const openAiClient = axios.create({
  baseURL: "https://api.openai.com/v1/",
  headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
});

const TEXT_MODEL = "gpt-4o";
const AUDIO_MODEL = "gpt-4o-mini-tts";
const IMAGE_MODEL = "dall-e-3";

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

// New function to generate an image using the OpenAI Image API
export async function generateImage(prompt) {
  const { data } = await openAiClient.post("/images/generations", {
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  return data.data[0].url;
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
