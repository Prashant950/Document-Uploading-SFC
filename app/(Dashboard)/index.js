import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Alert,
  Modal,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useDispatch } from "react-redux";
import { logout } from "../../src/features/authSlice";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useAdminApproveUserMutation,
  useAdminDocumentDeleteMutation,
  useCheckApprovalQuery,
  useGetDocumentWithCategoriesQuery,useGetUserNameQuery,
} from "../../src/services/apiSlice";

import { BACKEND_IP, BACKEND_PORT } from "../../src/config";
const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

// download progress tracker in toast
let lastProgress = 0;
const Index = () => {

const role = useSelector((state) => state.auth.role);

  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const { data: documentCategoriesData, refetch } =
    useGetDocumentWithCategoriesQuery({ docKey: "FINANCIAL_ADVISORY" });

  const redirectclientStrategies = () => {
    router.push("/(Dashboard)/AllDocuments/ClientStrategies");
  };
  const redirectfinancialAdvisory = () => {
    router.push("/(Dashboard)/AllDocuments/FinacialAdvisory");
  };
  const redirectprojectBluePrint = () => {
    router.push("/(Dashboard)/AllDocuments/ProjectBluePrint");
  };

  const [deleteDocument] = useAdminDocumentDeleteMutation({});
  const [approveUser] = useAdminApproveUserMutation();
  const {
    data: approvalData,
    isLoading: isLoadingApprovals,
    refetch: refetchApprovals,
  } = useCheckApprovalQuery();

  // Strategy documents (client strategies)
  const { data: strategyDocumentsData, refetch: refetchStrategies } =
    useGetDocumentWithCategoriesQuery({});
  const { data: profileData } = useGetUserNameQuery();

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

  // Extract and format documents
  const formatDate = (val) => {
    if (!val) return "Unknown";
    try {
      return new Date(val).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Unknown";
    }
  };
  const getBgForIcon = (mimeType = "") => {
    if (mimeType.includes("pdf")) {
      return { name: "file-pdf-box", color: "#dc2626" };
    }

    if (mimeType.includes("word")) {
      return { name: "file-word-box", color: "#2563eb" };
    }

    if (mimeType.includes("excel")) {
      return { name: "file-excel-box", color: "#16a34a" };
    }

    if (mimeType.includes("image")) {
      return { name: "file-image", color: "#7c3aed" }; // ✅ VALID
    }
    if (mimeType.includes("powerpoint")) {
      return { name: "file-powerpoint-box", color: "#ea580c" };
    }
    if (mimeType.includes("text")) {
      return { name: "file-document-outline", color: "#475569" };
    }
    if (mimeType.includes("video")) {
      return { name: "file-video", color: "#ef4444" };
    }
    if (mimeType.includes("audio")) {
      return { name: "file-audio", color: "#ef4444" };
    }
    if (mimeType.includes("archive")) {
      return { name: "file-zip-box", color: "#ef4444" };
    }
    return { name: "file-document-outline", color: "#475569" };
  };

  // Refresh handler
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

  const openMenu = (item) => {
    setActionItem(item);
    setActionVisible(true);
  };
  const closeMenu = () => {
    setActionVisible(false);
  };

  // Filter documents based on search query
  const allDocuments = documentCategoriesData?.documents || [];
  const filteredDocuments = allDocuments.filter((d) => {
    if (!searchQuery || searchQuery.trim() === "") return true;
    return (d.docName || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
  });

  const strategyDocuments = Array.isArray(strategyDocumentsData)
    ? strategyDocumentsData
    : strategyDocumentsData?.documents || strategyDocumentsData?.data || [];

  const displayDocuments =
    searchQuery.trim() === "" ? allDocuments : filteredDocuments;

  // Get recent 10 documents sorted by date (raw)
  const rawRecent = [...displayDocuments]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.createdAtAt || b.createdAt) -
        new Date(a.createdAt || a.createdAtAt || a.createdAt),
    )
    .slice(0, 10);

  // Format documents for rendering (icon, bg, date, name)
  const formatForList = (docs) =>
    (docs || []).map((doc) => {
      const mime = (doc.mimeType || doc.contentType || "")
        .toString()
        .toLowerCase();
      const icon = getBgForIcon(mime || (doc.fileName || "").toLowerCase());
      return {
        id: doc._id || doc.id || doc.name || Math.random().toString(),
        name: doc.docName || doc.name || doc.fileName || "Untitled",
        date: formatDate(doc.createdAt || doc.createdAtAt || doc.createdAt),
        fileCount: doc.fileCount || 1,
        icon: icon.name,
        color: icon.color,
        bg: getBgForIcon(icon.name),
        raw: doc,
      };
    });

  const recentDocuments = formatForList(rawRecent);
  const searchResults = formatForList(filteredDocuments);

  const requests = approvalData?.notifications || [];

  // View Documents
  const handleViewDocument = async (doc) => {
    try {
      if (!doc || !doc._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }
      // Close the action modal immediately so returning from external viewers
      setActionVisible(false);

      const token = await AsyncStorage.getItem("token");

      // Ensure filename contains an extension so Android can resolve a viewer
      let fileName = doc.originalName || `document_${Date.now()}`;
      if (!fileName.includes(".") && doc.contentType) {
        const ext = doc.contentType.split("/")[1] || "pdf";
        fileName = `${fileName}.${ext}`;
      }

      const fileUri = FileSystem.cacheDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_BASE_URL}/admin/view/${doc._id}?token=${token}`,
        fileUri,
      );

      const { uri } = await downloadResumable.downloadAsync();

      // On Android, convert file:// URI to a content:// URI so other apps can read it
      let launchUri = uri;
      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(uri);
          launchUri = contentUri;
        } catch (e) {
          console.log(
            "Could not get content URI, falling back to file URI:",
            e,
          );
        }
      }

      const action = IntentLauncher.ACTION_VIEW || "android.intent.action.VIEW";
      await IntentLauncher.startActivityAsync(action, {
        data: launchUri,
        flags: 1,
        type: doc.contentType || "application/octet-stream",
      });
    } catch (error) {
      console.log("❌ View document error:", error);
      Toast.show({
        type: "error",
        text1: "Unable to open document",
      });
    }
  };
  // Shared Documents
  const handleShareDocument = async (doc) => {
    try {
      if (!doc?._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }
      setActionVisible(false);
      const token = await AsyncStorage.getItem("token");

      // 🔐 Secure view URL
      const fileUrl = `${API_BASE_URL}/admin/view/${doc._id}?token=${token}`;

      // 📂 Temp file path
      const fileUri =
        FileSystem.cacheDirectory +
        (doc.originalName || `document-${Date.now()}`);

      // ⬇️ Download temporarily (required for native share)
      const downloadedFile = await FileSystem.downloadAsync(fileUrl, fileUri);

      // ❌ Sharing not available
      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: "error",
          text1: "Sharing not supported on this device",
        });
        return;
      }

      // 📤 OPEN NATIVE SHARE SHEET
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: doc.contentType,
        dialogTitle: "Share Document",
        UTI: doc.contentType, // iOS support
      });
    } catch (error) {
      console.log("❌ Share document error:", error);
      Toast.show({
        type: "error",
        text1: "Unable to share document",
      });
    }
  };
  // Download Documents
  const handleDownloadDocument = async (doc) => {
    try {
      if (!doc?._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }

      setActionVisible(false);

      const token = await AsyncStorage.getItem("token");
      const downloadUrl = `${API_BASE_URL}/admin/download/${doc._id}?token=${token}`;

      const fileName = doc.originalName || `document-${Date.now()}`;

      const fileUri = FileSystem.cacheDirectory + fileName;

      Toast.show({
        type: "info",
        text1: "Downloading started...",
      });

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (progress) => {
          const percent = Math.round(
            (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) *
              100,
          );

          // 🔕 Avoid too many toasts
          if (percent - lastProgress >= 10) {
            lastProgress = percent;
            Toast.show({
              type: "info",
              text1: `Downloading... ${percent}%`,
            });
          }
        },
      );

      const { uri } = await downloadResumable.downloadAsync();

      // ✅ ANDROID SAVE TO DOWNLOADS
      if (Platform.OS === "android") {
        const permission = await MediaLibrary.requestPermissionsAsync();

        if (!permission.granted) {
          Toast.show({
            type: "error",
            text1: "Storage permission denied",
          });
          return;
        }

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      }

      Toast.show({
        type: "success",
        text1: "Download completed",
      });

      lastProgress = 0;
    } catch (error) {
      console.log("❌ Download error:", error);
      Toast.show({
        type: "error",
        text1: "Download failed",
      });
      lastProgress = 0;
    }
  };
  // Delete Documents
  const handleDeleteDocument = async (doc) => {
    try {
      if (!doc?._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }

      setLoadingAction({ type: "delete", id: doc._id });

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Toast.show({ type: "error", text1: "Not authenticated" });
        setLoadingAction(null);
        return;
      }
      Alert.alert(
        "Delete Document",
        "Are you sure you want to delete this document?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              await deleteDocument({ id: doc._id, token }).unwrap();
              Toast.show({
                type: "success",
                text1: "Document deleted successfully",
              });
              setLoadingAction(null);
              setActionVisible(false); // 🔥 close modal after delete

              await refetch(); // RTK Query
            },
          },
        ],
        { cancelable: false },
      );

      setLoadingAction(null);
      setActionVisible(false); // 🔥 close modal after delete
    } catch (error) {
      // RTK Query throws an object like { status, data } for HTTP errors.
      console.log("❌ Delete error:", error);
      try {
        console.log("Full error:", JSON.stringify(error, null, 2));
      } catch (e) {}

      const serverMessage =
        (error && error.data && error.data.message) ||
        error?.error ||
        "Delete failed";
      const statusCode = error?.status || (error?.originalStatus ?? null);

      Toast.show({
        type: "error",
        text1: `Delete failed${statusCode ? ` (${statusCode})` : ""}`,
        text2: serverMessage,
      });

      setLoadingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={searchQuery.length === 0 ? recentDocuments : searchResults}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefreshAll}
        ListHeaderComponent={
          <>
            {/* ===== Header ===== */}
            <View style={styles.header}>
              <View style={styles.logoSection}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.logo}
                />
                <View>
                  <Text style={styles.adminText}>{profileData?.name?.toUpperCase()} CONTROL</Text>
                  <Text style={styles.welcomeText}>
                    {/* Welcome, {userNameData?.name || "Admin"} */}
                    Welcome{profileData?.name ? `, ${profileData?.name}` : ""}
                  </Text>
                </View>
              </View>

              {/* //  logout button */}
              <View style={styles.headerRight}>
                {role !== "user" && (
                <TouchableOpacity
                  style={styles.notification}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#111827"
                  />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
                )}
                

                <TouchableOpacity
                  style={{ marginTop: 8, marginLeft: 30,marginRight: -10,marginBottom: 7 }}
                  onPress={async () => {
                    try {
                      await AsyncStorage.removeItem("token");
                      await AsyncStorage.removeItem("role");
                      await AsyncStorage.removeItem("PIN_CREATED");

                      // clear redux state
                      dispatch(logout());

                      Toast.show({
                        type: "success",
                        text1: "Logged out",
                        text2: "You have been signed out",
                      });

                      router.replace("/EnterMobile");
                    } catch (err) {
                      Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: "Failed to log out",
                      });
                    }
                  }}
                >
                  <Ionicons name="power" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }} />
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#A1A1AA" />
              <TextInput
                style={styles.input}
                placeholder="Search"
                placeholderTextColor="#A1A1AA"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
            </View>

            {/* ===== Categories ===== */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Categories</Text>
            </View>

            <View style={styles.grid}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={redirectclientStrategies}
              >
                <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
                  <MaterialCommunityIcons
                    name="strategy"
                    size={26}
                    color="#2563eb"
                  />
                </View>
                <Text style={styles.categoryName}>Client Strategies</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={redirectfinancialAdvisory}
              >
                <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
                  <MaterialCommunityIcons
                    name="currency-usd"
                    size={26}
                    color="#16a34a"
                  />
                </View>
                <Text style={styles.categoryName}>Financial Advisory</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={redirectprojectBluePrint}
              >
                <View style={[styles.iconBox, { backgroundColor: "#ffedd5" }]}>
                  <MaterialCommunityIcons
                    name="compass-outline"
                    size={26}
                    color="#ea580c"
                  />
                </View>
                <Text style={styles.categoryName}>Project Blueprints</Text>
                <Text style={styles.fileCount}>All Projects</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
                  <MaterialCommunityIcons
                    name="file-chart-outline"
                    size={26}
                    color="#6366f1"
                  />
                </View>
                <Text style={styles.categoryName}>Consultant Reports</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <View style={[styles.iconBox, { backgroundColor: "#ccfbf1" }]}>
                  <MaterialCommunityIcons
                    name="file-sign"
                    size={26}
                    color="#0f766e"
                  />
                </View>
                <Text style={styles.categoryName}>Contracts</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <View style={[styles.iconBox, { backgroundColor: "#f3e8ff" }]}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={26}
                    color="#9333ea"
                  />
                </View>
                <Text style={styles.categoryName}>HR Records</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <View style={[styles.iconBox, { backgroundColor: "#f3f4f6" }]}>
                  <MaterialCommunityIcons
                    name="folder-outline"
                    size={26}
                    color="#374151"
                  />
                </View>
                <Text style={styles.categoryName}>Other Documents</Text>
                <View style={styles.infoPill}>
                  <Text style={styles.infoText}>
                    {filteredDocuments.length} Files
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ===== Recent / Search Results (FlatList) ===== */}
            <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
              {searchQuery.length === 0
                ? `Recent Documents (${recentDocuments.length})`
                : `Search Results (${searchResults.length})`}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.documentCard}>
            <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={item.color}
              />
            </View>

            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.docMeta}>
                {item.date} · {item.fileCount} file
                {item.fileCount > 1 ? "s" : ""}
              </Text>
            </View>

            {/* Right three dot button */}
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => openMenu(item.raw || item)}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyDocContainer}>
            <Ionicons name="document-outline" size={40} color="#ccc" />
            <Text style={styles.emptyDocText}>
              {searchQuery.length === 0
                ? "No documents available"
                : "No documents found"}
            </Text>
          </View>
        )}
      />

      {/* ===== Pending Requests Modal ===== */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* ❌ Close Button */}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>

            {/* ✅ TITLE */}
            <Text style={styles.modalTitle}>
              {requests.length} Pending Access Request(s)
            </Text>

            {/* ✅ CONTENT */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {requests.length > 0 ? (
                requests.map((item, index) => {
                  const user = item.userId;

                  return (
                    <View key={item._id} style={styles.card}>
                      {/* Header */}
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons
                          name="account-plus-outline"
                          size={26}
                          color="#2563eb"
                        />
                        <Text style={styles.cardTitle}>
                          Access Request {index + 1}
                        </Text>

                        <View style={styles.newBadge}>
                          <Text style={styles.newText}>NEW</Text>
                        </View>
                      </View>

                      {/* User Name */}
                      <Text style={styles.userName}>{user?.name || "NA"}</Text>

                      {/* Phone + OTP badge */}
                      <View style={styles.phoneRow}>
                        <Ionicons
                          name="call-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text style={styles.phoneText}>
                          {user?.mobileNumber || "NA"}
                        </Text>

                        <View style={styles.otpBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#16a34a"
                          />
                          <Text style={styles.otpText}> OTP VERIFIED</Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={async () => {
                            try {
                              await approveUser(user._id).unwrap();

                              Toast.show({
                                type: "success",
                                text1: "Approved",
                                text2: `${user?.name} access approved`,
                              });

                              refetchApprovals(); // 🔥 IMPORTANT
                              setModalVisible(false);
                            } catch (err) {
                              Toast.show({
                                type: "error",
                                text1: "Error",
                                text2:
                                  err?.data?.message || "Failed to approve",
                              });
                            }
                          }}
                        >
                          <Text style={styles.approveText}>Approve Access</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.declineBtn}>
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>
                  No pending access requests
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*  threen dot Action Bottom Sheet for file menu */}
      <Modal
        visible={actionVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ marginRight: 12 }}>
                  <MaterialCommunityIcons
                    name={getBgForIcon(actionItem?.contentType || "").name}
                    size={40}
                    color={getBgForIcon(actionItem?.contentType || "").color}
                  />
                </View>
                <View>
                  <Text
                    style={{ fontSize: 18, fontWeight: "700" }}
                    numberOfLines={1}
                  >
                    {actionItem?.docName ||
                      actionItem?.originalName ||
                      "Document"}
                  </Text>
                  <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                    {(actionItem?.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeMenu}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleViewDocument(actionItem)}
              style={styles.actionRow}
            >
              <Ionicons name="eye-outline" size={22} color="#334155" />
              <Text style={styles.actionText}>View Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                handleShareDocument(actionItem);
              }}
            >
              <Ionicons name="lock-closed" size={22} color="#334155" />
              <Text style={styles.actionText}>Secure Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                handleDownloadDocument(actionItem);
              }}
            >
              <Ionicons name="download-outline" size={22} color="#334155" />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                /* rename */
              }}
            >
              <Ionicons name="pencil-outline" size={22} color="#334155" />
              <Text style={styles.actionText}>Rename File</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                handleDeleteDocument(actionItem);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.actionText, { color: "#ef4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
    marginTop: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFF",
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#334155",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoPill: {
    marginTop: 6,
    alignSelf: "flex-start",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    topmargin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  modalWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  adminText: {
    fontSize: 12,
    color: "#6b7280",
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    paddingBottom: 5,
  },
  menuBtn: {
    padding: 6,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginRight: 16,
    alignItems: "center",
    marginRight: 16,

  },
  notification: {
    position: "relative",
    marginLeft: 12,
    
  },
  encryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  encryptedText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
    marginLeft: 6,
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
    marginTop: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#111827",
    paddingTop: 8,
    paddingBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  notification: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },

  /* Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  phoneText: {
    color: "#6b7280",
    fontSize: 14,
  },
  otpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  otpText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },
  approveText: {
    color: "#fff",
    fontWeight: "600",
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  declineText: {
    color: "#374151",
    fontWeight: "600",
  },

  /* Categories */
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    marginTop: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAll: {
    color: "#2563eb",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  fileCount: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  noDataText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  docMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyDocContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    flex: 1,
  },
  emptyDocText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  docMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  emptyDocText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  docMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  noDataText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyDocText: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  docMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  noDataText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  },

});
