import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetDocumentWithCategoriesQuery } from "../../../src/services/apiSlice";
import { useRouter } from "expo-router";

const ProjectBluePrint = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { data: documentCategoriesData, refetch } =
    useGetDocumentWithCategoriesQuery({});
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      if (isActive) {
        refetch();
      }
      return () => {
        isActive = false;
      };
    }, [refetch]),
  );

  // 🔒 Prevent Screenshots
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const enableSecure = async () => {
        try {
          if (Platform.OS === "android") {
            await ScreenCapture.preventScreenCaptureAsync();
          }
        } catch (e) {
          console.log("❌ Screen capture prevent error:", e);
        }
      };

      enableSecure();

      return () => {
        if (isActive) {
          ScreenCapture.allowScreenCaptureAsync().catch(() => {});
          isActive = false;
        }
      };
    }, []),
  );

  const onRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refetch(); // RTK Query
    } catch (e) {
      console.log("REFRESH ERROR", e);
    } finally {
      setRefreshing(false);
    }
  };
  // Filter documents based on search query
  const allDocuments = documentCategoriesData?.documents || [];
  const filteredDocuments = allDocuments.filter((d) => {
    if (!searchQuery || searchQuery.trim() === "") return true;
    return (d.docName || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      {/* <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
      </View> */}

      {/* sub Project List - scrollable grid (2 columns) */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefreshAll} />
        }
      >
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/DrinkingWater")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons name="water" size={26} color="#1976D2" />
            </View>
            <Text style={styles.categoryName}>Drinking Water</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Sewage_Treatment")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons name="pipe" size={26} color="#1976D2" />
            </View>
            <Text style={styles.categoryName}>Sewage Treatment Plant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Storm_Water")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="weather-rainy"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>Storm Water</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Used_Water_Management")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="water-sync"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>Used Water Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("(Dashboard)/AllDocuments/River_Front")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="terrain"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>River Front</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Soil_Testing")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="flask-outline"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>Soil Testing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Transport_Sector")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="road-variant"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>Transport Sector</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              router.replace("/(Dashboard)/AllDocuments/Housing_Slum")
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
              <MaterialCommunityIcons
                name="home-group"
                size={26}
                color="#1976D2"
              />
            </View>
            <Text style={styles.categoryName}>Housing & Slum</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Button */}
      {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity> */}

      {/* Add Document Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContainer}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add New Document</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Document Name */}
            <Text style={styles.label}>DOCUMENT NAME</Text>
            <View style={styles.inputBox}>
              <Text style={styles.placeholder}>
                Enter file name (e.g., Q4 Report)
              </Text>
            </View>

            {/* Attach Document */}
            <Text style={styles.label}>ATTACH DOCUMENT</Text>
            <TouchableOpacity style={styles.uploadBox}>
              <View style={styles.cloudIcon}>
                <Ionicons name="cloud-upload" size={26} color="#2563EB" />
              </View>

              <Text style={styles.uploadTitle}>Tap to select a file</Text>
              <Text style={styles.uploadSub}>PDF, DOCX, XLSX up to 50MB</Text>
            </TouchableOpacity>

            {/* Selected File */}
            <View style={styles.fileCard}>
              <View style={styles.fileLeft}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text" size={20} color="#2563EB" />
                </View>

                <View>
                  <Text style={styles.fileName}>Q4_Financial_Strategy.pdf</Text>
                  <Text style={styles.fileMeta}>1.2 MB · READY</Text>
                </View>
              </View>

              <Ionicons name="close" size={18} color="#94A3B8" />
            </View>

            {/* Upload Button */}
            <TouchableOpacity style={styles.uploadBtn}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload to Vault</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProjectBluePrint;

/* -------- Styles -------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    marginTop: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingVertical: 0,
    borderRadius: 20,
  },
  infoText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  backText: {
    fontSize: 16,
    color: "#969696",
    marginLeft: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },

  subTitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  fileMeta: {
    fontSize: 12,
    color: "#64748B",
    marginRight: 8,
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  secureText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 4,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },

  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 14,
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
    marginTop: 10,
  },

  inputBox: {
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  placeholder: {
    color: "#94A3B8",
    fontSize: 14,
  },

  uploadBox: {
    marginTop: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: "center",
  },

  cloudIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  uploadTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  uploadSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },

  fileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D7AF3",
    height: 54,
    borderRadius: 16,
    marginTop: 22,
  },

  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  cancelText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    color: "#64748B",
  },
});