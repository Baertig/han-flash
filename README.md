# Anki Card Creator

A specialized tool for creating content-rich Anki flashcards for language learning, with a focus on Chinese vocabulary acquisition.

## Overview

Anki Card Creator is designed to streamline the creation of comprehensive flashcards for language learning. The application goes beyond simple word-translation pairs by integrating example sentences, sentence breakdowns, pinyin pronunciation guides, and multimedia elements (audio and images) specifically tailored for learning Chinese. It leverages AI to automatically generate much of this content.

## Current Features

- Create flashcards with Chinese words/characters, pinyin, and translations
- **AI-powered Autofill**: Automatically fetch pinyin, translation, example sentence (with pinyin and translation), and a detailed sentence breakdown using OpenAI GPT.
- **Dynamic Dialog**: The new card dialog includes fields for all generated data, allowing user edits.
- **Sentence Breakdown**: View a word-by-word breakdown of example sentences, including pinyin and meaning.
- View existing flashcards in a responsive grid layout
- Add and delete flashcards
- **Expandable Sections**: Example sentence and breakdown sections automatically expand when populated.
- **Anki Export**: Export all current flashcards to a `.txt` file suitable for importing into Anki. The format uses HTML line breaks (`<br>`) and separates front/back fields with a semicolon.
  - *Front*: Translation
  - *Back*: Word, Pinyin, Example Sentence (with Pinyin & Translation), Sentence Breakdown.

## Planned Features

- Text-to-speech functionality for pronunciation practice
- Image generation using DALL-E or similar services to provide visual context
- Data persistence
- Ability to edit existing flashcards
- Ability to enter an english word an let gpt fill out the rest.

## Technologies Used

- **Vue 3**: Core framework with Composition API and script setup
- **Vite**: Fast, modern build tool
- **Quasar Framework**: UI component library for rapid development
- **Pinia**: State management library
- **Quasar Dialog Plugin**: For modal dialogs
- **OpenAI API**: For generating translations, examples, and breakdowns using `gpt-4o` with `json_schema` response format.

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
  - Storing flashcards data (including example sentences and breakdowns)
  - Handling CRUD operations (add, read, update, delete)
  - Future enhancement operations

### Data Structure

Each flashcard contains:
```javascript
{
  id: Number,
  word: String,         // Chinese word/character
  pinyin: String,       // Pronunciation guide for the main word
  translation: String,  // English translation of the main word
  exampleSentence: String, // Example sentence in Chinese
  sentencePinyin: String, // Pinyin for the full example sentence
  sentenceTranslation: String, // English translation of the example sentence
  sentenceBreakdown: [ // Detailed word-by-word analysis:
    {
      word: String, // Component word from the sentence
      pinyin: String, // Pinyin for the component word
      meaning: String // English meaning of the component word
    }
  ], 
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

# Create a .env file in the root directory
# Add your OpenAI API key:
VITE_OPENAI_API_KEY=your_api_key_here

# Start development server
npm run dev
```

## Project Goals

1. Provide an intuitive interface for creating rich, contextual flashcards for language learning
2. Leverage AI services to automate the generation of example sentences, translations, and breakdowns
3. Support multiple media types (text, audio, images) for comprehensive learning
4. Focus specifically on the challenges of learning Chinese vocabulary
5. Create Anki-compatible exports for use with the popular spaced repetition software

## License

[MIT License](LICENSE)

