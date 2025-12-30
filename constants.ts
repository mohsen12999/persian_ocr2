import { NameDbItem } from './types';

// Fallback if env var is missing
export const API_URL = process.env.API_URL || 'https://api.example.com/v1/livestock-entry';

export const MOCK_NAMES_DB: NameDbItem[] = [
  { id: 101, name: "علی رضا محمدی" },
  { id: 102, name: "محمد حسین پور" },
  { id: 103, name: "سید حسن موسوی" },
  { id: 104, name: "احمد کریمی" },
  { id: 105, name: "رضا نوروزی" },
  { id: 106, name: "محمود احمدی" },
  { id: 107, name: "جواد عزتی" },
  { id: 108, name: "حسین حسینی" },
  { id: 109, name: "اکبر عباسی" },
  { id: 110, name: "مهدی زند" },
  { id: 111, name: "کامران تفتی" },
  { id: 112, name: "سارا امیری" },
  { id: 113, name: "مریم کاویانی" },
  { id: 114, name: "امیر جعفری" },
  { id: 115, name: "سعید آقاخانی" }
];
