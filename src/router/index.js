import { createRouter, createWebHistory } from "vue-router";
import FlashcardList from "../pages/FlashcardList.vue";
import NewCardPage from "../pages/NewCardPage.vue";
import NotFound from "../pages/NotFound.vue";

const routes = [
  { path: "/", redirect: "/flashcards" },
  { path: "/flashcards", name: "Flashcards", component: FlashcardList },
  { path: "/new-card", name: "NewCard", component: NewCardPage },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
