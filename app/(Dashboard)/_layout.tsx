import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import * as Haptics from "expo-haptics";

export default function DashboardLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: "#F1F5FF" },
          tabBarActiveTintColor: "#1976D2",
          tabBarInactiveTintColor: "#699bce",
        }}
      >
        {/* HOME */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              Haptics.selectionAsync(); // ✅ vibration
            },
          }}
        />

        {/* DOCUMENTS */}
        <Tabs.Screen
          name="AllDocuments"
          options={{
            title: "Documents",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              Haptics.selectionAsync(); //  vibration
            },
          }}
        />

        {/* SEARCH */}
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            headerShown: true,
            headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#1976D2" },
        headerTitleStyle: { color: "#FFFFFF", fontWeight: "700" },
        headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="search" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              Haptics.selectionAsync(); // ✅ vibration
            },
          }}
        />
      </Tabs>
    </>
  );
}
