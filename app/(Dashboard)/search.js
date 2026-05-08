import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { BACKEND_IP, BACKEND_PORT } from "../../src/config";
import {
  useAdminRenameDocumentMutation,
  useAdminDocumentDeleteMutation,
  useGetDocumentWithCategoriesQuery,
} from "../../src/services/apiSlice";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

const Search = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDropdownValue, setCategoryDropdownValue] = useState(null);
  const [subCategoryDropdownValue, setSubCategoryDropdownValue] =
    useState(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: documentsData,
    error,
    isLoading,
    refetch,
  } = useGetDocumentWithCategoriesQuery({});

  const [renameDocument] = useAdminRenameDocumentMutation();
  const [deleteDocument] = useAdminDocumentDeleteMutation();

  const openMenu = (item) => {
    setActionItem(item);
    setActionVisible(true);
  };

  const closeMenu = () => {
    setActionVisible(false);
    setActionItem(null);
  };
  const getMimeType = (name, fallback) => {
    const ext = name.split(".").pop()?.toLowerCase();

    const mimeTypes = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
    };

    return mimeTypes[ext] || fallback || "application/octet-stream";
  };
  // VIEW DOCUMENT

  // const handleViewDocument = async () => {
  //   try {
  //     setLoadingAction("view");
  //     setActionVisible(false);
  //     const token = await AsyncStorage.getItem("token");

  //     // Ensure filename contains an extension
  //     let fileName = actionItem.originalName || `document_${Date.now()}`;
  //     if (!fileName.includes(".") && actionItem.mimeType) {
  //       const ext = actionItem.mimeType.split("/")[1] || "pdf";
  //       fileName = `${fileName}.${ext}`;
  //     }

  //     const fileUri = FileSystem.cacheDirectory + fileName;
  //     const viewUrl = `${API_BASE_URL}/admin/view/${actionItem._id}?token=${token}`;

  //     // Download file using modern API
  //     await FileSystem.downloadAsync(viewUrl, fileUri);

  //     // Convert file:// URI to content:// URI on Android
  //     let launchUri = fileUri;
  //     if (Platform.OS === "android") {
  //       try {
  //         const contentUri = await FileSystem.getContentUriAsync(fileUri);
  //         launchUri = contentUri;
  //       } catch (e) {
  //         console.log("Could not get content URI, using file URI:", e);
  //       }
  //     }

  //     await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
  //       data: launchUri,
  //       flags: 1,
  //       type: actionItem.mimeType || "application/octet-stream",
  //     });

  //     Toast.show({
  //       type: "success",
  //       text1: "Document opened",
  //     });
  //   } catch (error) {
  //     console.log("❌ View document error:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Unable to open document",
  //       text2: "Please try again",
  //     });
  //   } finally {
  //     setLoadingAction(null);
  //   }
  // };

  const handleViewDocument = async () => {
    try {
      setLoadingAction("view");
      setActionVisible(false);

      const token = await AsyncStorage.getItem("token");

      let fileName = actionItem.originalName || `document_${Date.now()}`;

      // extension add if missing
      if (!fileName.includes(".")) {
        const ext = actionItem.mimeType?.split("/")[1] || "pdf";

        fileName = `${fileName}.${ext}`;
      }

      const fileUri = FileSystem.cacheDirectory + fileName;

      const viewUrl = `${API_BASE_URL}/admin/view/${actionItem._id}?token=${token}`;

      console.log("Downloading from:", viewUrl);

      // DOWNLOAD FILE
      const downloadRes = await FileSystem.downloadAsync(viewUrl, fileUri);

      console.log("Downloaded:", downloadRes.uri);

      const mimeType = getMimeType(fileName, actionItem.mimeType);

      // ANDROID
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(downloadRes.uri);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
      }

      // IOS
      else {
        await Sharing.shareAsync(downloadRes.uri);
      }

      // Toast.show({
      //   type: "success",
      //   text1: "Document opened",
      // });
    } catch (error) {
      console.log("❌ View document error:", error);

      Toast.show({
        type: "error",
        text1: "Unable to open document",
        text2: "No supported app found",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // SHARE DOCUMENT
  const handleShareDocument = async () => {
    try {
      if (!actionItem?._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }

      setLoadingAction("share");
      setActionVisible(false);
      const token = await AsyncStorage.getItem("token");

      // Secure view URL with token
      const fileUrl = `${API_BASE_URL}/admin/view/${actionItem._id}?token=${token}`;

      // Temp file path
      const fileUri =
        FileSystem.cacheDirectory +
        (actionItem.originalName || `document-${Date.now()}`);

      // Download temporarily (required for native share)
      const downloadedFile = await FileSystem.downloadAsync(fileUrl, fileUri);

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: "error",
          text1: "Sharing not supported on this device",
        });
        return;
      }

      // Open native share sheet
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: actionItem.mimeType,
        dialogTitle: "Share Document",
        UTI: actionItem.mimeType,
      });

      // Toast.show({
      //   type: "success",
      //   text1: "Document shared",
      // });
    } catch (error) {
      console.log("❌ Share document error:", error);
      Toast.show({
        type: "error",
        text1: "Unable to share document",
        text2: "Please try again",
      });
    } finally {
      setLoadingAction(null);
    }
  };
  // DOWNLOAD DOCUMENT
  // let lastProgress = 0;

  // const handleDownloadDocument = async (doc) => {
  //   try {
  //     if (!doc?._id) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Invalid document",
  //       });
  //       return;
  //     }

  //     setActionVisible(false);

  //     const token = await AsyncStorage.getItem("token");

  //     const downloadUrl = `${API_BASE_URL}/admin/download/${doc._id}?token=${token}`;

  //     let fileName =
  //       doc.originalName || `document-${Date.now()}`;

  //     // Add extension if missing
  //     if (!fileName.includes(".") && doc.contentType) {
  //       const ext = doc.contentType.split("/")[1];
  //       fileName += `.${ext}`;
  //     }

  //     const fileUri = FileSystem.cacheDirectory + fileName;

  //     Toast.show({
  //       type: "info",
  //       text1: "Downloading started...",
  //     });

  //     // Download using modern FileSystem API (createDownloadResumable is deprecated)
  //     const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);

  //     // ANDROID SAVE
  //     if (Platform.OS === "android") {
  //       const permission =
  //         await MediaLibrary.requestPermissionsAsync();

  //       if (!permission.granted) {
  //         Toast.show({
  //           type: "error",
  //           text1: "Storage permission denied",
  //         });
  //         return;
  //       }

  //       const asset =
  //         await MediaLibrary.createAssetAsync(uri);

  //       await MediaLibrary.createAlbumAsync(
  //         "Download",
  //         asset,
  //         false
  //       );
  //     }

  //     Toast.show({
  //       type: "success",
  //       text1: "Download completed",
  //     });

  //     lastProgress = 0;

  //   } catch (error) {
  //     console.log("❌ Download error:", error);

  //     Toast.show({
  //       type: "error",
  //       text1: "Download failed",
  //     });

  //     lastProgress = 0;
  //   }
  // };
