// import { Stack } from "expo-router";
// import { Pressable, StyleSheet } from "react-native";
// // import { store } from "../src/store";
// // import { logout } from "../src/features/authSlice";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// const _layout = () => {
//   const router = useRouter();

//   return (
//     // <Provider store={store}>
//     <Stack
//       screenOptions={{
//         headerTitleAlign: "center",
//         headerStyle: { backgroundColor: "#1976D2" },
//         headerTitleStyle: { color: "#FFFFFF", fontWeight: "700" },
//         headerTintColor: "#FFFFFF",
//       }}
//     >
//       <Stack.Screen
//         name="ClientStrategies"
//         options={{
//           headerShown: true,
//           title: "Client Strategies",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />

//       <Stack.Screen
//         name="FinacialAdvisory"
//         options={{
//           headerShown: true,
//           title: "Financial Advisory",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />

//       <Stack.Screen
//         name="ProjectBluePrint"
//         options={{
//           headerShown: true,
//           title: "Project Blueprints",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />

//       <Stack.Screen
//         name="DrinkingWater"
//         options={{
//           headerShown: true,
//           title: "Drinking Water",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Sewage_Treatment"
//         options={{
//           headerShown: true,
//           title: "Sewage Treatment",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Storm_Water"
//         options={{
//           headerShown: true,
//           title: "Storm Water",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Used_Water_Management"
//         options={{
//           headerShown: true,
//           title: "Used Water Management",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="River_Front"
//         options={{
//           headerShown: true,
//           title: "River Front",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Soil_Testing"
//         options={{
//           headerShown: true,
//           title: "Soil Testing",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Transport_Sector"
//         options={{
//           headerShown: true,
//           title: "Transport Sector",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="Housing_Slum"
//         options={{
//           headerShown: true,
//           title: "Housing & Slum",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
// <Stack.Screen
//         name="ConsultantReport"
//         options={{
//           headerShown: true,
//           title: "Consultant Report",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//     <Stack.Screen
//         name="Contracts"
//         options={{
//           headerShown: true,
//           title: "Contracts & Agreements",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />
//     <Stack.Screen
//         name="HRRecords"
//         options={{
//           headerShown: true,
//           title: "HR Records",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           )
//         }}
//       />
//     <Stack.Screen
//         name="OtherDocuments"
//         options={{
//           headerShown: true,
//           title: "Other Documents",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           )

//         }}
//       />
//   <Stack.Screen
//         name="ShareDocumentWithOTP"
//         options={{
//           headerShown: true,
//           title: "Share Document With OTP",
//           headerLeft: () => (
//             <Pressable
//               onPress={() => router.replace("/(Dashboard)")}
//               style={{ paddingHorizontal: 12 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//           ),
//         }}
//       />

//     </Stack>
//     // </Provider>
//   );
// };

// export default _layout;

// const styles = StyleSheet.create({});

import { Stack,useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#1976D2" },
        headerTitleStyle: { color: "#f1efef", fontWeight: "700" },
        headerTintColor: "#FFFFFF",
        headerShown: true,
        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            style={{ paddingLeft: 12, paddingRight: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="ClientStrategies"
        options={{ title: "Client Strategies" }}
      />
      <Stack.Screen
        name="FinacialAdvisory"
        options={{ title: "Financial Advisory" }}
      />
      <Stack.Screen
        name="ProjectBluePrint"
        options={{ title: "Project Blueprints" }}
      />
      <Stack.Screen
        name="DrinkingWater"
        options={{ title: "Drinking Water" }}
      />
      <Stack.Screen
        name="Sewage_Treatment"
        options={{ title: "Sewage Treatment" }}
      />
      <Stack.Screen name="Storm_Water" options={{ title: "Storm Water" }} />
      <Stack.Screen
        name="Used_Water_Management"
        options={{ title: "Used Water Management" }}
      />
      <Stack.Screen name="River_Front" options={{ title: "River Front" }} />
      <Stack.Screen name="Soil_Testing" options={{ title: "Soil Testing" }} />
      <Stack.Screen
        name="Transport_Sector"
        options={{ title: "Transport Sector" }}
      />
      <Stack.Screen name="Housing_Slum" options={{ title: "Housing & Slum" }} />
      <Stack.Screen
        name="ConsultantReport"
        options={{ title: "Consultant Report" }}
      />
      <Stack.Screen
        name="Contracts"
        options={{ title: "Contracts & Agreements" }}
      />
      <Stack.Screen name="HRRecords" options={{ title: "HR Records" }} />
      <Stack.Screen
        name="OtherDocuments"
        options={{ title: "Other Documents" }}
      />
      <Stack.Screen
        name="ShareDocumentWithOTP"
        options={{ title: "Share Document With OTP" }}
      />
      <Stack.Screen
      name="DigiLocker"
      options={{ title: "Folder" }}
     />
     <Stack.Screen name="[categoryId]" options={({ route }) => ({ title: decodeURIComponent(route.params.categoryId) })} />
    </Stack>  
  );
};