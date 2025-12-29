import { Provider } from "react-redux";
import { store } from "../src/store";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { logout } from "../src/features/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

function AppStack() {
  const dispatch = useDispatch();
  const router = useRouter();

 const handleLogout = async () => {
  await AsyncStorage.removeItem("token");
  dispatch(logout());
  router.replace("/Confirmpin");
};


  return (
    <>
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
            headerRight: () => (
              <TouchableOpacity
                onPress={handleLogout}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="power-sharp" size={26} color="red" />
              </TouchableOpacity>
            ),
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
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppStack />
    </Provider>
  );
}
