import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  category: String,
  front: String,
  back: String,
});

export const Flashcard = mongoose.model("flashcard", flashcardSchema);
