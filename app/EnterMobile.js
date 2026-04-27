import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRequestOTPMutation } from "../src/services/apiSlice";

const EnterMobile = () => {
  const [mobileNumber, setmobileNumber] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const [requestOTP, { isLoading }] = useRequestOTPMutation();
  const[iscontinue,setiscontinue]=useState(false);

  const handleMobileChange = (value) => {
    // Only numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length <= 10) {
      setmobileNumber(numericValue);
      setError("");
    }

    // Auto close keyboard when 10 digits entered
    if (numericValue.length === 10) {
      Keyboard.dismiss();
    }
  };

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setiscontinue(true);
      const data = await requestOTP({ mobileNumber: mobileNumber }).unwrap();
      console.log("OTP API RESPONSE:", data);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "OTP sent to your mobile number.",
      });

      // Navigate to OTP verification screen with mobile number
      router.push({
        pathname: "/verifyOTP",
        params: { mobileNumber: mobileNumber },
      });
    } catch (err) {
      console.log("OTP API ERROR:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to request OTP",
      });
    }
  };

  const isValid = mobileNumber.length === 10;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logo}>
         <Image
                           source={require("../assets/images/icon.png")}
                           style={{ width: 80, height: 80, borderRadius: 20,marginTop:30,marginBottom:30 }}
                         />
        </View>

        {/* Title */}
        <Text style={styles.title}>SNOW FOUNTAIN CONSULTANTS</Text>
        <Text style={styles.subtitle}>
          We will send you a One Time Password (OTP) to verify your number.
        </Text>


        {/* Mobile Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>MOBILE NUMBER</Text>

          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryText}>+91</Text>
            </View>

            <TextInput
              ref={inputRef}
              value={mobileNumber}
              onChangeText={handleMobileChange}
              placeholder="00000 00000"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={10}
              onChange={setmobileNumber}
              style={styles.input}
              placeholderTextColor="#C7CCD3"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, { opacity: isValid ? 1 : 0.5 }]}
          disabled={!isValid}
          onPress={handleContinue}
        >
          {iscontinue ? (<ActivityIndicator color="#FFFFFF" />) :
          (
          <Text style={styles.buttonText}>CONTINUE ➜</Text>
         )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🔐 MILITARY-GRADE</Text>
          <Text style={styles.footerText}>🛡️ PRIVACY FIRST</Text>
        </View>

        <Text style={styles.footerSmall}>
          Secure Infrastructure • ISO 27001 Certified Environment
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EnterMobile;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 40,
  },

  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
  },

  brand: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subBrand: {
    fontSize: 12,
    letterSpacing: 2,
    color: "#64748B",
    marginBottom: 30,
  },

  securityBox: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lockIcon: {
    fontSize: 36,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },

  inputSection: {
    width: "100%",
    marginBottom: 25,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
    color: "#475569",
  },
  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    height: 56,
    alignItems: "center",
  },
  countryCode: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  countryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
  },

  error: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 6,
  },

  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#1D4ED8",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  footer: {
    flexDirection: "row",
    gap: 20,
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
  },
  footerSmall: {
    marginTop: 8,
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
});
