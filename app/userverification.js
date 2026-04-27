import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  useCheckApprovalQuery,
  useUserverificationaccessMutation,
  useUserverificationwithOTPMutation,
} from "../src/services/apiSlice";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CORRECT_OTP = "123456";

const userverification = () => {
  const router = useRouter();

  const [requestUserverificationAccess, isLoading] =
    useUserverificationaccessMutation();
  const [verifyUserverificationWithOTP, isLoadingOTP] =
    useUserverificationwithOTPMutation();

  /* ---------------- STATES ---------------- */
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpVerified, setOtpVerified] = useState(false);
  const [approved, setApproved] = useState(false);
  const [userId, setUserId] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputs = useRef([]);


  // Poll approval status every 5s while we have a userId and not yet approved
  const { data: approvalData } = useCheckApprovalQuery(undefined, {
    skip: !otpVerified || approved,
    pollingInterval: 5000,
  });

  useEffect(() => {
    if (approvalData?.approved) {
      setApproved(true);
      Toast.show({
        type: "success",
        text1: "Approved",
        text2: "Admin approved your access",
      });
    }
  }, [approvalData]);

 
const GeneratesecurityOtp = async () => {
    try {
      const payload = {
        name,
        mobileNumber: mobile,
      };

      const response = await requestUserverificationAccess(payload).unwrap();

      console.log("response", response);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: response.isAdmin
          ? "OTP sent to Admin mobile"
          : "OTP sent to your mobile number",
      });

      setShowOtp(true);
    } catch (err) {
      console.log("OTP API ERROR:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to request OTP",
      });
    }
  };

