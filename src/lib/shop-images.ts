import studyBibles from "@/assets/shop/study-bibles.jpg";
import books from "@/assets/shop/books.jpg";
import devotionals from "@/assets/shop/devotionals.jpg";
import kids from "@/assets/shop/kids.jpg";
import gifts from "@/assets/shop/gifts.jpg";
import audio from "@/assets/shop/audio.jpg";
import type { ProductCategory } from "@/lib/affiliate-products";

/** Illustrative imagery per resource category (Amazon product photos can't be hotlinked). */
export const categoryImages: Record<ProductCategory, string> = {
  "study-bibles": studyBibles,
  books,
  devotionals,
  kids,
  gifts,
  audio,
};
