import { useRouter,useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import {
  useCreatePinMutation,
  usePinexistQuery,
} from "../src/services/apiSlice";

export default function index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectedRef = useRef(false);


  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const pinRefs = useRef([]);
  const confirmRefs = useRef([]);

  const [createPin] = useCreatePinMutation();
  const { data, isLoading,refetch, isError } = usePinexistQuery();


useEffect(() => {
  if (isLoading || !data) return;
  if (redirectedRef.current) return;

  redirectedRef.current = true;

  if (data.exists) {
    // 🔐 PIN already created → ask for confirm PIN
    router.replace("/Confirmpin");
  } else {
    // ✅ No PIN → stay on index.js (Create PIN UI)
    // ❌ DO NOTHING (already on index)
  }
}, [data, isLoading]);


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

    if (pinValue.length < 4 || confirmPinValue.length < 4) {
      Alert.alert("Error", "Please enter a 4-digit PIN.");
      return;
    }

    if (pinValue !== confirmPinValue) {
      Alert.alert("Error", "PINs do not match. Please try again.");
      return;
    }

    try {
      await createPin({ pin: pinValue }).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "PIN created successfully!",
      });

      router.replace("/Pincreated");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create PIN. Please try again.",
      });
    }
    setPin(["", "", "", ""]);
    setConfirmPin(["", "", "", ""]);
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

  const renderBoxes = (values, refs, type) => (
    <View style={styles.pinRow}>
      {values.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => (refs.current[i] = r)}
          style={styles.pinBox}
          value={digit}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(v) => handleChange(v, i, type)}
          onKeyPress={(e) => handleKeyPress(e, i, type)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set up your PIN</Text>
        <Text style={styles.subtitle}>
          This PIN will be used to access your account.
        </Text>

        <Text style={styles.label}>Enter 4-digit PIN</Text>
        {renderBoxes(pin, pinRefs, "pin")}

        <Text style={[styles.label, { marginTop: 24 }]}>Confirm PIN</Text>
        {renderBoxes(confirmPin, confirmRefs, "confirm")}
      </View>

      <TouchableOpacity style={styles.button} onPress={sucessfullycreated}>
        <Text style={styles.buttonText}>Create PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 15,
    marginBottom: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
  },
  pinRow: {
    flexDirection: "row",
    gap: 14,
  },
  pinBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: "#d1d5db",
    fontSize: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1976d2",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
