import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";
const Index = () => {
  const router = useRouter();

  // useEffect(() => {
  //   // Delay navigation slightly to ensure Root Layout's navigator is mounted
  //   const id = setTimeout(() => {
  //     router.replace("/verifyOTP");
  //   }, 50);
  //   return () => clearTimeout(id);
  // }, []);

 
  const redirectEnterMobile = () => {
    router.push("/EnterMobile");
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>SFC</Text>
          <View style={styles.logoUnderline} />
        </View>

        {/* TITLE */}
        <Text style={styles.title}>SNOW FOUNTAIN</Text>
        <Text style={styles.subTitle}>CONSULTANTS</Text>

        {/* TAGLINE */}
        <Text style={styles.tagline}>
          LEADING STRATEGIC INNOVATION{"\n"}& SPECIALIZED CONSULTING
        </Text>

        {/* SECURITY BADGE */}
        <View style={styles.securityBadge}>
          <Text style={styles.securityText}>
            🔒 SECURED BY SNOW FOUNTAIN CONSULTANTS
          </Text>
        </View>

        {/* PROTECTED ASSETS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>• PROTECTED ASSETS</Text>

          <View style={styles.assetRow}>
            {/* Left Icon */}
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#1D4ED8"
              style={styles.leftIcon}
            />

            {/* Text */}
            <View style={styles.assetText}>
              <Text style={styles.assetTitle}>
                Encrypted Consultant Reports
              </Text>
              <Text style={styles.assetDesc}>
                End-to-end encrypted strategic insights
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.assetRow}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#1D4ED8"
              style={styles.leftIcon}
            />

            {/* Text Content */}
            <View style={styles.assetText}>
              <Text style={styles.assetTitle}>
                Secured Clients Data & Trade Secrets
              </Text>
              <Text style={styles.assetDesc}>
                Protection for proprietary business intelligence
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.assetRow}>
            {/* Left Icon */}
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#1D4ED8"
              style={styles.leftIcon}
            />

            {/* Text */}
            <View style={styles.assetText}>
              <Text style={styles.assetTitle}>
                Classified Projects Documentation
              </Text>
              <Text style={styles.assetDesc}>
                Access-controlled sensitive infrastructure data
              </Text>
            </View>
          </View>
        </View>

        {/* VERIFICATION TEXT */}
        <Text style={styles.verifyText}>
          To access your company's vault, please verify your identity.
        </Text>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={redirectEnterMobile}>
          <Text style={styles.buttonText}>GET STARTTED TO ACCESS APP →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFF",
  },
  scrollContainer: {
    padding: 10,
    paddingBottom: 40,
  },

  logoBox: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
  },
  logoUnderline: {
    width: 28,
    height: 3,
    backgroundColor: "#1D4ED8",
    marginTop: 6,
    borderRadius: 2,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    marginTop: 20,
    color: "#0F172A",
  },
  subTitle: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  leftIcon: {
    marginRight: 12,
  },

  assetText: {
    flex: 1,
  },

  assetTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  assetDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  lock: {
    fontSize: 18,
    marginLeft: 10,
  },

  tagline: {
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 10,
    color: "#64748B",
  },

  securityBadge: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#E0ECFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  securityText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginTop: 25,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  outerBorder: {
    margin: 12,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#1D4ED8",
    backgroundColor: "#FFFFFF",
    padding: 2,
  },
  innerBorder: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },

  assetRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#E0ECFF",
    borderRadius: 8,
  },
  assetText: {
    flex: 1,
    marginLeft: 12,
  },
  assetTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  assetDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  lock: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  verifyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#475569",
    marginTop: 30,
    fontWeight: "bold",
  },

  inputLabel: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    elevation: 2,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#1D4ED8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
  },
  footerSeparator: {
    marginHorizontal: 8,
    color: "#CBD5E1",
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
  },
});
