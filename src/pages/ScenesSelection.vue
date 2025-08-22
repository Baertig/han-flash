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
        <q-card flat bordered class="column full-height scene-card">
          <q-img 
            v-if="s.images?.thumbnail"
            :src="s.images.thumbnail" 
            height="300px"
            class="scene-thumbnail"
          >
            <div class="absolute-bottom bg-gradient-transparent text-white q-pa-md">
              <div class="text-h6">{{ s.title }}</div>
            </div>
          </q-img>
          <div v-else class="scene-placeholder">
            <q-icon name="photo" size="64px" color="grey-5" />
            <div class="text-h6 q-mt-sm">{{ s.title }}</div>
          </div>
          <q-card-section>
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

<style scoped>
.scene-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.scene-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.scene-thumbnail {
  border-radius: 8px 8px 0 0;
}

.scene-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border-radius: 8px 8px 0 0;
}

.bg-gradient-transparent {
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
</style>

