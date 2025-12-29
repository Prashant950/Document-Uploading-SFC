import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
const router = useRouter();
const index2 = () => {

const redirectToDashboard = () => {
  router.push("/Confirmpin");
}

  return (
    <View style={styles.container}>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle-outline" size={56} color="#1976d2" />
        </View>

        <Text style={styles.title}>PIN Created Successfully!</Text>
        <Text style={styles.subtitle}>
          Your PIN has been successfully created. You can now use it to access
          your account.
        </Text>
      </View>

      {/* Bottom Button */}
      <TouchableOpacity style={styles.button} onPress={redirectToDashboard}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default index2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#1976d2",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
