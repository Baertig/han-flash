import { createRouter, createWebHashHistory } from "vue-router";
import FlashcardList from "../pages/FlashcardList.vue";
import CardPage from "../pages/CardPage.vue";
import NotFound from "../pages/NotFound.vue";
import LearningChat from "../pages/LearningChat.vue";

const routes = [
  { path: "/", redirect: "/flashcards" },
  { path: "/flashcards", name: "Flashcards", component: FlashcardList },
  { path: "/new-card", name: "NewCard", component: CardPage },
  { path: "/card/:id", name: "EditCard", component: CardPage, props: true },
  { path: "/chat", name: "LearningChat", component: LearningChat },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHashHistory("/han-flash/"),
  routes,
});

export default router;
