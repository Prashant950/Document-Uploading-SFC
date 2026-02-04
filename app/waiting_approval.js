import { useLocalSearchParams, useRouter } from "expo-router";
import { use, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useGetUserProfileStatusQuery,
  useSubmitUserProfileMutation,
  useAdminApproveUserMutation,
} from "../src/services/apiSlice";
import { useCallback, useEffect } from "react";
const WaitingApproval = () => {
  const router = useRouter();
  const { mobileNumber } = useLocalSearchParams();
  const [localMobile, setLocalMobile] = useState(mobileNumber || "");
  // 🔹 change this to true when admin approves
  const [isApproved, setIsApproved] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [submitUserProfile, { data, isLoading, error }] =
    useSubmitUserProfileMutation();

  const { data: statusData, refetch } = useGetUserProfileStatusQuery(
    localMobile,
    { skip: !localMobile },
  );

  // Poll approval status and update UI when admin approves
  useEffect(() => {
    if (!statusData) return;
    const approved =
      statusData?.approved === true ||
      statusData?.isApproved === true ||
      (typeof statusData?.status === "string" &&
        statusData.status.toLowerCase() === "approved") ||
      (typeof statusData?.message === "string" &&
        statusData.message.toLowerCase().includes("approved"));

    if (approved && !isApproved) {
      setIsApproved(true);
      setSubmitted(true);
      Toast.show({
        type: "success",
        text1: "Approved",
        text2: "Your account has been approved by admin.",
      });
    }
  }, [statusData, isApproved]);

  // Re-fetch status periodically while waiting (stops after approved)
  useEffect(() => {
    if (!localMobile || isApproved) return;
    const id = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(id);
  }, [localMobile, isApproved, refetch]);

  const [
    adminApproveUser,
    {
      data: approveData,
      refetch: refetchApprovals,
      isLoading: isApproveLoading,
      error: approveError,
    },
  ] = useAdminApproveUserMutation();

  useFocusEffect(
    useCallback(() => {
      let interval;
      if (submitted) {
        // Poll every 10 seconds
        interval = setInterval(() => {
          console.log("Checking approval status...");
          refetch();
        }, 10000);
      }
      return () => clearInterval(interval);
    }, [submitted]),
  );

  useEffect(() => {
    if (statusData?.status === "approved") {
      setIsApproved(true);
    } else if (statusData?.status === "expired") {
      setIsExpired(true);
    }
  });

  // Submit name+mobile to backend to create the pending user record
  const submitUserInfo = async () => {
    if (!name || !localMobile) {
      Toast.show({ type: "error", text1: "Error", text2: "Name is required" });
      return;
    }

    try {
      setIsUploading(true);
      console.log("Submitting user payload:", {
        name,
        mobileNumber: localMobile,
      });
      await submitUserProfile({ name, mobileNumber: localMobile }).unwrap();
      Toast.show({
        type: "success",
        text1: "Submitted",
        text2: "Awaiting Admin Authorization",
      });
      setSubmitted(true);
      setName("");
    } catch (err) {
      console.log("Submit User Error:", err);

      // Friendly handling for backend 404 "User not found"
      if (
        err?.status === 404 &&
        err?.data?.message?.toLowerCase().includes("user not found")
      ) {
        Toast.show({
          type: "error",
          text1: "User Not Found",
          text2:
            "Session expired or mobile number not found. Please re-verify your mobile.",
        });
        // Optionally navigate back to EnterMobile so the user can retry
        // router.replace('/EnterMobile');
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err?.message || err?.data?.message || "Failed to submit",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="shield-check" size={24} color="#2563eb" />
          <Text style={styles.headerText}>SNOW FOUNTAIN CONSULTANTS</Text>
        </View>

        {/* Card - Only show if submitted */}
        {submitted && (
          <View
            style={[
              styles.card,
              { backgroundColor: isApproved ? "#22c55e" : "#f59e0b" },
            ]}
          >
            <View style={styles.iconCircle}>
              <Icon
                name={isApproved ? "check" : "clock-outline"}
                size={36}
                color={isApproved ? "#22c55e" : "#f59e0b"}
              />
            </View>

            <Text style={styles.cardTitle}>
              {isApproved ? "Access Approved!" : "Awaiting Admin Authorization"}
            </Text>

            <Text style={styles.cardDesc}>
              {isApproved
                ? "Your request has been authorized by the administrator. You can now explore the corporate vault."
                : "Your request has been sent to the administrator. Please wait for approval."}
            </Text>
          </View>
        )}
        <View style={styles.content}>
          {/* User Info - Only show if NOT submitted */}
          {!submitted && (
            <View style={styles.infoCard}>
              <Text style={[styles.headerText, { marginBottom: 8 }]}>
                User Information
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={[styles.input, { backgroundColor: "#f3f4f6" }]}
                placeholder="Mobile Number"
                value={localMobile}
                editable={false}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={submitUserInfo}
              >
                <Text style={styles.primaryButtonText}>
                  Submit & Await Approval
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Status Pills */}
        {submitted && (
          <View style={styles.pills}>
            <View style={styles.pill}>
              <Icon name="lock" size={16} color="#16a34a" />
              <Text style={styles.pillText}>Vault 092-B</Text>
            </View>

            <View style={styles.pill}>
              <Icon
                name={isApproved ? "check-circle" : "alert-circle"}
                size={16}
                color={isApproved ? "#16a34a" : "#ca8a04"}
              />
              <Text style={styles.pillText}>
                {isApproved ? "Identity Verified" : "Pending Verification"}
              </Text>
            </View>
          </View>
        )}
        {submitted && (
          <View style={styles.pills}>
            {!isApproved && (
              <Text style={styles.footerText}>
                Authorization expires in 24 hours
              </Text>
            )}
          </View>
        )}

        {/* Button */}
        {submitted && (
          <TouchableOpacity
            disabled={!isApproved}
            style={[styles.button, { opacity: isApproved ? 1 : 0.5 }]}
            onPress={() => console.log("Go to Dashboard")}
          >
            <Text style={styles.buttonText}>CONTINUE → </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default WaitingApproval;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 30,
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
    flex: 1,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  pills: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
   
    
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  infoCardCompact: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: "flex-start",
  },

  primaryButton: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 28,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    
  },

  iconCircle: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },

  cardDesc: {
    fontSize: 14,
    color: "#ecfeff",
    textAlign: "center",
    lineHeight: 22,
  },

  pills: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 0,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 60,
  },

  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  button: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  footerText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 10,
    
  },
  button: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

 
  
});
