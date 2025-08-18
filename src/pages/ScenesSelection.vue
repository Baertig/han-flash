<script setup>
import { useRouter } from "vue-router";
import { scenes } from "../service/scenes";
import { storeToRefs } from "pinia";
import { useLearningChatStore } from "../stores/learningChat";

const router = useRouter();
const chatStore = useLearningChatStore();
const { level } = storeToRefs(chatStore);

function playScene(scene) {
  router.push({ name: "LearningChat", query: { scene: scene.name } });
}
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-col-gutter-md">
      <div class="col-auto text-h5">Choose a Roleplay Scene</div>
      <div class="col-12 col-sm-auto">
        <q-select
          v-model="level"
          :options="['A1', 'A2', 'B1', 'B2', 'C1', 'C2']"
          label="Language Level"
          dense
          outlined
          style="min-width: 140px"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md">
      <div v-for="s in scenes" :key="s.name" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="column full-height">
          <q-img :src="s.thumbnailSrc" ratio="16/9" />
          <q-card-section>
            <div class="text-h6">{{ s.title }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">Task</div>
            <div>{{ s.task }}</div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right">
            <q-btn color="primary" label="Play" @click="playScene(s)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

