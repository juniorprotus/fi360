const PRODUCTION_API_URL = "https://fi360.onrender.com";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : PRODUCTION_API_URL);
