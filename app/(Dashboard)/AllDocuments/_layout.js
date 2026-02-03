import { Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
// import { store } from "../src/store";
// import { logout } from "../src/features/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
const _layout = () => {
  const router = useRouter();

  return (
    // <Provider store={store}>
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#1976D2" },
        headerTitleStyle: { color: "#FFFFFF", fontWeight: "700" },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Stack.Screen
        name="ClientStrategies"
        options={{
          headerShown: true,
          title: "Client Strategies",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="FinacialAdvisory"
        options={{
          headerShown: true,
          title: "Financial Advisory",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="ProjectBluePrint"
        options={{
          headerShown: true,
          title: "Project Blueprints",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="DrinkingWater"
        options={{
          headerShown: true,
          title: "Drinking Water",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Sewage_Treatment"
        options={{
          headerShown: true,
          title: "Sewage Treatment",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Storm_Water"
        options={{
          headerShown: true,
          title: "Storm Water",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Used_Water_Management"
        options={{
          headerShown: true,
          title: "Used Water Management",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="River_Front"
        options={{
          headerShown: true,
          title: "River Front",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Soil_Testing"
        options={{
          headerShown: true,
          title: "Soil Testing",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Transport_Sector"
        options={{
          headerShown: true,
          title: "Transport Sector",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="Housing_Slum"
        options={{
          headerShown: true,
          title: "Housing & Slum",
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(Dashboard)")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
    </Stack>
    // </Provider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
