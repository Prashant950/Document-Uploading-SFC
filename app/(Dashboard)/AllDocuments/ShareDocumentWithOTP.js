import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const ShareDocumentWithOTP = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Ionicons name="water-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.company}>SNOW FLOW FOUNTAIN</Text>
              <Text style={styles.subCompany}>CONSULTANT GROUP</Text>
            </View>
          </View>

          <TouchableOpacity>
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* VERIFIED TAG */}
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
          <Text style={styles.verifiedText}>ADMIN-VERIFIED SHARE</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Identity Verification</Text>

        {/* DOCUMENT CARD */}
        <View style={styles.docCard}>
          <View style={styles.docRow}>
            <View style={styles.pdfIcon}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={28}
                color="#EF4444"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.docName} numberOfLines={1}>
                Strategic_Growth_Plan_2024.pdf
              </Text>
              <Text style={styles.docMeta}>
                4.2 MB • AES-256 Encrypted
              </Text>
            </View>
          </View>

          <View style={styles.securityRow}>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={16} color="#16A34A" />
              <Text style={styles.securityText}>Secure Session</Text>
            </View>

            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={16} color="#2563EB" />
              <Text style={styles.securityText}>Encryption Active</Text>
            </View>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Aapko document share karne ke pehle user verify karna hoga.
            Before sharing the document, please generate an OTP which will
            be sent to the Administrator for verification.
          </Text>
        </View>

        {/* GENERATE OTP BUTTON */}
        <TouchableOpacity style={styles.otpButton}>
          <Ionicons name="key-outline" size={20} color="#fff" />
          <Text style={styles.otpText}>Generate Security OTP</Text>
        </TouchableOpacity>

        {/* SHARE BUTTON (DISABLED) */}
        <TouchableOpacity style={styles.shareDisabled} disabled>
          <Ionicons name="share-outline" size={20} color="#94A3B8" />
          <Text style={styles.shareDisabledText}>
            Share Document Now
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShareDocumentWithOTP;


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  company: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  subCompany: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Verified */
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 14,
  },

  /* Document Card */
  docCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pdfIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  docName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  docMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: "#475569",
  },

  /* Info */
  infoCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },

  /* Buttons */
  otpButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  otpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  shareDisabled: {
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  shareDisabledText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
});

