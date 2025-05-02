<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

import { useFlashcardsStore } from "../stores/flashcards";
import translationSchema from "../service/gpt-translation-schema.json";
import imageIdeasSchema from "../service/gpt-image-ideas-schema.json";
import { generateChineseAudio, generateEnglishToChineseCardTextConent, generateImage as generateImageClient, generateImageIdeas } from "../service/openai-client";

const $q = useQuasar();
const flashcardsStore = useFlashcardsStore();
const router = useRouter();

const loadingAutoFill = ref(false);
const loadingAudio = ref(false);
const loadingIdeas = ref(false);
const loadingImageGeneration = ref({}) //idx : loading

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
    const result = await generateEnglishToChineseCardTextConent(form.value.word);

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
    form.value.audioUrl = await generateChineseAudio(form.value.exampleSentence);
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
  loadingImageGeneration.value = { ...loadingImageGeneration.value, [index]: true };
  try {
    const url = await generateImageClient(prompt);
    imageResults.value[index] = url;
  } catch (error) {
    console.error("Error generating image:", error);
    $q.notify({ color: "negative", message: "Failed to generate image", icon: "error" });
  } finally {
    loadingImageGeneration.value = { ...loadingImageGeneration.value, [index]: false };
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
    $q.notify({ color: "negative", message: "Failed to generate image ideas", icon: "error" });
  } finally {
    loadingIdeas.value = false;
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

      <q-card-section class="q-pt-none">
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
          <q-carousel
            v-model="carouselModel"
            animated
            arrows
            control-color="primary"
            control-icon-color="primary"
          >
            <q-carousel-slide
              v-for="(item, idx) in carouselItems"
              :key="idx"
              :name="idx"
            >
              <div class="flex column items-center">
                <q-img height="512px" width="512px" :src="item.url" />
              </div>

              <div
                class="text-center q-pa-xs"
              >
                {{ item.prompt }}
              </div>
            </q-carousel-slide>
          </q-carousel>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="onCancel" />
        <q-btn flat label="Save" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </div>
</template>
