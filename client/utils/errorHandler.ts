// utils/errorHandler.ts
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiErrorResponse } from '@/types/api.types';

export const handleApiError = (error: unknown, fallbackMessage = "Something went wrong") => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
      const { message, fields } = axiosError.response.data;
      toast.error(message);
      if (fields && Object.keys(fields).length > 0) {
        console.error("Validation Errors:", fields);
      }
      return;
    }
  }
  toast.error(fallbackMessage);
};