import { MaterialIcons ,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react"; 
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import {
  useAdminUploadDocumentMutation,
  useGetDocumentWithCategoriesQuery,
  useAdminDocumentDeleteMutation,
  useAdminRenameDocumentMutation,
} from "../../../src/services/apiSlice";

const CategoryDocuments = () => {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams();
  const token = useSelector((state) => state.auth.token);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [files, setFiles] = useState([]);
  const [docName, setDocName] = useState("");

  // API hooks
  const {
    data: documentsData,
    refetch,
    isLoading,
  } = useGetDocumentWithCategoriesQuery({
    docKey: Array.isArray(categoryId) ? categoryId[0] : categoryId,
  });

  const [uploadDocument, { isLoading: isUploading }] =
    useAdminUploadDocumentMutation();

  const [deleteDocument, { isLoading: isDeleting }] =
    useAdminDocumentDeleteMutation();

  const [renameDocument, { isLoading: isRenaming }] =
    useAdminRenameDocumentMutation();

  // Get current category name from categoryId (decode if needed)
  const categoryName = decodeURIComponent(
    Array.isArray(categoryId) ? categoryId[0] : categoryId,
  );

  // Filtered documents
  const filteredDocuments = (documentsData?.documents || []).filter((doc) => {
    const matchesSearch =
      doc.docName &&
      doc.docName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      doc.category === categoryName || doc.docKey === categoryId;
    return matchesSearch && matchesCategory;
  });

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled) {
        const selectedFiles = (res.assets || []).map((asset) => ({
          uri: asset.fileCopyUri || asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || asset.type || "application/octet-stream",
          size: asset.size,
        }));

        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open document picker");
    }
  };

  // Upload document
  const handleUploadDocument = async () => {
    try {
      // Validate inputs
      if (!files || files.length === 0) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please select a file to upload",
          position: "bottom",
        });
        return;
      }

      if (!docName.trim()) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please enter a document name",
          position: "bottom",
        });
        return;
      }

      if (!categoryId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Category ID is missing",
          position: "bottom",
        });
        return;
      }

      // ✅ Validate file URIs before upload
      const invalidFiles = files.filter((f) => !f?.uri);
      if (invalidFiles.length > 0) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `${invalidFiles.length} file(s) have invalid paths`,
          position: "bottom",
        });
        return;
      }

      const formData = new FormData();

    // ✅ Important fields
    formData.append("docName", docName.trim());

    // 🔥 KEY CHANGE → docKey = folder/category name
    formData.append("docKey", categoryName);

    // ✅ Append multiple files
    files.forEach((f, index) => {
      if (!f?.uri) return;

      formData.append("files", {
        uri: f.uri, // ✅ Use URI directly - don't add file:// prefix
        name: f.name || `document_${index}.pdf`,
        type: f.mimeType || f.type || "application/pdf", // ✅ Better fallback
      });
    });

    console.log("📤 Uploading:", {
      docName: docName.trim(),
      docKey: categoryName,
      filesCount: files.length,
      firstFileUri: files[0]?.uri?.substring(0, 50),
    });

    // Upload ALL files in ONE request
    const response = await uploadDocument(formData).unwrap();

      Toast.show({
      type: "success",
      text1: "Upload Success",
      text2: `${response.count} document(s) uploaded`,
    });

        // Clear form and close modal
       setFiles([]);
    setDocName("");
    setModalVisible(false);

    // 🔄 Refresh list
    setTimeout(() => {
      refetch();
    }, 300);

  } catch (error) {
    console.log("❌ Upload error FULL:", error);
    
    let errorMessage = "Network error or server issue";
    
    // Network-specific error handling
    if (error?.error?.includes("Network request failed")) {
      errorMessage = "Network error - check if backend is running at " + 
                    "192.168.1.50:5000";
    } else if (error?.status === "FETCH_ERROR") {
      errorMessage = "Failed to connect to server. Check backend IP/Port.";
    } else if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    Toast.show({
      type: "error",
      text1: "Upload failed",
      text2: errorMessage,
    });
  } finally {
    setModalVisible(false);
  }
};

  // Delete document
  const handleDeleteDocument = (doc) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${doc.docName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument({ id: doc._id, token }).unwrap();

              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Document deleted successfully",
                position: "bottom",
              });

              setMenuVisible(false);
              setSelectedDocument(null);

              setTimeout(() => {
                refetch();
              }, 300);
            } catch (error) {
              console.error("Delete error:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  error?.data?.message ||
                  error?.message ||
                  "Failed to delete document",
                position: "bottom",
              });
            }
          },
        },
      ],
    );
  };

  // Rename document
  const handleRenameDocument = async () => {
    if (!newDocName.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a document name",
        position: "bottom",
      });
      return;
    }

    try {
      await renameDocument({
        id: selectedDocument._id,
        docName: newDocName.trim(),
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Document renamed successfully",
        position: "bottom",
      });

      setRenameModalVisible(false);
      setSelectedDocument(null);
      setNewDocName("");

      setTimeout(() => {
        refetch();
      }, 300);
    } catch (error) {
      console.error("Rename error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error?.data?.message || error?.message || "Failed to rename document",
        position: "bottom",
      });
    }
  };

  // Document item component
  const DocumentItem = ({ item }) => (
    <TouchableOpacity style={styles.documentItem}>
      <View style={styles.documentContent}>
        <MaterialCommunityIcons
          name="file-document"
          size={32}
          color="#3B82F6"
          style={styles.documentIcon}
        />
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={2}>
            {item.docName}
          </Text>
          <Text style={styles.documentDate}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "Unknown date"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          setSelectedDocument(item);
          setMenuVisible(true);
        }}
        style={styles.menuButton}
      >
        <MaterialIcons name="more-vert" size={24} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setModalVisible(true)}
        disabled={isUploading}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Documents List */}
      {isLoading && !documentsData ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="folder-open" size={80} color="#ccc" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : filteredDocuments.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="description" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No documents found" : "No documents yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <DocumentItem item={item} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            <ScrollView
              style={{ height: 150, marginBottom: 12 }}
              keyboardShouldPersistTaps="handled"
            >
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
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Upload */}
            <TouchableOpacity
              style={[styles.uploadBtn, isUploading && { opacity: 0.6 }]}
              onPress={handleUploadDocument}
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

      {/* Document Menu Modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={styles.contextMenu}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setNewDocName(selectedDocument?.docName || "");
                setRenameModalVisible(true);
                setMenuVisible(false);
              }}
              disabled={isRenaming}
            >
              <MaterialIcons name="edit" size={20} color="#3B82F6" />
              <Text style={styles.menuText}>Rename</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDeleteDocument(selectedDocument)}
              disabled={isDeleting}
            >
              <MaterialIcons name="delete" size={20} color="#EF4444" />
              <Text style={[styles.menuText, { color: "#EF4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        transparent
        visible={renameModalVisible}
        animationType="slide"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                disabled={isRenaming}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Rename Document</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Form Content */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>Document Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new document name"
                value={newDocName}
                onChangeText={setNewDocName}
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
                disabled={isRenaming}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isRenaming && styles.buttonDisabled]}
                onPress={handleRenameDocument}
                disabled={isRenaming}
              >
                <Text style={styles.saveButtonText}>
                  {isRenaming ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Toast config={{ tomatoToast: { style: {} } }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    textAlign: "center",
  },

  // Upload Button
  uploadButton: {
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
    shadowColor: "#000",
  },

  // Search styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 44,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
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
  uploadText: {
    marginTop: 8,
    fontWeight: "600",
  },
  uploadSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  // Document List
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  documentContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  menuButton: {
    padding: 4,
  },

  // Empty/Loading styles
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 16,
  },

  // Context Menu styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  contextMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Form styles
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Button styles
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    marginBottom: 22,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CategoryDocuments;