const handleDownloadDocument = async (doc) => {
  try {

    console.log("DOCUMENT:", doc);

    // FIXED
    const documentId = doc?._id;

    console.log("Document ID:", documentId);

    if (!documentId) {
      Toast.show({
        type: "error",
        text1: "Document ID missing",
      });
      return;
    }

    const token = await AsyncStorage.getItem("token");

    // API URL
    const downloadUrl =
      `${API_BASE_URL}/admin/download/${documentId}?token=${token}`;

    // FILE NAME
    let fileName =
      doc.originalName ||
      `document_${Date.now()}`;

    // EXTENSION FIX
    if (!fileName.includes(".")) {

      const ext =
        doc.mimeType?.split("/")[1] || "pdf";

      fileName = `${fileName}.${ext}`;
    }

    // SAVE PATH
    const fileUri =
      FileSystem.documentDirectory + fileName;

    Toast.show({
      type: "info",
      text1: "Downloading...",
    });

    // DOWNLOAD
    const result =
      await FileSystem.downloadAsync(
        downloadUrl,
        fileUri
      );

    console.log("Downloaded:", result);

    // OPEN SHARE SHEET
    await Sharing.shareAsync(result.uri);

    Toast.show({
      type: "success",
      text1: "Download completed",
    });

  } catch (error) {

    console.log("❌ Download error:", error);

    Toast.show({
      type: "error",
      text1: "Download failed",
      text2: error.message,
    });
  }
};

  // DELETE DOCUMENT
  const handleDeleteDocument = async () => {
    try {
      if (!actionItem?._id) {
        Toast.show({ type: "error", text1: "Invalid document" });
        return;
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Toast.show({ type: "error", text1: "Not authenticated" });
        return;
      }

      Alert.alert(
        "Delete Document",
        `Are you sure you want to delete "${actionItem.docName}"?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              try {
                setLoadingAction("delete");
                await deleteDocument({ id: actionItem._id, token }).unwrap();

                Toast.show({
                  type: "success",
                  text1: "Document deleted",
                  text2: "Document removed successfully",
                });

                setActionVisible(false);
                await refetch();
              } catch (error) {
                console.log("❌ Delete error:", error);
                Toast.show({
                  type: "error",
                  text1: "Delete Failed",
                  text2: error?.data?.message || "Please try again",
                });
              } finally {
                setLoadingAction(null);
              }
            },
            style: "destructive",
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.log("❌ Delete error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      });
    }
  };

  // RENAME DOCUMENT
  const handleRenameDocument = () => {
    setNewDocName(actionItem?.docName || "");
    setRenameModalVisible(true);
  };

  const confirmRename = async () => {
    try {
      if (!newDocName.trim()) {
        Toast.show({ type: "error", text1: "Please enter a document name" });
        return;
      }

      setLoadingAction("rename");
      await renameDocument({
        id: actionItem._id,
        docName: newDocName,
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Document renamed",
        text2: `Renamed to ${newDocName}`,
      });

      setRenameModalVisible(false);
      closeMenu();
      await refetch();
    } catch (err) {
      console.error("Rename error:", err);
      Toast.show({
        type: "error",
        text1: "Rename Failed",
        text2: err?.data?.message || "Please try again",
      });
    } finally {
      setLoadingAction(null);
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
  // Get unique categories from documents
  const categoryOptions = useMemo(() => {
    const allDocs = documentsData?.documents || [];
    const uniqueCategories = [...new Set(allDocs.map((doc) => doc.docKey))];
    return uniqueCategories
      .filter(Boolean)
      .map((key) => ({
        label: key.replace(/_/g, " "),
        value: key,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [documentsData]);

  // Get sub-categories (documents) based on selected category
  const subCategoryOptions = useMemo(() => {
    if (!selectedCategory) return [];
    const allDocs = documentsData?.documents || [];
    const filtered = allDocs.filter((doc) => doc.docKey === selectedCategory);
    return filtered
      .map((doc) => ({
        label: doc.docName,
        value: doc._id,
        docKey: doc.docKey,
        originalName: doc.originalName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedCategory, documentsData]);

  // Get all filtered documents
  const filteredDocuments = useMemo(() => {
    let docs = documentsData?.documents || [];

    // Check if any filter is active
    const hasActiveFilters = selectedCategory || selectedSubCategory || searchQuery.trim();

    // Filter by category
    if (selectedCategory) {
      docs = docs.filter((doc) => doc.docKey === selectedCategory);
    }

    // Filter by sub-category (specific document)
    if (selectedSubCategory) {
      docs = docs.filter((doc) => doc._id === selectedSubCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(
        (doc) =>
          doc.docName?.toLowerCase().includes(query) ||
          doc.originalName?.toLowerCase().includes(query) ||
          doc.docKey?.toLowerCase().includes(query),
      );
    }

    // If no filters are active, show only 10 most recent documents
    // Otherwise show all matching documents
    if (!hasActiveFilters) {
      docs = docs.slice(0, 10);
    }

    return docs;
  }, [selectedCategory, selectedSubCategory, searchQuery, documentsData]);

  const handleApplyFilters = () => {
    if (filteredDocuments.length === 0) {
      Toast.show({
        type: "info",
        text1: "No documents found",
        text2: "Try adjusting your filters",
      });
    }
    setFilterVisible(false);
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setCategoryDropdownValue(null);
    setSubCategoryDropdownValue(null);
    setSearchQuery("");
    setFilterVisible(false);
  };

  const DocumentItem = ({ item }) => (
    <View style={styles.documentCard}>
      <View style={styles.docIconContainer}>
        <MaterialCommunityIcons
          name={getDocIcon(item.mimeType).name}
          size={24}
          color={getDocIcon(item.mimeType).color}
        />
      </View>
      <View style={styles.docContent}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {item.docName}
        </Text>
        {/* <Text style={styles.docSubtitle}>
          {item.originalName || item.docKey}
        </Text> */}
        <Text style={styles.docMeta}>{item.docKey?.replace(/_/g, " ")}</Text>
      </View>
      {/* <Ionicons name="chevron-forward" size={20} color="#94A3B8" /> */}
      {/* three dots */}
      <TouchableOpacity onPress={() => openMenu(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* SEARCH BAR */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#fff" />
          {(selectedCategory || selectedSubCategory) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {(selectedCategory ? 1 : 0) + (selectedSubCategory ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* RESULTS COUNT */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {filteredDocuments.length} documents
        </Text>
        {(selectedCategory || selectedSubCategory || searchQuery.trim()) && (
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* LOADING STATE */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        )}

        {/* ERROR STATE */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color="#dc2626" />
            <Text style={styles.errorText}>Failed to load documents</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !error && filteredDocuments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>No documents found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}

        {/* DOCUMENTS LIST */}
        {!isLoading && !error && filteredDocuments.length > 0 && (
          <FlatList
            scrollEnabled={false}
            data={filteredDocuments}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <DocumentItem item={item} />}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>

      {/* Modal after click Three Dots like Rename, Move, Delete options with action handlers */}
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
                    name={getDocIcon(actionItem?.mimeType || "").name}
                    size={40}
                    color={getDocIcon(actionItem?.mimeType || "").color}
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
              onPress={handleViewDocument}
              style={styles.actionRow}
              disabled={loadingAction === "view"}
            >
              {loadingAction === "view" ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <Ionicons name="eye-outline" size={22} color="#334155" />
              )}
              <Text style={styles.actionText}>View Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleShareDocument}
              disabled={loadingAction === "share"}
            >
              {loadingAction === "share" ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <Ionicons name="share-outline" size={22} color="#334155" />
              )}
              <Text style={styles.actionText}>Secure Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleDownloadDocument(actionItem)}
              disabled={isDownloading || loadingAction === "download"}
            >
              {isDownloading || loadingAction === "download" ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <Ionicons name="download-outline" size={22} color="#334155" />
              )}
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleRenameDocument}
              disabled={loadingAction === "rename"}
            >
              {loadingAction === "rename" ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <Ionicons name="pencil-outline" size={22} color="#334155" />
              )}
              <Text style={styles.actionText}>Rename File</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleDeleteDocument}
              disabled={loadingAction === "delete"}
            >
              {loadingAction === "delete" ? (
                <ActivityIndicator color="#ef4444" />
              ) : (
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              )}
              <Text style={[styles.actionText, { color: "#ef4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= RENAME MODAL ================= */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setRenameModalVisible(false)}
        />
        <View style={styles.renameModalCenter}>
          <View style={styles.renameModalContent}>
            <Text style={styles.renameModalTitle}>Rename Document</Text>
            <TextInput
              style={styles.renameInput}
              placeholder="Enter new document name"
              placeholderTextColor="#94A3B8"
              value={newDocName}
              onChangeText={setNewDocName}
              editable={loadingAction !== "rename"}
            />

            <View style={styles.renameButtonRow}>
              <TouchableOpacity
                style={styles.cancelRenameBtn}
                onPress={() => setRenameModalVisible(false)}
                disabled={loadingAction === "rename"}
              >
                <Text style={styles.cancelRenameBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRenameBtn}
                onPress={confirmRename}
                disabled={loadingAction === "rename"}
              >
                {loadingAction === "rename" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmRenameBtnText}>Rename</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= FILTER MODAL ================= */}
      <Modal visible={filterVisible} transparent={false} animationType="slide">
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Filter Documents</Text>
          <Text style={styles.sheetSubTitle}>SNOW FOUNTAIN CONSULTANTS</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {/* CATEGORY DROPDOWN */}
            <Text style={styles.label}>CATEGORY</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={categoryOptions}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
              value={categoryDropdownValue}
              onChange={(item) => {
                setCategoryDropdownValue(item.value);
                setSelectedCategory(item.value);
                setSelectedSubCategory(null);
                setSubCategoryDropdownValue(null);
              }}
              renderLeftIcon={() => (
                <MaterialCommunityIcons
                  style={styles.icon}
                  color="#1976D2"
                  name="folder-outline"
                  size={20}
                />
              )}
            />

            {/* SUB-CATEGORY DROPDOWN */}
            {selectedCategory && (
              <>
                <Text style={styles.label}>SUB-CATEGORY (Document Name)</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={subCategoryOptions}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select document..."
                  searchPlaceholder="Search documents..."
                  value={subCategoryDropdownValue}
                  onChange={(item) => {
                    setSubCategoryDropdownValue(item.value);
                    setSelectedSubCategory(item.value);
                  }}
                  renderLeftIcon={() => (
                    <MaterialCommunityIcons
                      style={styles.icon}
                      color="#1976D2"
                      name="file-document-outline"
                      size={20}
                    />
                  )}
                />
              </>
            )}

            {/* RESULTS PREVIEW */}
            {filteredDocuments.length > 0 && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>
                  {filteredDocuments.length} document(s) match
                </Text>
              </View>
            )}
          </ScrollView>

          {/* APPLY BUTTON */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>

          {/* RESET */}
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Search;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#0F172A",
  },

  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalWrapper: {
    bottom: 0,
    width: "100%",
    justifyContent: "flex-end",
    position: "absolute",
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
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  resultInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  clearText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },

  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 12,
  },

  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
    marginTop: 12,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 8,
  },

  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E0EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  docContent: {
    flex: 1,
  },

  docTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  docSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  docMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },

  /* ===== MODAL ===== */

  filterScrollContent: {
    paddingBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  sheetSubTitle: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 6,
    letterSpacing: 0.8,
    fontWeight: "500",
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dropdown: {
    height: 50,
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },

  icon: {
    marginRight: 8,
  },

  placeholderStyle: {
    fontSize: 14,
    color: "#94A3B8",
  },

  selectedTextStyle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },

  iconStyle: {
    width: 20,
    height: 20,
  },

  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    paddingHorizontal: 12,
  },

  previewContainer: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },

  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },

  applyBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  applyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  resetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    textAlign: "center",
    paddingVertical: 12,
  },

  /* ===== RENAME MODAL ===== */
  renameModalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  renameModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  renameModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },

  renameInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
  },

  renameButtonRow: {
    flexDirection: "row",
    gap: 12,
  },

  cancelRenameBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelRenameBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  confirmRenameBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmRenameBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* ===== ACTION MODAL ===== */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
});
