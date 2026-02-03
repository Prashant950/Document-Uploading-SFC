import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import { apiSlice } from "./services/apiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (gDM) =>
    gDM({
      serializableStateInvariantMiddleware: {
        ignoredActions: [
          "api/subscriptions/unsubscribeQueryResult",
          "api/subscriptions/updateSubscriptionOptions",
        ],
        ignoredPaths: ["api.queries.DocumentView"],
      },
    }).concat(apiSlice.middleware),
});