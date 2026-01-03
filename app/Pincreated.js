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
        <Ionicons
          name="checkmark-circle-outline"
          size={64}
          color="#1976d2"
        />
      </View>

      <Text style={styles.title}>PIN Created Successfully</Text>

      <Text style={styles.subtitle}>
        Your secure PIN is now active. Use it to quickly and safely access
        your account.
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Info Cards */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#16a34a" />
        <Text style={styles.infoText}>
          Your account is now protected with an additional security layer.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="lock-closed-outline" size={22} color="#2563eb" />
        <Text style={styles.infoText}>
          Do not share your PIN with anyone for safety reasons.
        </Text>
      </View>

      {/* Next Steps */}
      
    </View>

    {/* Bottom Button */}
    <TouchableOpacity style={styles.button} onPress={redirectToDashboard}>
      <Text style={styles.buttonText}>Continue to Dashboard</Text>
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
  divider: {
  height: 1,
  backgroundColor: "#e5e7eb",
  width: "100%",
  marginVertical: 24,
},

infoBox: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f9fafb",
  padding: 14,
  borderRadius: 12,
  marginBottom: 12,
  width: "100%",
},

infoText: {
  marginLeft: 10,
  color: "#374151",
  fontSize: 14,
  flex: 1,
},

nextSteps: {
  marginTop: 24,
  width: "100%",
},

nextTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#111827",
  marginBottom: 12,
},

stepRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
},

stepText: {
  marginLeft: 10,
  fontSize: 14,
  color: "#374151",
},

});
