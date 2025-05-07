<script setup>
import { ref, computed, onMounted, defineProps, nextTick } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

import { useFlashcardsStore, TYPE } from "../stores/flashcards";
import {
  generateChineseAudio,
  generateEnglishToChineseCardTextConent,
  generateImage as generateImageClient,
  generateImageIdeas,
} from "../service/openai-client";
import { onKeyStroke } from "@vueuse/core";

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();
const router = useRouter();

const props = defineProps({ id: { type: [String, Number], default: null } });
const editMode = computed(() => props.id != null);

const loadingAutoFill = ref(false);
const loadingAudio = ref(false);
const loadingIdeas = ref(false);
const loadingImageGeneration = ref({}); //idx : loading

const tableButton0 = ref(null);

const form = ref({
  word: "",
  pinyin: "",
  translation: "",
  exampleSentence: "",
  sentencePinyin: "",
  sentenceTranslation: "",
  sentenceBreakdown: [],
  audioUrl: "",
  imageUrl: "",
  type: TYPE.PASSIVE,
});

const imagePrompts = ref([""]);
const imageResults = ref([]);

const canAutofill = computed(() => !!form.value.word.trim());
const canGenerateAudio = computed(() => !!form.value.exampleSentence.trim());
const canGenerateImageIdeas = computed(() => !!form.value.word.trim());

const carouselItems = computed(() =>
  imageResults.value
    .map((url, index) => ({ url, prompt: imagePrompts.value[index] }))
    .filter((item) => item.url)
);

const carouselModel = ref(0);

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
  loadingAutoFill.value = true;
  try {
    const result = await generateEnglishToChineseCardTextConent(
      form.value.word
    );

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
          visible: false,
        })
      ),
    };

    nextTick(() => tableButton0.value.$el.focus());
    generateAudio();
  } catch (error) {
    console.error("Error fetching from OpenAI:", error);

    $q.notify({
      color: "negative",
      message: "Failed to fetch translation data",
      icon: "error",
    });
  } finally {
    loadingAutoFill.value = false;
  }
}

