import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { useCallback, useDebugValue, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import * as ScreenCapture from "expo-screen-capture";
import * as Sharing from "expo-sharing";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  useAdminUploadDocumentMutation,
  useGetDocumentWithCategoriesQuery,useAdminDocumentDeleteMutation,
} from "../../../src/services/apiSlice";

import { BACKEND_IP, BACKEND_PORT } from "../../../src/config";
import { useSelector } from "react-redux";
const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

const used_Water_Management = () => {
  const role = useSelector((state) => state.auth.role);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [docKey, setDocKey] = useState("FINANCIAL_ADVISORY"); // default document type
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
   const [loadingAction, setLoadingAction] = useState(null);

  const [adminUploadDocument, { isLoadingDocument, error }] =
    useAdminUploadDocumentMutation();
  const { data: documentCategoriesData, refetch } =
    useGetDocumentWithCategoriesQuery({ docKey: "FINANCIAL_ADVISORY" });
    const [deleteDocument] = useAdminDocumentDeleteMutation({});


  // download progress tracker in toast
  let lastProgress = 0;

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

  // helper to format date strings safely
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
  const getDocIcon = (mimeType = "") => {
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

  // Filter documents based on search query
  const allDocuments = documentCategoriesData?.documents || [];
  const filteredDocuments = allDocuments.filter((d) => {
    if (!searchQuery || searchQuery.trim() === "") return true;
    return (d.docName || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
  });

  const closeMenu = () => {
    setActionVisible(false);
    setActionItem(null);
  };

  /* ---------- Pick File ---------- */
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled) {
        setFiles((prev) => [...prev, ...res.assets]);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open document picker");
    }
  };

  /* ---------- Upload ---------- */
  const handleUpload = async () => {
    if (!docName?.trim()) {
      Toast.show({ type: "error", text1: "Document name required" });
      return;
    }

    if (!docKey) {
      Toast.show({ type: "error", text1: "Document type required" });
      return;
    }

    if (!Array.isArray(files) || files.length === 0) {
      Toast.show({ type: "error", text1: "Please select files" });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();

      formData.append("docName", docName.trim());
      formData.append("docKey", docKey || "FINANCIAL_ADVISORY");

      files.forEach((f, index) => {
        if (!f?.uri) return;
        formData.append("files", {
          uri: f.uri,
          name: f.name || `file_${index}`,
          type: f.type || f.mimeType || "application/octet-stream",
        });
      });

      const response = await adminUploadDocument(formData).unwrap();

      Toast.show({
        type: "success",
        text1: "Upload Success",
        text2: `${response.count} document(s) uploaded`,
      });

      setFiles([]);
      setDocName("");
      setDocKey("FINANCIAL_ADVISORY");
      setModalVisible(false);
    } catch (err) {
      console.log("❌ Upload error FULL:", err);

      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: err?.data?.message || err?.error || "Something went wrong",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
  // Share Documents
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

  // const handleRenameDocument = async (doc) => {
  //   try {
  //     if (!doc?._id) {
  //       Toast.show({ type: "error", text1: "Invalid document" });
  //       return;
  //     }

  //     setLoadingAction({ type: "rename", id: doc._id });

  //     // Rename logic here

  //     setLoadingAction(null);
  //   } catch (error) {
  //     console.log("❌ Rename error:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Rename failed",
  //     });
  //     setLoadingAction(null);
  //   }
  // };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={18}
          color="#94A3B8"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ===== Count Files Info ===== */}
      <View style={styles.infoPill}>
        <Text style={styles.infoText}>{filteredDocuments.length} Files</Text>
      </View>

      {/* Add Document btn */}
     {role !== "user" && (
             <TouchableOpacity
               style={styles.fab}
               onPress={() => setModalVisible(true)}
             >
               <Ionicons name="add" size={28} color="#fff" />
             </TouchableOpacity>
           )}

      {/* ================= MODAL Document Upload ================= */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Document</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Document Name */}
            <Text style={styles.label}>DOCUMENT NAME</Text>
            <TextInput
              placeholder="Enter file name (e.g., Q4 Report)"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={docName}
              onChangeText={setDocName}
            />

            {/* Attach */}
            <Text style={styles.label}>ATTACH DOCUMENT</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={pickFile}
              disabled={isUploading}
            >
              <Ionicons name="cloud-upload-outline" size={28} color="#2563EB" />
              <Text style={styles.uploadText}>
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : "Tap to select files"}
              </Text>
              <Text style={styles.uploadSub}>PDF, DOCX, XLSX up to 50MB</Text>
            </TouchableOpacity>

            {/* Selected Files List */}
            {files.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {files.map((f, idx) => (
                  <View key={f.uri + idx} style={styles.filePreview}>
                    <MaterialIcons
                      name="description"
                      size={24}
                      color="#2563EB"
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {(f.size / 1024 / 1024).toFixed(2)} MB · READY
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        setFiles((s) => s.filter((_, i) => i !== idx))
                      }
                      disabled={isUploading}
                    >
                      <Ionicons name="close-circle" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Upload */}
            <TouchableOpacity
              style={[styles.uploadBtn, isUploading && { opacity: 0.6 }]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.uploadBtnText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={styles.uploadBtnText}> Upload Document</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
                    name={getDocIcon(actionItem?.contentType || "").name}
                    size={40}
                    color={getDocIcon(actionItem?.contentType || "").color}
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
              <Text style={styles.actionText}>Download to Vault</Text>
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

      {/* ================= Backed Data of Financial Advisory in FlatList ================= */}
      <SafeAreaView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 0 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefreshAll} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No documents yet</Text>
              <Text style={styles.emptySubText}>
                Upload files to get started
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const icon = getDocIcon(item.contentType);
            return (
              <View style={styles.card}>
                {/* LEFT ICON */}
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name={icon.name}
                    size={36}
                    color={icon.color}
                  />
                </View>

                {/* CENTER CONTENT */}
                <View style={styles.content}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.docName}
                  </Text>
                  <Text style={styles.meta}>
                    {" "}
                    Uploaded :{" "}
                    {formatDate(item.createdAt || item.updatedAt || item.date)}
                  </Text>
                  <Text style={styles.subMeta}>
                    {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>

                {/* RIGHT THREE DOT MENU */}
                <TouchableOpacity
                  style={styles.menuBtn}
                  onPress={() => openMenu(item)}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

export default used_Water_Management;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 10,
    marginTop: 0,
  },

  searchIcon: {
    marginRight: 8,
    color: "#94A3B8",
  },
  infoPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 20,
    marginBottom: 0,
    marginLeft: 16,
    marginTop: 0,
  },
  infoText: {
    color: "#64748b",
    fontWeight: "600",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    zIndex: 999,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  modalWrapper: {
    bottom: 0,
    width: "100%",
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  label: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    borderColor: "#a3aab3",
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 15,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 20,
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  meta: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  subMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  menuBtn: {
    padding: 6,
  },
  uploadText: {
    marginTop: 8,
    fontWeight: "600",
  },

  uploadSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },

  fileName: {
    fontWeight: "600",
  },

  fileSize: {
    fontSize: 12,
    color: "#64748B",
  },

  uploadBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },

  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  cancel: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#334155",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  uploadBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },

  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  cancel: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 14,
    fontWeight: "600",
  },

  cancel: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 14,
    fontWeight: "600",
  },

  cancel: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 14,
    fontWeight: "600",
  },

  cancel: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 14,
    fontWeight: "600",
  },
});
