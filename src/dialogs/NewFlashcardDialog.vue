<script setup>
import { ref, computed, watch } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import translationSchema from '../service/gpt_translation_schema.json';

const props = defineProps({
  // Custom props can be defined here
});

defineEmits([
  // Need to specify events that the component will emit through useDialogPluginComponent
  ...useDialogPluginComponent.emits,
]);

// Required: must be called inside of script setup
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const $q = useQuasar();
const loading = ref(false);
const exampleSentenceExpanded = ref(false); // Ref to control expansion state

const form = ref({
  word: "",
  pinyin: "",
  translation: "",
  exampleSentence: "",
  sentencePinyin: "",
  sentenceTranslation: "",
  sentenceBreakdown: [],
});

// Computed property to check if the word field is filled
const canAutofill = computed(() => !!form.value.word.trim());

// Generate a new empty breakdown component
const newBreakdownItem = () => ({ word: "", pinyin: "", meaning: "" });

// Add an empty breakdown item
function addBreakdownItem() {
  form.value.sentenceBreakdown.push(newBreakdownItem());
}

// Remove a breakdown item
function removeBreakdownItem(index) {
  form.value.sentenceBreakdown.splice(index, 1);
}

async function autofillWithAI() {
  if (!form.value.word) return;
  
  loading.value = true;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides Chinese language translations and example sentences. Respond with a JSON object following the provided schema."
          },
          {
            role: "user",
            content: `Translate the Chinese word "${form.value.word}" and provide details.`
          }
        ],
        response_format: { 
            type: "json_schema", 
            json_schema: translationSchema
        }
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      const result = JSON.parse(data.choices[0].message.content);
      
      // Update the form with the API response
      form.value = {
        ...form.value,
        pinyin: result.pinyin,
        translation: result.translation,
        exampleSentence: result.example_sentence,
        sentencePinyin: result.example_sentence_pinyin,
        sentenceTranslation: result.example_sentence_translation,
        sentenceBreakdown: result.sentence_breakdown.components.map(component => ({
          word: component.word,
          pinyin: component.pinyin,
          meaning: component.translation
        }))
      };

      // Expand the example sentence section if it has content
      if (form.value.exampleSentence) {
        exampleSentenceExpanded.value = true;
      }
    }
    
    $q.notify({
      color: 'positive',
      message: 'Card info fetched successfully',
      icon: 'check'
    });
  } catch (error) {
    console.error('Error fetching from OpenAI:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to fetch translation data',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
}

function onSubmit() {
  if (form.value.word && form.value.translation) {
    // Call onDialogOK with the form data to close the dialog and pass the data back
    onDialogOK({ ...form.value });
    // Reset form after submission
    form.value = {
      word: "", 
      pinyin: "", 
      translation: "",
      exampleSentence: "",
      sentencePinyin: "",
      sentenceTranslation: "",
      sentenceBreakdown: []
    };
  }
}

// Initialize with one empty breakdown item if needed
watch(() => form.value.exampleSentence, (newVal) => {
  if (newVal && form.value.sentenceBreakdown.length === 0) {
    addBreakdownItem();
  }
});

// Expose the form for external access if needed
defineExpose({
  form,
});
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <div class="text-h6">New Flashcard</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
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

          <q-expansion-item
            icon="format_quote"
            label="Example Sentence"
            caption="Add an example sentence with breakdown"
            header-class="text-primary"
            expand-separator
            v-model="exampleSentenceExpanded"
          >
            <q-card>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.exampleSentence"
                      label="Example Sentence"
                      outlined
                      class="q-mb-md"
                    />
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
                
                <div v-for="(item, index) in form.sentenceBreakdown" :key="index" class="row q-col-gutter-sm q-mb-sm">
                  <div class="col-12 col-sm-4">
                    <q-input v-model="item.word" label="Word" dense outlined />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="item.pinyin" label="Pinyin" dense outlined />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input v-model="item.meaning" label="Meaning" dense outlined />
                  </div>
                  <div class="col-12 col-sm-1 flex items-center">
                    <q-btn round dense flat icon="delete" color="negative" @click="removeBreakdownItem(index)" />
                  </div>
                </div>

                <div class="row justify-center q-mt-md">
                  <q-btn 
                    label="Add Word" 
                    icon="add" 
                    color="secondary" 
                    flat 
                    @click="addBreakdownItem" 
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="onDialogCancel" />
        <q-btn flat label="Save" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
