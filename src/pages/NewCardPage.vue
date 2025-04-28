<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import translationSchema from "../service/gpt_translation_schema.json";
import { useFlashcardsStore } from "../stores/flashcards";
import { useRouter } from "vue-router";

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();
const router = useRouter();

const loading = ref(false);
const loadingAudio = ref(false);

const form = ref({
  word: "",
  pinyin: "",
  translation: "",
  exampleSentence: "",
  sentencePinyin: "",
  sentenceTranslation: "",
  sentenceBreakdown: [],
  audioUrl: "",
});

const canAutofill = computed(() => !!form.value.word.trim());
const canGenerateAudio = computed(() => !!form.value.exampleSentence.trim());

const breakdownColumns = [
  {
    name: "word",
    label: "Word",
    field: (row) => `${row.word} (${row.pinyin})`,
    align: "left",
    sortable: true,
    style: "white-space: normal;",
  },
  {
    name: "meaning",
    label: "Meaning",
    field: "meaning",
    align: "left",
    sortable: true,
    style: "white-space: normal;",
  },
  { name: "actions", label: "Actions", field: "actions", align: "center" },
];

function rowClass(row) {
  return row.visible === false ? "bg-grey-3 text-grey-8" : "";
}

function toggleBreakdownVisibility(index) {
  form.value.sentenceBreakdown[index].visible =
    !form.value.sentenceBreakdown[index].visible;
}

async function autofillWithAI() {
  if (!form.value.word) return;
  loading.value = true;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides Chinese language translations and example sentences. Respond with a JSON object following the provided schema.",
          },
          {
            role: "user",
            content: `Translate the Chinese word "${form.value.word}" and provide details.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: translationSchema,
        },
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      const result = JSON.parse(data.choices[0].message.content);
      form.value = {
        ...form.value,
        pinyin: result.pinyin,
        translation: result.translation,
        exampleSentence: result.example_sentence,
        sentencePinyin: result.example_sentence_pinyin,
        sentenceTranslation: result.example_sentence_translation,
        sentenceBreakdown: result.sentence_breakdown.components.map(
          (component) => ({
            word: component.word,
            pinyin: component.pinyin,
            meaning: component.translation,
            visible: true,
          })
        ),
      };
    }
    $q.notify({
      color: "positive",
      message: "Card info fetched successfully",
      icon: "check",
    });
  } catch (error) {
    console.error("Error fetching from OpenAI:", error);
    $q.notify({
      color: "negative",
      message: "Failed to fetch translation data",
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
}

async function generateAudio() {
  if (!form.value.exampleSentence) return;
  loadingAudio.value = true;
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: form.value.exampleSentence,
        instructions: "请说得清楚、友好，而且发音要准确。特别注意语调的准确性。",
        voice: "ash",
        response_format: "mp3",
      }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    form.value.audioUrl = url;
    $q.notify({
      color: "positive",
      message: "Audio generated successfully",
      icon: "volume_up",
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    $q.notify({
      color: "negative",
      message: "Failed to generate audio",
      icon: "error",
    });
  } finally {
    loadingAudio.value = false;
  }
}

function onSubmit() {
  if (form.value.word && form.value.translation) {
    flashcardsStore.addFlashcard({ ...form.value });
    router.push({ name: "Flashcards" });
  }
}

function onCancel() {
  router.push({ name: "Flashcards" });
}
</script>

<template>
  <div class="q-pa-md">
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">New Flashcard</div>
      </q-card-section>

      <q-card-section class="q-pt-none scroll" style="max-height: 80vh">
        <q-form @submit.prevent="onSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.word"
                label="Chinese Word/Character *"
                outlined
                class="q-mb-md"
                :rules="[(val) => !!val || 'Word is required']"
                @keyup.enter.native="autofillWithAI"
                autofocus
              >
                <template v-slot:append>
                  <q-btn
                    round
                    dense
                    flat
                    icon="auto_awesome"
                    color="primary"
                    :disable="!canAutofill"
                    :loading="loading"
                    @click="autofillWithAI"
                    title="Autofill with AI"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.pinyin"
                label="Pinyin"
                outlined
                class="q-mb-md"
                placeholder="e.g. nǐ hǎo"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="form.translation"
                label="Translation *"
                outlined
                class="q-mb-md"
                :rules="[(val) => !!val || 'Translation is required']"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.exampleSentence"
                label="Example Sentence"
                outlined
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-btn
                    round
                    dense
                    flat
                    icon="volume_up"
                    color="primary"
                    :disable="!canGenerateAudio"
                    :loading="loadingAudio"
                    @click="generateAudio"
                    title="Text-to-Speech"
                  />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.sentencePinyin"
                label="Sentence Pinyin"
                outlined
                class="q-mb-md"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.sentenceTranslation"
                label="Sentence Translation"
                outlined
                class="q-mb-md"
              />
            </div>
          </div>

          <div class="text-subtitle2 q-mb-sm">Sentence Breakdown</div>

          <q-table
            :rows="form.sentenceBreakdown"
            :columns="breakdownColumns"
            row-key="word"
            flat
            bordered
            dense
            :rows-per-page-options="[0]"
            hide-bottom
            v-if="form.sentenceBreakdown.length > 0"
            :table-row-class-fn="rowClass"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="q-gutter-xs">
                <q-btn
                  round
                  dense
                  flat
                  :icon="props.row.visible ? 'visibility' : 'visibility_off'"
                  color="primary"
                  @click="toggleBreakdownVisibility(props.rowIndex)"
                />
              </q-td>
            </template>
          </q-table>
          <div v-else class="text-grey q-mt-sm">
            No breakdown available. Use Autofill or add an example sentence
            manually.
          </div>

          <div v-if="form.audioUrl" class="q-mt-md">
            <audio controls :src="form.audioUrl" />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="onCancel" />
        <q-btn flat label="Save" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </div>
</template>
