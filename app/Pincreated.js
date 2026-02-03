import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import {
  useAdminpincreateMutation,
  useAdminPinexistQuery,useUserCreatePinMutation,
} from "../src/services/apiSlice";
import { useSelector } from "react-redux";

export default function index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectedRef = useRef(false);

  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const pinRefs = useRef([]);
  const confirmRefs = useRef([]);
  const [securePin, setSecurePin] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  // Loading state when creating PIN
  const [creatingPin, setCreatingPin] = useState(false);

  const [createPin, isLoadingPIN] = useAdminpincreateMutation();
  const { data, isLoading, refetch, isError } = useAdminPinexistQuery();

  const [userCreatePin, isLoadingUserCreatePin] = useUserCreatePinMutation();


  const role = useSelector((state) => state.auth.role);
  // useEffect(() => {
  //   if (isLoading || !data) return;
  //   if (redirectedRef.current) return;

  //   redirectedRef.current = true;

  //   if (data.exists) {
  //     // 🔐 PIN already created → ask for confirm PIN
  //     router.replace("/Confirmpin");
  //   } else {
  //     // ✅ No PIN → stay on index.js (Create PIN UI)
  //     // ❌ DO NOTHING (already on index)
  //   }
  // }, [data, isLoading]);

  // useEffect(() => {
  //   if (isLoading || !data) return;
  //   if (redirectedRef.current) return;

  //   redirectedRef.current = true;

  //   if (data.exists) {
  //     router.replace("/Confirmpin");
  //   }
  // }, [data, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

const sucessfullycreated = async () => {
  const pinValue = pin.join("");
  const confirmPinValue = confirmPin.join("");

  if (pinValue.length !== 4 || confirmPinValue.length !== 4) {
    Toast.show({ type: "error", text1: "PIN must be 4 digits" });
    return;
  }

  if (pinValue !== confirmPinValue) {
    Toast.show({ type: "error", text1: "PINs do not match" });
    return;
  }

  try {
    setCreatingPin(true);

    // 🔥 ROLE BASED API CALL
    if (role === "admin") {
      await createPin({ pin: pinValue }).unwrap();
    } else if (role === "user") {
      await userCreatePin({ pin: pinValue }).unwrap();
    } else {
      throw new Error("Invalid role");
    }

    await AsyncStorage.setItem("PIN_CREATED", "true");

    Toast.show({
      type: "success",
      text1: "Success",
      text2: "PIN created successfully",
    });

    router.replace("/Confirmpin");
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error?.data?.message || error.message || "Failed to create PIN",
    });
  } finally {
    setCreatingPin(false);
    setPin(["", "", "", ""]);
    setConfirmPin(["", "", "", ""]);
  }
};


  const handleChange = (value, index, type) => {
    if (!/^\d?$/.test(value)) return;

    const newPin = type === "pin" ? [...pin] : [...confirmPin];
    newPin[index] = value;

    type === "pin" ? setPin(newPin) : setConfirmPin(newPin);

    if (value && index < 3) {
      (type === "pin" ? pinRefs : confirmRefs).current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index, type) => {
    if (e.nativeEvent.key === "Backspace") {
      const newPin = type === "pin" ? [...pin] : [...confirmPin];

      if (newPin[index] === "" && index > 0) {
        (type === "pin" ? pinRefs : confirmRefs).current[index - 1]?.focus();
      }

      newPin[index] = "";
      type === "pin" ? setPin(newPin) : setConfirmPin(newPin);
    }
  };

  const renderBoxes = (values, refs, type, secure) => (
    <View style={styles.pinRow}>
      <View style={styles.pinBoxesContainer}>
        {values.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => (refs.current[i] = r)}
            style={[
              styles.pinBox,
              i !== values.length - 1 && { marginRight: 14 },
            ]}
            value={digit}
            keyboardType="number-pad"
            secureTextEntry={secure}
            maxLength={1}
            onChangeText={(v) => handleChange(v, i, type)}
            onKeyPress={(e) => handleKeyPress(e, i, type)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.content, styles.card]}>
        <Text style={styles.title}>Set up your PIN</Text>
        <Text style={styles.subtitle}>
          This PIN will be used to access your account.
        </Text>

        <Text style={styles.label}>Enter 4-digit PIN</Text>
        {renderBoxes(pin, pinRefs, "pin", securePin)}

        <Text style={[styles.label, { marginTop: 24 }]}>Confirm PIN</Text>
        {renderBoxes(confirmPin, confirmRefs, "confirm", secureConfirm)}

        {/* View icon (top-right of card) */}
        <TouchableOpacity
          style={styles.topRightEye}
          onPress={() => {
            setSecurePin((s) => !s);
            setSecureConfirm((s) => !s);
          }}
          accessibilityLabel="Toggle PIN visibility"
        >
          <Ionicons
            name={securePin && secureConfirm ? "eye-off" : "eye"}
            size={20}
            color="#2563EB"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ position: "absolute", bottom: 120, right: 16 }}
          onPress={() => router.push("/Confirmpin")}
          accessible
          accessibilityRole="link"
        >
          <Text style={styles.RestPin}>Already have PIN?</Text>
        </TouchableOpacity>
      </View>

      {/** form validation */}
      <TouchableOpacity
        style={[
          styles.button,
          (creatingPin ||
            !(
              pin.join("").length === 4 && pin.join("") === confirmPin.join("")
            )) && { opacity: 0.6 },
        ]}
        onPress={sucessfullycreated}
        disabled={
          creatingPin ||
          !(pin.join("").length === 4 && pin.join("") === confirmPin.join(""))
        }
      >
        {creatingPin ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create PIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 40,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0f172a",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0f172a",
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  RestPin: {
    color: "#1976d2",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
  },
  pinBox: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e6edf3",
    backgroundColor: "#fff",
    fontSize: 20,
    textAlign: "center",
    color: "#0f172a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  visibilityButton: {
    marginLeft: 12,
    padding: 8,
  },
  topRightEye: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    backgroundColor: "#1976d2",
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
