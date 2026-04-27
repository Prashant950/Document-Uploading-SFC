import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { Provider, useDispatch } from "react-redux";
import { logout, setCredentials } from "../src/features/authSlice";
import { store } from "../src/store";
import { StatusBar } from "expo-status-bar";

function HeaderLogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("role");
      await AsyncStorage.removeItem("PIN_CREATED");
    } catch (e) {
      console.warn("Failed clearing async storage on logout:", e);
    }

    dispatch(logout());
    router.replace("/EnterMobile");
  };

  return <></>;
}

function RootLayoutContent() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      const role = await AsyncStorage.getItem("role");
      const pinCreated = await AsyncStorage.getItem("PIN_CREATED");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      // 1. No token = go to EnterMobile
      if (!token) {
        router.replace("/EnterMobile");
        return;
      }

      // 2. Token exists -> restore to redux (include user if present)
      dispatch(setCredentials({ token, role, user }));

      // 3. Pending approval: only treat as pending if we have a pending_mobile
      // saved (set immediately after OTP). If not, the stored token/role is
      // likely stale — clear auth and send to EnterMobile.
      if (role === "new_user") {
        const pending = await AsyncStorage.getItem("pending_mobile");
        if (pending) {
          // Redirecting to EnterMobile instead of waiting_approval to avoid
          // repeatedly landing on the waiting screen on reload.
          router.replace("/EnterMobile");
          return;
        }

        // stale new_user token: clear and ask user to re-enter mobile
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("role");
          await AsyncStorage.removeItem("PIN_CREATED");
        } catch (e) {
          /* ignore */
        }

        router.replace("/EnterMobile");
        return;
      }

      // 4. For approved users, check if PIN was created
      if (pinCreated === "true") {
        router.replace("/Confirmpin");
      } else {
        router.replace("/Pincreated");
      }
    };

    bootstrapAuth();
  }, []);

  return (
    <>
      <Slot />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}
