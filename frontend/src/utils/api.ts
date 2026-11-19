import { showConnectionError } from "./connection";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "https://lettucecare.iet-polinela.my.id";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const request = fetch(`${API_URL}${endpoint}`, options);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("CONNECTION_TIMEOUT"));
    }, 8000);
  });

  try {
    const response = await Promise.race([
      request,
      timeout,
    ]);

    const data = await response
      .json()
      .catch(() => ({}));

    return {
      response,
      data,
    };
  } catch (error) {
    showConnectionError();

    throw error;
  }
}