import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_IP, BACKEND_PORT } from "../config";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `http://${BACKEND_IP}:${BACKEND_PORT}/api/`,
    //   prepareHeaders: (headers, { getState }) => {
    //     const token = getState().auth?.token;
    //     if (token) {
    //       headers.set("Authorization", `Bearer ${token}`);
    //     }
    //     // ❌ DO NOT set Content-Type
    //     return headers;
    //   },
    // }),
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Documents"],
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
      invalidatesTags: ["Documents"],
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
    fetchDocuments: builder.query({
      query: () => "documents",
      providesTags: ["Documents"],
    }),
    DeleteDocument: builder.mutation({
      query: (id) => ({
        url: `documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),

    viewDocument: builder.query({
      query: (id) => `documents/view/${id}`,
      
    }),

    downloadDocument: builder.query({
      query: (id) => ({
        url: `documents/download/${id}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    shareDocument: builder.query({
      query: (id) => ({
        url: `documents/share/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCreatePinMutation,
  useConfirmPinMutation,
  useUploadDocumentMutation,
  usePinexistQuery,
  useForgotPinMutation,
  useFetchDocumentsQuery,
  useDeleteDocumentMutation,
  useLazyViewDocumentQuery,
  useLazyDownloadDocumentQuery,
  useLazyShareDocumentQuery,
} = apiSlice;
