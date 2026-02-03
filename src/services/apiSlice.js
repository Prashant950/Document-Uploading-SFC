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
    prepareHeaders: async (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Documents"],

  endpoints: (builder) => ({
    Adminpincreate: builder.mutation({
      query: (data) => ({
        url: "admin/create-admin-pin",
        method: "POST",
        body: data,
      }),
    }),
    AdminconfirmPin: builder.mutation({
      query: (data) => ({
        url: "admin/confirm-admin-pin",
        method: "POST",
        body: data,
      }),
    }),
    AdminforgotPin: builder.mutation({
      query: () => ({
        url: "admin/forgot-admin-pin",
        method: "POST",
      }),
    }),

    AdminPinexist: builder.query({
      query: () => "admin/existing-admin",
    }),

    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: "documents/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Documents"],
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
        // Return a serializable byte-array instead of a Blob to avoid
        // non-serializable values stored in RTK Query cache/state.
        responseHandler: async (response) => {
          const buf = await response.arrayBuffer();
          return Array.from(new Uint8Array(buf));
        },
      }),
    }),

    shareDocument: builder.query({
      query: (id) => ({
        url: `documents/share/${id}`,
        method: "GET",
      }),
    }),

    RequestOTP: builder.mutation({
      query: (body) => ({
        url: "admin/request-otp",
        method: "POST",
        body,
      }),
    }),
    VerifyOTP: builder.mutation({
      query: (data) => ({
        url: "admin/confirm-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Check approval status for a user (polled from client)
    checkApproval: builder.query({
      query: () => "admin/approval-requests",
    }),

    // Admin approves a user access request
    adminApproveUser: builder.mutation({
      query: (userId) => ({
        url: `admin/approve-user/${userId}`,
        method: "POST",
      }),
    }),
    AdminUploadDocument: builder.mutation({
      query: (formData) => ({
        url: "admin/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Documents"],
    }),

    DocumentView: builder.query({
      query: (id) => ({
        url: `admin/view/${id}`,
        method: "GET",
      }),
    }),
    AdminDownloadDocument: builder.query({
      query: (id) => ({
        url: `admin/download/${id}`,
        method: "GET",
        // Return serializable byte-array instead of Blob
        responseHandler: async (response) => {
          const buf = await response.arrayBuffer();
          return Array.from(new Uint8Array(buf));
        },
      }),
    }),

    AdminShareDocument: builder.query({
      query: (id) => ({
        url: `admin/share/${id}`,
        method: "GET",
      }),
    }),
    AdminRenameDocument: builder.mutation({
      query: ({ id, docName }) => ({
        url: `admin/rename/${id}`,
        method: "PATCH",
        body: { docName },
      }),
      invalidatesTags: ["Documents"],
    }),

    // GetDocumentWithCategories: builder.query({
    //   query: () => "admin/documents",
    //   providesTags: ["Documents"],
    // }),
    GetDocumentWithCategories: builder.query({
      query: (arg = {}) => {
        const docKey = arg?.docKey;
        return {
          url: "/admin/documents",
          method: "GET",
          params: docKey ? { docKey } : {}, // safe when arg is undefined
        };
      },
      providesTags: (result) =>
        result?.documents
          ? [
              ...result.documents.map(({ _id }) => ({
                type: "Documents",
                id: _id,
              })),
              { type: "Documents", id: "LIST" },
            ]
          : [{ type: "Documents", id: "LIST" }],
    }),
    AdminDocumentDelete: builder.mutation({
      query: ({ id, token }) => ({
        url: `/admin/delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // 🔐 proper auth
        },
      }),
      invalidatesTags: ["Documents"],
    }),

    SubmitUserProfile: builder.mutation({
  query: (data) => ({
    url: "user/UserProfile",
    method: "POST",
    body:data,
  }),
}),

getUserStatus: builder.query({
  query: () => ({
    url: "user/me/status",
    method: "GET",
  }),
}),
UserCreatePin: builder.mutation({
  query: (data) => ({
    url: "user/user-create-pin",
    method: "POST",
    body: data,
  }),}),
UserConfirmPin: builder.mutation({
  query: (data) => ({
    url: "user/user-confirm-pin",
    method: "POST",
    body: data,
  }),
}),
UserForgotPin: builder.mutation({
  query: () => ({
    url: "user/user-forgot-pin",
    method: "POST",
  }),
}),
GetUserName: builder.query({
  query: () => ({
    url: "user/ProfileName",
    method: "GET",
  }),
}),



  }),

});

export const {
  useAdminpincreateMutation,
  useAdminconfirmPinMutation,
  useAdminPinexistQuery,
  useAdminforgotPinMutation,
  useAdminUploadDocumentMutation,
  useGetDocumentWithCategoriesQuery,
  useAdminDocumentDeleteMutation,
  useSubmitUserProfileMutation,
  useGetUserProfileStatusQuery,


  useDocumentViewQuery,
  useUserForgotPinMutation,

  useAdminDownloadDocumentQuery,
  useAdminShareDocumentQuery,
  useLazyAdminShareDocumentQuery,
  useLazyAdminDownloadDocumentQuery,
  useAdminRenameDocumentMutation,

  useUploadDocumentMutation,



  useFetchDocumentsQuery,
  useDeleteDocumentMutation,
  useLazyViewDocumentQuery,
  useLazyDownloadDocumentQuery,
  useLazyShareDocumentQuery,

  useRequestOTPMutation,
  useVerifyOTPMutation,

  useCheckApprovalQuery,
  useAdminApproveUserMutation,
  useUserCreatePinMutation,
  useUserConfirmPinMutation,
  useGetUserNameQuery,

} = apiSlice;
