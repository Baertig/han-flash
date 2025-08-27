<template>
  <div v-html="renderedMarkdown" class="markdown-content"></div>
</template>

<script setup>
import { computed } from "vue";
import MarkdownIt from "markdown-it";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

// Initialize markdown-it with safe defaults
const md = new MarkdownIt({
  html: false, // Disable HTML for security
  xhtmlOut: false,
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
});

const renderedMarkdown = computed(() => {
  if (!props.content) return "";
  return md.render(props.content);
});
</script>