const userverifywithOTP = async () => {
    try {
      const response = await verifyUserverificationWithOTP({
        otp,
        mobileNumber: mobile,
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: response.message,
      });

      // Admin flow: redirect immediately to PIN creation
      if (response.role === "admin" && response.requiresPin) {
        router.push("/Pincreated");
        return;
      }

      // User flow: hide OTP, show waiting UI and start polling approval
      if (response.role === "user") {
        setShowOtp(false);
        setOtpVerified(true);
        setUserId(response.userId || null);
        setApproved(!!response.isApproved);
        return;
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to verify OTP",
      });
    }
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (showOtp && timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, showOtp]);

  /* ---------------- FOCUS OTP AFTER MOUNT ---------------- */
  useEffect(() => {
    if (showOtp) {
      // wait a tick to ensure inputs are mounted before focusing
      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 0);
    }
  }, [showOtp]);

  /* ---------------- SHAKE ---------------- */
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* ---------------- GENERATE OTP ---------------- */
  const generateOtp = () => {
    if (!name || mobile.length < 10) {
      setError("Please enter valid name & mobile number");
      shake();
      return;
    }
    setError("");
    setShowOtp(true);
    setTimer(45);
    setName("");
    setMobile("");
    setOtp(["", "", "", "", "", ""]);
  };

  /* ---------------- OTP INPUT ---------------- */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (index === 5 && value) Keyboard.dismiss();
  };

  const verifyOtp = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setError("Please enter complete OTP");
      shake();
      return;
    }

    if (enteredOtp !== CORRECT_OTP) {
      setError("Invalid OTP. Please try again.");
      shake();
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      return;
    }

    // OTP SUCCESS
    setShowOtp(false);
    setOtpVerified(true);
    // after OTP success we wait for admin approval (polled below)
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  /* ---------------- RESEND ---------------- */
  const resendOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(45);
    inputs.current[0]?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safe}>
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>User Profile & Verification</Text>
            <Text style={styles.subtitle}>
              Secure identity onboarding for consultants
            </Text>

            {/* NAME */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, otpVerified && styles.disabledInput]}
              placeholder="Full Name"
              value={name}
              editable={!otpVerified}
              onChangeText={setName}
            />

            {/* MOBILE */}
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={[styles.input, otpVerified && styles.disabledInput]}
              placeholder="+91 Mobile Number"
              keyboardType="phone-pad"
              value={mobile}
              maxLength={10}
              editable={!otpVerified}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "");
                setMobile(numericText);

                if (numericText.length === 10) {
                  Keyboard.dismiss(); //auto close keyboard
                }
              }}
            />

            {/* ERROR */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* GENERATE OTP */}
            {!showOtp && !otpVerified && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={GeneratesecurityOtp}
              >
                <Text style={styles.btnText}>🔒 Generate Security OTP</Text>
              </TouchableOpacity>
            )}

            {/* OTP SECTION */}
            {showOtp && (
              <View style={styles.otpCard}>
                <Text style={styles.otpTitle}>Enter 6-Digit Code</Text>

                <Animated.View
                  style={[
                    styles.otpRow,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  {otp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => (inputs.current[i] = r)}
                      style={[
                        styles.otpBox,
                        error && { borderColor: "#EF4444" },
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={d}
                      onChangeText={(v) => handleOtpChange(v, i)}
                      autoFocus={i === 0}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                    />
                  ))}
                </Animated.View>

                {timer > 0 ? (
                  <Text style={styles.timer}>
                    Resend OTP in{" "}
                    <Text style={styles.bold}>
                      0:{timer < 10 ? `0${timer}` : timer}
                    </Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={resendOtp}>
                    <Text style={styles.resend}>Resend OTP</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={userverifywithOTP}
                >
                  <Text style={styles.verifyText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* WAITING / APPROVED */}
            {otpVerified && (
              <>
                <View style={styles.statusBox}>
                  {approved ? (
                    <>
                      <Text style={styles.success}>✔ Identity Verified</Text>
                      <Text style={styles.statusMsg}>
                        Consultant authenticated successfully
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.waiting}>
                        ⏳ Please wait for SuperAdmin Approval
                      </Text>
                      <Text style={styles.statusMsg}>
                        Your request is under verification
                      </Text>
                    </>
                  )}
                </View>

                {/* PROCEED BUTTON — ONLY AFTER OTP VERIFIED */}
                <TouchableOpacity
                  disabled={!approved}
                  style={[styles.proceedBtn, !approved && styles.disabled]}
                  onPress={() => approved && router.push("/Pincreated")}
                >
                  <Text style={styles.proceedText}>
                    Proceed to PIN Creation →
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default userverification;

const BOX_SIZE = (SCREEN_WIDTH - 80) / 6;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FAFF" },
  container: { padding: 20 },

  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "#64748B", marginBottom: 20 },

  label: { fontWeight: "600", marginTop: 14 },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
  },

  error: { color: "#EF4444", marginTop: 10 },

  primaryBtn: {
    backgroundColor: "#1D4ED8",
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },

  otpCard: {
    backgroundColor: "#e4e9f4",
    marginTop: 30,
    padding: 18,
    borderRadius: 18,
  },
  otpTitle: { fontSize: 18, fontWeight: "700" },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 14,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE + 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    gap: 20,
    borderColor: "#2563EB",
    marginHorizontal: 1,
  },

  timer: { textAlign: "center", marginTop: 6 },
  resend: { color: "#2563EB", textAlign: "center", marginTop: 6 },
  bold: { fontWeight: "700" },

  verifyBtn: {
    backgroundColor: "#2563EB",
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  verifyText: { color: "#fff", fontWeight: "700" },

  statusBox: { marginTop: 30, alignItems: "center" },
  waiting: { color: "#CA8A04", fontWeight: "700" },
  success: { color: "#16A34A", fontWeight: "700" },
  statusMsg: { color: "#64748B", textAlign: "center", marginTop: 6 },

  proceedBtn: {
    marginTop: 30,
    backgroundColor: "#1D4ED8",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#94A3B8" },
  proceedText: { color: "#fff", fontWeight: "700" },
});
