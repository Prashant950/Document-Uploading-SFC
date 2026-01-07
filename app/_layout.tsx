import { Slot, Stack, useRouter } from "expo-router";
import { Provider, useDispatch } from "react-redux";
import { store } from "../src/store";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout } from "../src/features/authSlice";
import Toast from "react-native-toast-message";

function HeaderLogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch(logout());
    router.replace("/Confirmpin");
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
      <Ionicons name="power-sharp" size={26} color="red" />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTitleStyle: { color: "#fff" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Snow Fountain Consultants" }}
        />

        <Stack.Screen
          name="dashboard"
          options={{
            title: "Manage Documents",
            headerRight: () => <HeaderLogoutButton />,
          }}
        />

        <Stack.Screen
          name="Pincreated"
          options={{ title: "PIN Created Successfully" }}
        />

        <Stack.Screen
          name="Confirmpin"
          options={{ title: "Confirm PIN" }}
        />
      </Stack>

      <Toast />
    </Provider>
  );
}
