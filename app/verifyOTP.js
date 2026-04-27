import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { setCredentials } from "../src/features/authSlice";
import {
  useRequestOTPMutation,
  useVerifyOTPMutation,
} from "../src/services/apiSlice";

const VerifyOTP = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { mobileNumber: paramMobileNumber } = useLocalSearchParams();

  const [Verifyotp, { isLoading }] = useVerifyOTPMutation();
  const [requestOTP] = useRequestOTPMutation();
  const [mobileNumber, setMobileNumber] = useState(paramMobileNumber);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState("");
  const[isverifying,setisverifying]=useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputs = useRef([]);

  useEffect(() => {
    if (paramMobileNumber) {
      setMobileNumber(paramMobileNumber);
    }
  }, [paramMobileNumber]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputs.current[index + 1].focus();
    }

    if (index === 3 && value) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const VERIFYOTP = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length < 4) {
      setError("Please enter complete OTP");
      triggerShake();
      return;
    }

    if (!mobileNumber) {
      setError("Session expired. Please request OTP again.");
      triggerShake();
      return;
    }

    try {
      setisverifying(true);
      const response = await Verifyotp({
        otp: enteredOtp,
        mobileNumber,
      }).unwrap();

      console.log("✅ OTP Verified:", response);

      /* ================= TOKEN HANDLING ================= */

      if (response.token) {
        dispatch(
          setCredentials({
            token: response.token,
            role: response.role,
            user: response.user ?? null,
          }),
        );
        await AsyncStorage.setItem("token", response.token);
        if (response.user) {
          await AsyncStorage.setItem("user", JSON.stringify(response.user));
        }
      } else {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }

      await AsyncStorage.setItem("role", response.role);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: response.message || "OTP verified successfully",
      });

      /* =================SINGLE SOURCE OF TRUTH ================= */
      /* ================= ROUTE ONLY BY nextStep ================= */

      switch (response.nextStep) {
        case "waiting_approval":
          await AsyncStorage.setItem("PIN_CREATED", "false");
          await AsyncStorage.setItem("pending_mobile", mobileNumber);
          router.replace(
            `/waiting_approval?mobileNumber=${encodeURIComponent(mobileNumber)}`,
          );
          break;

        case "create_pin":
          await AsyncStorage.setItem("PIN_CREATED", "false");
          router.replace("/Pincreated");
          break;

        case "confirm_pin":
          await AsyncStorage.setItem("PIN_CREATED", "true");
          router.replace("/Confirmpin");
          break;

        default:
          console.warn("❌ Unknown nextStep:", response);
          router.replace("/");
      }
    } catch (err) {
      console.log("❌ OTP API ERROR:", err);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to verify OTP",
      });
    }
  };

  /* ---------------- RESEND OTP FUNCTION ---------------- */
  const resendOtp = async () => {
    if (!mobileNumber) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Mobile number not found",
      });
      return;
    }

    try {
      console.log("🔄 Requesting new OTP for:", mobileNumber);

      const data = await requestOTP({ mobileNumber: mobileNumber }).unwrap();

      console.log("✅ Resend OTP Success:", data);

      setTimer(45);
      setOtp(["", "", "", ""]);
      setError("");
      inputs.current[0]?.focus();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "New OTP sent to your mobile number",
      });
    } catch (err) {
      console.log("❌ Resend OTP Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to resend OTP",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* LOGO */}
        <View style={styles.logo}>
          <Image
            source={require("../assets/images/icon.png")}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              marginTop: 20,
              marginBottom: 10,
            }}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Security Verification</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit secure code sent to your registered device for SNOW
          FOUNTAIN CONSULTANTS access.
        </Text>

        {/* OTP INPUTS */}
        <Animated.View
          style={[
            styles.otpContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.otpBox, error && { borderColor: "#EF4444" }]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
        </Animated.View>

        {/* ERROR */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* TIMER */}
        {timer > 0 ? (
          <Text style={styles.timerText}>
            Resend code in{" "}
            <Text style={styles.bold}>
              0:{timer < 10 ? `0${timer}` : timer}
            </Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={resendOtp}>
            <Text style={styles.resend}>Resend Code</Text>
          </TouchableOpacity>
        )}

        {/* VERIFY BUTTON */}
        <TouchableOpacity style={styles.button} onPress={VERIFYOTP}>
          {isverifying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
             <Text style={styles.buttonText}>VERIFY & SECURE ACCESS →</Text>)
            }
         
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerifyOTP;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFF",
  },
  container: {
    padding: 24,
    alignItems: "center",
  },

  logoBox: {
    width: 90,
    height: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
  },
  logoLine: {
    width: 28,
    height: 3,
    backgroundColor: "#2563EB",
    marginTop: 6,
    borderRadius: 2,
  },
  resend: {
    marginTop: 10,
    color: "#2563EB",
    fontWeight: "600",
  },
  error: {
    marginTop: 15,
    color: "#EF4444",
    fontWeight: "600",
  },
  title: {
    marginTop: 30,
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  otpContainer: {
    flexDirection: "row",
    marginTop: 30,
  },
  otpBox: {
    width: 57,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 12,
    marginHorizontal: 6,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
  },

  timerWrapper: {
    alignItems: "center",
    marginTop: 28,
  },
  timerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 20,
  },
  resendText: {
    marginTop: 10,
    color: "#64748B",
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },

  button: {
    marginTop: 50,
    backgroundColor: "#1D4ED8",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  footer: {
    flexDirection: "row",
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
  },
  sep: {
    marginHorizontal: 10,
    color: "#CBD5E1",
  },

  version: {
    marginTop: 10,
    fontSize: 11,
    color: "#94A3B8",
  },
});
