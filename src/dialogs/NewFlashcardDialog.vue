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

// Define columns for the breakdown table
const breakdownColumns = [
  { name: 'word', label: 'Word', field: row => `${row.word} (${row.pinyin})`, align: 'left', sortable: true, style: 'white-space: normal;' }, // Allow wrapping
  { name: 'meaning', label: 'Meaning', field: 'meaning', align: 'left', sortable: true, style: 'white-space: normal;' }, // Allow wrapping
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
];

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
                >
                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props" class="q-gutter-xs">
                      <q-btn 
                        round 
                        dense 
                        flat 
                        icon="delete" 
                        color="negative" 
                        @click="removeBreakdownItem(form.sentenceBreakdown.indexOf(props.row))" 
                      />
                    </q-td>
                  </template>
                </q-table>
                <div v-else class="text-grey q-mt-sm">
                  No breakdown available. Use Autofill or add an example sentence manually.
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
