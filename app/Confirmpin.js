import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState,useEffect } from "react";
import { useSelector,useDispatch } from "react-redux";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import {
  useAdminconfirmPinMutation,
  useAdminforgotPinMutation,useUserConfirmPinMutation,useUserForgotPinMutation,
} from "../src/services/apiSlice";

const Confirmpinscreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);

  const inputRefs = useRef([]);

  const [confirmPin] = useAdminconfirmPinMutation();
  const [forgotPin] = useAdminforgotPinMutation();
const [userConfirmPin, isLoadingUserConfirmPin] = useUserConfirmPinMutation();
const [userForgotPin] = useUserForgotPinMutation();

const role = useSelector((state) => state.auth.role);
const token = useSelector((state) => state.auth.token);
const user = useSelector((state) => state.auth.user);


// useEffect(() => {
//   if (!token || !user) {
//     router.replace("/EnterMobile");
//   }
// }, [token, user]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      const newPin = [...pin];

      if (newPin[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }

      newPin[index] = "";
      setPin(newPin);
    }
  };

const handleConfirm = async () => {
  const pinValue = pin.join("");

  if (pinValue.length !== 4) {
    Alert.alert("Error", "Please enter a 4-digit PIN.");
    return;
  }

  try {
    if (role === "admin") {
      await confirmPin({ pin: pinValue }).unwrap();
    } else if (role === "user") {
      await userConfirmPin({ pin: pinValue }).unwrap();
    } else {
      throw new Error("Invalid role");
    }

    Toast.show({
      type: "success",
      text1: "Success",
      text2: "PIN confirmed successfully!",
    });

    router.replace("/(Dashboard)");
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error?.data?.message || "PIN mismatch",
    });
  } finally {
    setPin(["", "", "", ""]);
  }
};

  const handleForgotPin = () => {
    Alert.alert("Forgot PIN", "Your PIN will be permanently deleted", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        style: "destructive",
        onPress: async () => {
          try {
            if (role === "admin") {
              await forgotPin().unwrap();
            } else if (role === "user") {
              await userForgotPin().unwrap();
            } else {
              throw new Error("Invalid role");
            }

            // 🔥 Clear only the PIN_CREATED flag (keep role/token intact)
            await AsyncStorage.removeItem("PIN_CREATED");

            Toast.show({
              type: "success",
              text1: "PIN Deleted",
              text2: "Create a new PIN",
            });

            router.replace("/Pincreated");
          } catch (error) {
            console.log("Forgot PIN Error:", error);

            if (error?.data?.message === "No PIN found") {
              // 🔥 Clear only the PIN_CREATED flag (keep role/token intact)
              await AsyncStorage.removeItem("PIN_CREATED");

              Toast.show({
                type: "info",
                text1: "No PIN Found",
                text2: "Creating new PIN...",
              });

              router.replace("/Pincreated");
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.data?.message || "Failed to delete PIN",
              });
            }
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Center Content */}
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="lock-closed" size={38} color="#1976d2" />
        </View>

        <Text style={styles.title}>Confirm your PIN</Text>
        <Text style={styles.subtitle}>
          Enter your new PIN again to confirm.
        </Text>

        {/* PIN Boxes */}
        <View style={styles.pinRow}>
          {pin.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.pinBox,
                index === pin.findIndex((v) => v === "") && styles.activeBox,
              ]}
              value={digit}
              keyboardType="number-pad"
              inputMode="numeric"
              pattern="[0-9]*" 
              maxLength={1}
              secureTextEntry={!showPin}
              onChangeText={(v) => handleChange(v, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
          <TouchableOpacity onPress={() => setShowPin(!showPin)}>
            <Ionicons
              name={showPin ? "eye-off" : "eye"}
              size={20}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleForgotPin}>
          <Text style={styles.RestPin}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Button */}
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Confirmpinscreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 120,
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 36,
  },
  pinRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  pinBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    fontSize: 20,
    textAlign: "center",
  },
  activeBox: {
    borderColor: "#1976d2",
  },
  button: {
    backgroundColor: "#1976d2",
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  RestPin: {
    color: "#1976d2",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
  },
  RestPin1: {
    fontWeight: "600",
    marginTop: 20,
  },
});
