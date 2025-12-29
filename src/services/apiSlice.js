import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_IP, BACKEND_PORT } from "../config";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `http://${BACKEND_IP}:${BACKEND_PORT}/api/`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      // Don't force Content-Type here so multipart/form-data (FormData) works correctly.
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createPin: builder.mutation({
      query: (data) => ({
        url: "pin/create-pin",
        method: "POST",
        body: data,
      }),
    }),
    confirmPin: builder.mutation({
      query: (data) => ({
        url: "pin/confirm-pin",
        method: "POST",
        body: data,
      }),
    }),

    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: "documents/upload",
        method: "POST",
        body: formData,
      }),
    }),

    getDocuments: builder.query({
      query: () => "documents",
    }),

    Pinexist: builder.query({
      query: () => "pin/exists",
    }),
    ForgotPin: builder.mutation({
      query: () => ({
        url: "pin/forgot-pin",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCreatePinMutation,
  useConfirmPinMutation,
  useUploadDocumentMutation,
  useGetDocumentsQuery,
  usePinexistQuery,
  useForgotPinMutation,
} = apiSlice;