async function generateAudio() {
  if (!form.value.exampleSentence) return;
  loadingAudio.value = true;
  try {
    form.value.audioUrl = await generateChineseAudio(
      form.value.exampleSentence
    );
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

async function generateImage(prompt, index) {
  if (!prompt) return;
  loadingImageGeneration.value = {
    ...loadingImageGeneration.value,
    [index]: true,
  };

  try {
    const url = await generateImageClient(prompt);
    imageResults.value[index] = url;
  } catch (error) {
    console.error("Error generating image:", error);
    $q.notify({
      color: "negative",
      message: "Failed to generate image",
      icon: "error",
    });
  } finally {
    loadingImageGeneration.value = {
      ...loadingImageGeneration.value,
      [index]: false,
    };
  }
}

async function generateIdeasWithAI() {
  if (!form.value.word) return;
  loadingIdeas.value = true;
  try {
    const ideas = await generateImageIdeas(form.value.word);

    imagePrompts.value = imagePrompts.value.concat(ideas);
    imageResults.value = Array(ideas.length).fill(null);
  } catch (err) {
    console.error("Error generating image ideas:", err);
    $q.notify({
      color: "negative",
      message: "Failed to generate image ideas",
      icon: "error",
    });
  } finally {
    loadingIdeas.value = false;
  }
}

onMounted(() => {
  if (!editMode.value) {
    return;
  }

  const idNum = typeof props.id === "string" ? parseInt(props.id) : props.id;
  const card = flashcardsStore.getFlashcardById(idNum);

  if (!card) {
    $q.notify({
      color: "warning",
      message: `No card with id "${id}" found`,
      icon: "error",
    });

    router.push({ name: "NewCard" });
    return;
  }

  form.value = {
    word: card.word,
    pinyin: card.pinyin,
    translation: card.translation,
    exampleSentence: card.exampleSentence,
    sentencePinyin: card.sentencePinyin,
    sentenceTranslation: card.sentenceTranslation,
    sentenceBreakdown: card.sentenceBreakdown.map((item) => ({ ...item })),
    audioUrl: card.audioUrl,
    imageUrl: card.imageUrl,
  };

  imageResults.value = card.imageUrl ? [card.imageUrl] : [];
});

function onSubmit() {
  if (form.value.word && form.value.translation) {
    if (editMode.value) {
      const idNum =
        typeof props.id === "string" ? parseInt(props.id) : props.id;
      flashcardsStore.updateFlashcard(idNum, { ...form.value });
    } else {
      flashcardsStore.addFlashcard({ ...form.value });
    }
    router.push({ name: "Flashcards" });
  }
}

function onCancel() {
  router.push({ name: "Flashcards" });
}

onKeyStroke("Escape", (e) => {
  e.preventDefault();
  onCancel();
});

onKeyStroke("s", (e) => {
  if (!e.ctrlKey) {
    return;
  }
  e.preventDefault();

  onSubmit();
});
</script>

<template>
  <div class="q-pa-md">
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ editMode ? "Edit Flashcard" : "New Flashcard" }}
        </div>
        <q-checkbox
          v-model="form.type"
          checked-icon="translate"
          unchecked-icon="auto_stories"
          :true-value="TYPE.ACTIVE"
          :false-value="TYPE.PASSIVE"
          keep-color
          color="secondary"
          :label="form.type === TYPE.ACTIVE ? 'active' : 'passive'"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
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
                  :loading="loadingAutoFill"
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
                :ref="`tableButton${props.rowIndex}`"
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
      </q-card-section>

      <q-card-section>
        <!-- Image Generation Section -->
        <div class="text-subtitle2 q-mt-md">Image Generation</div>

        <div
          v-for="(prompt, index) in imagePrompts"
          :key="index"
          class="row q-col-gutter-md q-mb-sm"
        >
          <div class="col-10">
            <q-input
              v-model="imagePrompts[index]"
              label="Image Prompt"
              autogrow
              outlined
            />
          </div>

          <div class="col-2 flex items-center">
            <q-btn
              flat
              icon="image"
              color="primary"
              @click="generateImage(imagePrompts[index], index)"
              :loading="loadingImageGeneration[index]"
              title="Generate image"
            />
          </div>
        </div>

        <q-btn
          flat
          label="Generate Ideas with AI"
          :disable="!canGenerateImageIdeas"
          :loading="loadingIdeas"
          @click="generateIdeasWithAI"
        />

        <div v-if="carouselItems.length" class="q-mt-md">
          <div class="text-subtitle2">Image Preview</div>
          <q-carousel v-model="carouselModel" animated height="480px">
            <q-carousel-slide
              v-for="(item, idx) in carouselItems"
              :key="idx"
              :name="idx"
            >
              <div class="row justify-between" style="gap: 16px">
                <q-img
                  class="col-auto"
                  height="400px"
                  width="400px"
                  :src="item.url"
                />

                <div class="text-center q-pa-xs col">
                  {{ item.prompt }}
                </div>
              </div>
            </q-carousel-slide>
          </q-carousel>

          <div class="row q-pt-md" style="gap: 16px">
            <div
              v-for="(item, idx) in carouselItems"
              class="col relative-position"
              style="max-width: 80px"
            >
              <q-img
                height="80px"
                width="80px"
                :src="item.url"
                @click="carouselModel = idx"
                :class="[
                  'rounded-borders',
                  {
                    highlighted: idx === carouselModel,
                  },
                ]"
              >
              </q-img>

              <q-checkbox
                :model-value="form.imageUrl === item.url"
                @update:model-value="
                  (val) => (form.imageUrl = val ? item.url : '')
                "
                class="absolute absolute-bottom-right"
                size="sm"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="onCancel" />
        <q-btn flat label="Save" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style lang="scss">
.highlighted {
  border-color: $primary;
  border-style: solid;
  background-color: $primary;
  border-width: 4px;
}
</style>
