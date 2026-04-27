import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const ShareDocumentWithOTP = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const handleGenerateOTP = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOtpSent(true);
      setTimer(30);
      setLoading(false);
      Toast.show({
        type: "success",
        text1: "OTP Generated",
        text2: "A security OTP has been sent to the Administrator.",
      });

      // Countdown timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  const handleVerifyOTP = () => {
    if (otpInput.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter a 4-digit OTP.",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (otpInput === "1234") {
        setOtpVerified(true);
        setLoading(false);
        Toast.show({
          type: "success",
          text1: "OTP Verified",
          text2: "The OTP has been verified successfully.",
        });
      } else {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Invalid OTP",
          text2: "The provided OTP is invalid.",
        });
        setOtpInput("");
      }
    }, 1000);
  };

  const handleResendOTP = () => {
    setOtpInput("");
    setTimer(30);
    Toast.show({
      type: "success",
      text1: "OTP Resent",
      text2: "A new security OTP has been sent to the Administrator.",
    });

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleShareDocument = () => {
    Toast.show({
      type: "success",
      text1: "Document Shared",
      text2: "The document has been shared successfully.",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          {/* <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Ionicons name="water-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.company}>SNOW FLOW FOUNTAIN</Text>
              <Text style={styles.subCompany}>CONSULTANT GROUP</Text>
            </View>
          </View> */}

          {/* <TouchableOpacity>
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity> */}
        </View>

        {/* VERIFIED TAG */}
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
          <Text style={styles.verifiedText}>ADMIN-VERIFIED SHARE</Text>
        </View>

        {/* TITLE */}

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
              <Text style={styles.docMeta}>4.2 MB • AES-256 Encrypted</Text>
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
          <Text style={styles.title}>
            {isVerified
          ? "User Successfully verified. Now you are eligible to share the document."
          : "Verify the user to share the document. An OTP will be sent to the Administrator."}
          </Text>
        </View>

        {/* GENERATE OTP BUTTON - Only shown if OTP not yet sent */}
        {!otpSent && !otpVerified && (
          <TouchableOpacity
            style={[styles.otpButton, loading && styles.buttonDisabled]}
            onPress={handleGenerateOTP}
            disabled={loading}
          >
            <Ionicons name="key-outline" size={20} color="#fff" />
            <Text style={styles.otpText}>
              {loading ? "Generating..." : "Generate Security OTP"}
            </Text>
          </TouchableOpacity>
        )}

        {/* OTP INPUT SECTION - Shown after OTP is sent but not verified */}
        {otpSent && !otpVerified && (
          <View style={styles.otpSection}>
            {/* OTP Input Header */}
            <View style={styles.otpHeader}>
              <View style={styles.otpIconBox}>
                <Ionicons name="mail-outline" size={24} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.otpHeaderTitle}>Enter Security OTP</Text>
                <Text style={styles.otpHeaderSubtitle}>
                  Check SMS for the OTP
                </Text>
              </View>
            </View>

            {/* OTP Input Field */}
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              maxLength={4}
              value={otpInput}
              onChangeText={setOtpInput}
              editable={!loading}
            />

            {/* Timer and Resend */}
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                {timer > 0
                  ? `Resend OTP in ${timer}s`
                  : ""}
              </Text>
              {timer === 0 && (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify OTP Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || otpInput.length !== 4) && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOTP}
              disabled={loading || otpInput.length !== 4}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.verifyButtonText}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Text>
            </TouchableOpacity>

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.securityInfoText}>
                Your data is protected with AES-256 encryption
              </Text>
            </View>
          </View>
        )}

        {/* SUCCESS STATE - Shown after OTP is verified */}
        {otpVerified && (
          <View style={styles.successSection}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>OTP Verified Successfully</Text>
            <Text style={styles.successSubtitle}>
              You can now proceed to share the document
            </Text>
          </View>
        )}

        {/* SHARE BUTTON - Disabled until OTP is verified */}
        <TouchableOpacity
          style={[
            otpVerified ? styles.shareButton : styles.shareDisabled,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleShareDocument}
          disabled={!otpVerified || loading}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={otpVerified ? "#fff" : "#94A3B8"}
          />
          <Text
            style={
              otpVerified ? styles.shareButtonText : styles.shareDisabledText
            }
          >
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
    marginBottom: 8,
    marginTop: -10,
  },
  verifiedText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "500",
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

  /* OTP Section */
  otpSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  otpIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  otpHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },
  otpHeaderSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* OTP Input */
  otpInput: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },

  /* Timer and Resend */
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timerText: {
    fontSize: 13,
    color: "#64748B",
  },
  resendLink: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },

  /* Verify Button */
  verifyButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Security Info */
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  securityInfoText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
  },

  /* Success Section */
  successSection: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBEF63",
  },
  successIconBox: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#4D7C0F",
  },

  /* Share Button */
  shareButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  buttonDisabled: {
    opacity: 0.6,
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
