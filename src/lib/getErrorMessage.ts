// lib/getErrorMessage.ts
import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Request failed";
  }
  return "Something went wrong";
}
