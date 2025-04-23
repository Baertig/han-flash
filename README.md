# Anki Card Creator

A specialized tool for creating content-rich Anki flashcards for language learning, with a focus on Chinese vocabulary acquisition.

## Overview

Anki Card Creator is designed to streamline the creation of comprehensive flashcards for language learning. The application goes beyond simple word-translation pairs by integrating example sentences, sentence breakdowns, pinyin pronunciation guides, and multimedia elements (audio and images) specifically tailored for learning Chinese.

## Current Features

- Create flashcards with Chinese words/characters, pinyin, and translations
- View existing flashcards in a responsive grid layout
- Add and delete flashcards
- Basic structure ready for enhancement features

## Planned Features

- Integration with AI services (like OpenAI) to generate:
  - Example sentences using the target word
  - Detailed breakdowns of example sentences
- Text-to-speech functionality for pronunciation practice
- Image generation using DALL-E or similar services to provide visual context
- Export capabilities to Anki format
- Data persistence

## Technologies Used

- **Vue 3**: Core framework with Composition API and script setup
- **Vite**: Fast, modern build tool
- **Quasar Framework**: UI component library for rapid development
- **Pinia**: State management library
- **Quasar Dialog Plugin**: For modal dialogs

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Component Structure

- **App.vue**: Main application container with Quasar layout
- **Components**:
  - **FlashcardList.vue**: Displays the list of flashcards and handles the add card dialog
  - **flashcard/Flashcard.vue**: Reusable component for displaying individual flashcards
- **Dialogs**:
  - **NewFlashcardDialog.vue**: Dialog for adding new flashcards, using Quasar Dialog Plugin

### State Management

- **Pinia Store** (`stores/flashcards.js`): Centralized state management for:
  - Storing flashcards data
  - Handling CRUD operations (add, read, update, delete)
  - Future enhancement operations

### Data Structure

Each flashcard contains:
```javascript
{
  id: Number,
  word: String,         // Chinese word/character
  pinyin: String,       // Pronunciation guide
  translation: String,  // English translation
  exampleSentence: String,
  sentencePinyin: String,
  sentenceTranslation: String,
  sentenceBreakdown: Array, // Detailed word-by-word analysis
  hasAudio: Boolean,
  hasImage: Boolean
}
```

## Development

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project
cd anki-card-creator

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Goals

1. Provide an intuitive interface for creating rich, contextual flashcards for language learning
2. Leverage AI services to automate the generation of example sentences and translations
3. Support multiple media types (text, audio, images) for comprehensive learning
4. Focus specifically on the challenges of learning Chinese vocabulary
5. Create Anki-compatible exports for use with the popular spaced repetition software

## License

[MIT License](LICENSE)

