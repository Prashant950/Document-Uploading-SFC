import AsyncStorage from "@react-native-async-storage/async-storage";
import ProgressBarAndroid from "@react-native-community/progress-bar-android";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as ScreenCapture from "expo-screen-capture";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ProgressViewIOS,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
// import { WebView } from "react-native-webview";
import { BACKEND_IP, BACKEND_PORT } from "../../../src/config";
import {
  useAdminDownloadDocumentQuery,
  useAdminRenameDocumentMutation,
  useAdminUploadDocumentMutation,
  useDocumentViewQuery,
  useGetDocumentWithCategoriesQuery,
  useLazyAdminDownloadDocumentQuery,
  useLazyAdminShareDocumentQuery,
} from "../../../src/services/apiSlice";

const ClientStrategies = () => {
  const role = useSelector((state) => state.auth.role);

  const [open, setOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Modal states - moved to parent
  const [docName, setDocName] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadLock = useRef(false);

  const [file, setFile] = useState(null);

  const BACKEND_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

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

  const [uploadDocument] = useAdminUploadDocumentMutation();
  const { data: strategyDocumentsData, refetch } =
    useGetDocumentWithCategoriesQuery({
      refetchOnMountOrArgChange: true,
      docKey: "CLIENT_STRATEGY",
    });
  const [renameDocument] = useAdminRenameDocumentMutation();
  const {
    data: downloadData,
    downloadDocument,
    isDownloading,
    downloadError,
    downloadProgress: downloadProgressValue,
  } = useAdminDownloadDocumentQuery();

  const [triggerShare, { isLoading: isTriggeringShare }] =
    useLazyAdminShareDocumentQuery();
  const [triggerDownload, { isLoading: isTriggeringDownload }] =
    useLazyAdminDownloadDocumentQuery();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTargetFiles, setRenameTargetFiles] = useState([]);
  const [downloadProgressState, setDownloadProgressState] = useState({});
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadTargetFiles, setDownloadTargetFiles] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loadingAction, setLoadingAction] = useState({ type: null, id: null });

  // Extract documents array from API response (handle both direct array and wrapped response)
  const strategyDocuments = Array.isArray(strategyDocumentsData)
    ? strategyDocumentsData
    : strategyDocumentsData?.documents || strategyDocumentsData?.data || [];

  // Map file types to icons and colors
  const getFileTypeInfo = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();

    const typeMap = {
      pdf: { icon: "file-pdf-box", color: "#dc2626", bg: "#fee2e2" },
      doc: { icon: "file-word", color: "#2563eb", bg: "#dbeafe" },
      docx: { icon: "file-word", color: "#2563eb", bg: "#dbeafe" },
      xls: { icon: "file-excel", color: "#16a34a", bg: "#dcfce7" },
      xlsx: { icon: "file-excel", color: "#16a34a", bg: "#dcfce7" },
      ppt: { icon: "file-powerpoint-box", color: "#ea580c", bg: "#ffedd5" },
      pptx: { icon: "file-powerpoint-box", color: "#ea580c", bg: "#ffedd5" },
      txt: { icon: "file-document-outline", color: "#64748b", bg: "#f1f5f9" },
      Image: { icon: "file-image", color: "#f59e0b", bg: "#fffbeb" },
    };

    return (
      typeMap[ext] || { icon: "file-outline", color: "#6b7280", bg: "#f3f4f6" }
    );
  };

  // Format document data for display
  const formatDocuments = (docs) => {
    if (!docs || !Array.isArray(docs) || docs.length === 0) return [];

    // Group documents by docName
    const groupedDocs = {};

    docs.forEach((doc) => {
      const docName = doc.docName || "Unknown";
      if (!groupedDocs[docName]) {
        groupedDocs[docName] = [];
      }
      groupedDocs[docName].push(doc);
    });

    // Format grouped documents
    return Object.entries(groupedDocs).map(([docName, docsArray]) => {
      const firstDoc = docsArray[0];
      const typeInfo = getFileTypeInfo(
        firstDoc.name || firstDoc.fileName || "",
      );
      const date = firstDoc.createdAt
        ? new Date(firstDoc.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Unknown";

      const fileCount = docsArray.length;

      // include all files in this group so viewer can navigate between them
      const files = docsArray.map((d) => ({
        id: d._id || d.id || d.fileId || null,
        name: d.name || d.fileName || d.docName || docName,
        size: d.size || d.fileSize || 0,
      }));

      return {
        id: docName,
        files,
        name: docName,
        date: date,
        fileCount: fileCount,
        ...typeInfo,
      };
    });
  };

  const displayDocuments = formatDocuments(strategyDocuments);

  // Filter documents based on search query
  const filteredDocuments = displayDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
  const handleOpen = () => {
    if (open) return;
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const AddDocumentModal = ({ visible, onClose }) => {
    const [docName, setDocName] = useState("");
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const uploadLock = useRef(false);

    const pickDocument = async () => {
      try {
        const res = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (res.canceled || !res.assets) return;

        // Process all selected files
        const newFiles = res.assets.filter((file) => {
          // Validation
          const maxSize = 50 * 1024 * 1024; // 50MB
          if (file.size > maxSize) {
            Alert.alert("File Too Large", `${file.name} exceeds 50MB limit`);
            return false;
          }
          return true;
        });

        setFiles((prev) => [...prev, ...newFiles]);
      } catch (e) {
        Alert.alert("Error", "Could not open document picker");
      }
    };

    const removeFile = (index) => {
      setFiles(files.filter((_, i) => i !== index));
    };
    const getSafeUploadName = (file, index) => {
      if (!file) return `document_${index}.bin`;

      if (file.name && file.name.includes(".")) {
        return file.name;
      }

      const mime = file.mimeType || file.type;
      if (mime && mime.includes("/")) {
        const ext = mime.split("/")[1];
        return `document_${index}.${ext}`;
      }

      return `document_${index}.bin`;
    };

    const handleUpload = async () => {
      if (uploadLock.current) return; // ⛔ block second tap
      uploadLock.current = true;

      if (!docName.trim()) {
        Alert.alert("Validation Error", "Please enter a document name.");
        uploadLock.current = false;
        return;
      }
      if (files.some((f) => !f || (!f.mimeType && !f.type))) {
        Alert.alert(
          "Validation Error",
          "One or more selected files have unsupported type.",
        );
        uploadLock.current = false;
        return;
      }

      if (files.length === 0) {
        Alert.alert(
          "Validation Error",
          "Please select at least one file to upload.",
        );
        uploadLock.current = false;
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();

        // Add all files (skip any null entries)
        files.forEach((file, index) => {
          if (!file) return;
          formData.append("files", {
            uri: file.uri,
            name: getSafeUploadName(file, index),
            type: file?.mimeType || "application/octet-stream",
          });
        });

        formData.append("docName", docName);
        formData.append("docKey", "CLIENT_STRATEGY");

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 30;
          });
        }, 300);

        console.log(
          "Uploading files metadata:",
          files.map((f) => ({
            name: f?.name || null,
            size: f?.size || null,
            uri: f?.uri || null,
            mimeType: f?.mimeType || f?.type || null,
            type: f?.mimeType || f?.type || null,
          })),
        );
        const response = await uploadDocument(formData).unwrap();
        console.log("Upload Response:", response);

        clearInterval(progressInterval);
        setUploadProgress(100);

        Toast.show({
          type: "success",
          text1: "Success ✅",
          text2: `${files.length} documents uploaded successfully`,
          duration: 2000,
        });
        onClose();
        // Close modal and reset state after a short delay
        setTimeout(() => {
          setDocName("");
          setFiles([]);
          setUploadProgress(0);
          setIsUploading(false);
          uploadLock.current = false;
        }, 300);
      } catch (error) {
        console.error("Upload Error:", error);
        // Try to show helpful server message when available
        const serverMsg =
          error?.data?.message ||
          error?.error ||
          (error?.data && JSON.stringify(error.data)) ||
          null;
        Toast.show({
          type: "error",
          text1: "Upload Failed",
          text2: serverMsg || "Failed to upload document. Please try again.",
        });
        setIsUploading(false);
        setUploadProgress(0);
        uploadLock.current = false;
      }
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          {/* Tap outside to close - disabled during upload */}
          {!isUploading && (
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={onClose}
            />
          )}
          {isUploading && <View style={styles.backdrop} />}

          {/* Bottom Sheet */}
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add New Document</Text>
              <TouchableOpacity
                onPress={() => !isUploading && onClose()}
                disabled={isUploading}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isUploading ? "#ccc" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {/* Document Name */}
              <Text style={styles.label}>DOCUMENT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter file name (e.g., Q4 Report)"
                placeholderTextColor="#94a3b8"
                value={docName}
                onChangeText={setDocName}
                editable={!isUploading}
              />

              {/* Attach Document */}
              <Text style={styles.label}>ATTACH DOCUMENT</Text>

              <TouchableOpacity
                style={[styles.uploadBox, isUploading && { opacity: 0.5 }]}
                onPress={pickDocument}
                disabled={isUploading}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color="#008080"
                />
                <Text style={styles.uploadText}>Tap to select file</Text>
                <Text style={styles.uploadSub}>PDF, DOCX, XLSX up to 50MB</Text>
              </TouchableOpacity>

              {/* Selected Files List */}
              {files.length > 0 && (
                <>
                  <View style={styles.attachedHeader}>
                    <View style={styles.attachedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.attachedBadgeText}>
                        {files.length} file(s) attached
                      </Text>
                    </View>
                  </View>

                  {files.map((file, index) => (
                    <View key={index} style={styles.fileListItem}>
                      <View style={styles.fileIconSmall}>
                        <MaterialCommunityIcons
                          name="file"
                          size={20}
                          color="#008080"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileNameSmall} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileMetaSmall}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => removeFile(index)}
                        disabled={isUploading}
                        style={styles.removeBtn}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={isUploading ? "#ccc" : "#ef4444"}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Uploading...</Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(uploadProgress)}%
                    </Text>
                  </View>
                  {Platform.OS === "ios" ? (
                    <ProgressViewIOS
                      progress={uploadProgress / 100}
                      style={styles.progressBar}
                    />
                  ) : (
                    <ProgressBarAndroid
                      progress={uploadProgress / 100}
                      styleAttr="Horizontal"
                      color="#008080"
                      style={styles.progressBar}
                    />
                  )}
                </View>
              )}

              {/* Upload Button */}
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  isUploading && { backgroundColor: "#666" },
                  files.length === 0 &&
                    !isUploading && { backgroundColor: "#ccc" },
                ]}
                onPress={handleUpload}
                disabled={isUploading || files.length === 0}
              >
                {isUploading ? (
                  <>
                    <Ionicons name="hourglass-outline" size={18} color="#fff" />
                    <Text style={styles.uploadBtnText}>
                      {" "}
                      Uploading {Math.round(uploadProgress)}%
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color="#fff" />
                    <Text style={styles.uploadBtnText}>
                      {" "}
                      {files.length > 0 ? "Upload Files" : "Select File First"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={onClose}
                disabled={isUploading}
                style={{ opacity: isUploading ? 0.5 : 1 }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const RenameModal = ({ visible, onClose }) => {
    const handleRename = async () => {
      if (!renameValue || renameValue.trim() === "") {
        Toast.show({ type: "error", text1: "Name required" });
        return;
      }

      try {
        const ids = (renameTargetFiles || []).map((f) => f.id).filter(Boolean);
        if (ids.length === 0) {
          Toast.show({ type: "info", text1: "No files to rename" });
          onClose();
          return;
        }

        await Promise.all(
          ids.map((id) =>
            renameDocument({ id, docName: renameValue }).unwrap(),
          ),
        );

        Toast.show({
          type: "success",
          text1: "Renamed",
          text2: "Document(s) renamed",
        });
        refetch();
        onClose();
      } catch (err) {
        console.error("Rename error:", err);
        Toast.show({ type: "error", text1: "Rename failed" });
      }
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { padding: 20, margin: 20 }]}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
              Rename Document
            </Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="New name"
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
                <Text style={{ color: "#64748b" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename}>
                <Text style={{ color: "#2563eb", fontWeight: "700" }}>
                  Rename
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  const FileActionSheet = ({ visible, onClose, fileData }) => {
    if (!visible) {
      return null;
    }

    // Get file info from passed data or use defaults
    const displayName = fileData?.name || "Document.pdf";
    const displaySize = fileData?.fileCount || 1;
    const displayDate = fileData?.date || "Unknown date";
    const displayIcon = fileData?.icon || "file-pdf-box";
    const displayColor = fileData?.color || "#ef4444";

    return (
      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.fileHeader}>
            <MaterialCommunityIcons
              name={displayIcon}
              size={42}
              color={displayColor}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.fileName} numberOfLines={2}>
                {displayName}
              </Text>
              <Text style={styles.fileMeta}>
                {displaySize} file{displaySize > 1 ? "s" : ""} · {displayDate}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setFile({
                files: fileData?.files || [],
                currentIndex: 0,
                name: fileData?.name,
                size: fileData?.fileCount,
              });
              setViewerVisible(true);
              onClose();
            }}
          >
            <Ionicons name="eye-outline" size={22} color="#334155" />
            <Text style={styles.actionText}>View Document</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              // start share; close modal when server share has started
              shareDocumentHandler(fileData?.files || fileData?.id, () =>
                onClose(),
              );
            }}
            disabled={loadingAction.type === "share"}
          >
            <Ionicons name="share-outline" size={22} color="#334155" />
            <Text style={styles.actionText}>Share</Text>
            {(() => {
              const primaryId = fileData?.files?.[0]?.id || fileData?.id;
              if (
                loadingAction.type === "share" &&
                loadingAction.id === primaryId
              ) {
                return (
                  <ActivityIndicator
                    size="small"
                    color="#2563eb"
                    style={{ marginLeft: 8 }}
                  />
                );
              }
              return null;
            })()}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setDownloadTargetFiles(fileData?.files || []);
              setDownloadModalVisible(true);
              onClose();
              setDownloadProgress(0);
            }}
          >
            <Ionicons name="download-outline" size={22} color="#334155" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setRenameTargetFiles(fileData?.files || []);
              setRenameValue(fileData?.name || "");
              setRenameModalVisible(true);
              onClose();
            }}
          >
            <Ionicons name="pencil-outline" size={22} color="#334155" />
            <Text style={styles.actionText}>Rename File</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Action icon="trash-outline" text="Delete" danger />
        </View>
      </Modal>
    );
  };

  const Action = ({ icon, text, danger }) => (
    <TouchableOpacity style={styles.actionRow}>
      <Ionicons name={icon} size={22} color={danger ? "#ef4444" : "#334155"} />
      <Text style={[styles.actionText, danger && { color: "#ef4444" }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

  const downloadAndSave = async (file, { saveToFolder = false } = {}) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const fileId = file?.id || file?._id || file?.fileId || file;
      const fileName = (
        file?.name ||
        file?.originalName ||
        fileId ||
        "file"
      ).replace(/[^a-zA-Z0-9._-]/g, "_");

      // Probe endpoints to find a working download URL
      const tryUrls = [
        `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/download/${fileId}`,
        `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/download/${fileId}`,
      ];

      let goodUrl = null;
      for (const u of tryUrls) {
        try {
          const r = await fetch(u, {
            method: "HEAD",
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          });
          if (r.ok) {
            goodUrl = u;
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }

      if (!goodUrl) {
        // fallback to first admin url
        goodUrl = tryUrls[0];
      }

      const tempUri = FileSystem.cacheDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        goodUrl,
        tempUri,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } },
        (progress) => {
          try {
            const pct =
              progress.totalBytesExpectedToWrite > 0
                ? Math.round(
                    (progress.totalBytesWritten /
                      progress.totalBytesExpectedToWrite) *
                      100,
                  )
                : 0;
            setDownloadProgress(pct);
          } catch (e) {}
        },
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (saveToFolder && Platform.OS === "android") {
        // Use SAF to save to user chosen directory (Android)
        try {
          const permission =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permission.granted) {
            Toast.show({ type: "error", text1: "Permission denied" });
            return uri;
          }

          try {
            const destUri =
              await FileSystem.StorageAccessFramework.createFileAsync(
                permission.directoryUri,
                fileName,
                file?.mimeType || "application/octet-stream",
              );

            const b64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await FileSystem.writeAsStringAsync(destUri, b64, {
              encoding: FileSystem.EncodingType.Base64,
            });

            Toast.show({ type: "success", text1: `Saved ${fileName}` });
            return destUri;
          } catch (safErr) {
            console.error("SAF create/write failed", safErr);
            // Fallback: open share sheet so user can save the file manually
            try {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                Toast.show({
                  type: "info",
                  text1: "Save failed; opened share sheet as fallback",
                });
              } else {
                Toast.show({ type: "error", text1: "Save failed" });
              }
            } catch (shareErr) {
              console.error("Fallback share failed", shareErr);
              Toast.show({ type: "error", text1: "Save failed" });
            }

            return uri;
          }
        } catch (e) {
          console.error("SAF permission/request failed", e);
          Toast.show({ type: "error", text1: "Save failed" });
          return uri;
        }
      }

      // For media files, save to media library where possible
      const ext = (file?.name || fileName).split(".").pop().toLowerCase();
      const mediaTypes = ["jpg", "jpeg", "png", "gif", "mp4", "mov"];
      if (mediaTypes.includes(ext)) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await MediaLibrary.createAssetAsync(uri);
          Toast.show({ type: "success", text1: `Saved ${fileName}` });
        } else {
          Toast.show({
            type: "info",
            text1: "Permission required to save to gallery",
          });
        }
        return uri;
      }

      // For non-media, return cached uri (caller can share or handle further)
      return uri;
    } catch (err) {
      console.error("Download error:", err);
      Toast.show({ type: "error", text1: "Download failed" });
      throw err;
    }
  };

  const DownloadModal = ({ visible, onClose, files = [] }) => {
    const [selectedIndexes, setSelectedIndexes] = useState([]);

    useEffect(() => {
      setSelectedIndexes(files.map(() => true));
    }, [files]);

    const toggleIndex = (i) => {
      setSelectedIndexes((s) => {
        const copy = [...s];
        copy[i] = !copy[i];
        return copy;
      });
    };

    const handleDownloadSelected = async () => {
      const toDownload = files.filter((_, i) => selectedIndexes[i]);
      if (!toDownload.length) {
        Toast.show({ type: "info", text1: "No files selected" });
        return;
      }

      try {
        for (const f of toDownload) {
          // When user chooses download, save to folder on Android where possible
          await downloadAndSave(f, { saveToFolder: true });
        }
        Toast.show({ type: "success", text1: "All downloads complete" });
        onClose();
      } catch (e) {
        console.error(e);
      } finally {
        setDownloadProgress(0);
      }
    };

    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { padding: 18 }]}>
          <View style={styles.handle} />
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Download Files
          </Text>

          {files.length === 0 ? (
            <Text style={styles.noDataText}>No files available</Text>
          ) : (
            files.map((f, i) => (
              <TouchableOpacity
                key={f.id || i}
                onPress={() => toggleIndex(i)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                }}
              >
                <Ionicons
                  name={selectedIndexes[i] ? "checkbox" : "square-outline"}
                  size={20}
                  color="#2563eb"
                />
                <Text style={{ marginLeft: 10, flex: 1 }}>
                  {f.name || f.id}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
              <Text style={{ color: "#64748b" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownloadSelected}>
              <Text style={{ color: "#2563eb", fontWeight: "700" }}>
                Download
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const shareDocumentHandler = async (file) => {
    const token = await AsyncStorage.getItem("token");

    const fileId = file._id;
    const originalName = file.originalName; // MUST exist

    if (!originalName || !originalName.includes(".")) {
      throw new Error("Invalid filename from backend");
    }

    const url = `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/share/${fileId}`;

    // 🔥 EXTENSION IS MANDATORY
    const localUri = FileSystem.cacheDirectory + originalName;

    await FileSystem.downloadAsync(url, localUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await Sharing.shareAsync(localUri, {
      dialogTitle: "Share Document",
    });
  };

  const DocumentViewer = ({ visible, onClose }) => {
    const [webViewKey, setWebViewKey] = useState(0);
    const [currentDocIndex, setCurrentDocIndex] = useState(
      file?.currentIndex || 0,
    );

    useEffect(() => {
      setCurrentDocIndex(file?.currentIndex || 0);
      setWebViewKey((k) => k + 1);
    }, [file]);

    const currentFile = file?.files?.[currentDocIndex] || null;
    const fileName = currentFile?.name || "Document";
    const fileSize = currentFile?.size || 0;
    const [currentPage, setCurrentPage] = useState(1);
    const [token, setToken] = useState(null);
    const touchStartXRef = useRef(0);

    // Fetch token from AsyncStorage once
    useEffect(() => {
      const fetchToken = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("token");
          setToken(storedToken);
        } catch (error) {
          console.error("❌ Error fetching token:", error);
        }
      };

      if (visible) {
        fetchToken();
      }
    }, [visible]);

    // Construct full document URL from API with backend IP and PORT for current file
    const documentUrl = currentFile?.id
      ? `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/view/${currentFile.id}`
      : null;

    const { data: documentViewData, isLoading: isDocumentLoading } =
      useDocumentViewQuery(currentFile?.id, { skip: !currentFile?.id });

    // Use data from API if available
    const totalPages =
      documentViewData?.totalPages || documentViewData?.pages || 12;

    // Memoize headers to prevent re-renders
    const webViewHeaders = useCallback(
      () => ({
        Authorization: token ? `Bearer ${token}` : "",
      }),
      [token],
    );

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.viewerContainer}>
          {/* Header */}
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {fileName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {file?.files && file.files.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentPage(1);
                      setCurrentDocIndex((i) => Math.max(0, i - 1));
                      setWebViewKey((k) => k + 1);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    <Ionicons
                      name="arrow-back-circle"
                      size={24}
                      color="#2563eb"
                    />
                  </TouchableOpacity>

                  <Text style={{ marginRight: 8, fontWeight: "700" }}>
                    {currentDocIndex + 1}/{file.files.length}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setCurrentPage(1);
                      setCurrentDocIndex((i) =>
                        Math.min(i + 1, file.files.length - 1),
                      );
                      setWebViewKey((k) => k + 1);
                    }}
                  >
                    <Ionicons
                      name="arrow-forward-circle"
                      size={24}
                      color="#2563eb"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Secure View Badge */}
          <View style={styles.secureBadgeViewer}>
            <Ionicons name="shield-checkmark" size={18} color="#2563eb" />
            <Text style={styles.secureViewText}>SECURE VIEW</Text>
          </View>

          {/* Swipe overlay to navigate between files (left/right) */}
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              touchStartXRef.current = e.nativeEvent.pageX;
            }}
            onResponderRelease={(e) => {
              const dx = e.nativeEvent.pageX - touchStartXRef.current;
              if (!file?.files || file.files.length <= 1) return;
              if (dx < -50) {
                // swipe left -> next
                setCurrentPage(1);
                setCurrentDocIndex((i) =>
                  Math.min(i + 1, file.files.length - 1),
                );
                setWebViewKey((k) => k + 1);
              } else if (dx > 50) {
                // swipe right -> prev
                setCurrentPage(1);
                setCurrentDocIndex((i) => Math.max(0, i - 1));
                setWebViewKey((k) => k + 1);
              }
            }}
          />

          {/* Document Viewer Area */}
          {isDocumentLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#008080" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          ) : documentUrl && token ? (
            <WebView
              key={webViewKey}
              style={{ flex: 1 }}
              source={{
                uri: documentUrl,
                headers: webViewHeaders(),
              }}
              startInLoadingState={true}
              cacheMode="LOAD_NO_CACHE"
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#008080" />
                  <Text style={styles.loadingText}>Rendering document...</Text>
                </View>
              )}
              onError={(e) => {
                console.error("❌ WebView Error:", e.nativeEvent);
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Unable to load document",
                });
              }}
              javaScriptEnabled={false}
              domStorageEnabled={false}
              scalesPageToFit={true}
              allowFileAccess={true}
              mixedContentMode="always"
            />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
            >
              {documentViewData ? (
                <View style={styles.documentContentWrapper}>
                  {/* If documentViewData has pages array */}
                  {Array.isArray(documentViewData?.pages) &&
                  documentViewData.pages.length > 0 ? (
                    documentViewData.pages.map((page, index) => (
                      <View key={index} style={styles.documentPage}>
                        <View style={styles.pageHeader}>
                          <Text style={styles.pageNumber}>
                            Page {index + 1} of {documentViewData.pages.length}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.documentPlaceholder,
                            { marginBottom: 16 },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="file-pdf-box"
                            size={50}
                            color="#dc2626"
                          />
                          <Text
                            style={styles.placeholderText}
                            numberOfLines={2}
                          >
                            {page?.content || fileName}
                          </Text>
                          <Text style={styles.placeholderMeta}>
                            {page?.size || fileSize} MB
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.documentPlaceholder}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={60}
                        color="#dc2626"
                      />
                      <Text style={styles.placeholderText} numberOfLines={2}>
                        {fileName}
                      </Text>
                      <Text style={styles.placeholderSubText}>
                        Page {currentPage} of {totalPages}
                      </Text>
                      <Text style={styles.placeholderMeta}>{fileSize} MB</Text>
                      <Text style={styles.dataIndicator}>✓ Document Ready</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.documentPlaceholder}>
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={60}
                    color="#dc2626"
                  />
                  <Text style={styles.placeholderText} numberOfLines={2}>
                    {fileName}
                  </Text>
                  <Text style={styles.placeholderSubText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Text style={styles.placeholderMeta}>{fileSize} MB</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#A1A1AA" />
        <TextInput
          style={styles.searchInputField}
          placeholder="Search"
          placeholderTextColor="#A1A1AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ===== Files Info ===== */}
      <View style={styles.infoPill}>
        <Text style={styles.infoText}>{filteredDocuments.length} Files</Text>
      </View>

      {/* ===== Documents List ===== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefreshAll} />
        }
      >
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={[styles.fileIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={26}
                  color={item.color}
                />
              </View>

              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {item.date} · {item.fileCount} file
                  {item.fileCount > 1 ? "s" : ""}
                </Text>

                <View style={styles.secureBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#2563eb" />
                  <Text style={styles.secureText}> SECURE</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedFile(item);
                  setMenuVisible(true);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No documents yet</Text>
            <Text style={styles.emptySubText}>Upload files to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* ===== Floating Add Button ===== */}
      {role !== "user" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <AddDocumentModal visible={open} onClose={handleClose} />

      <FileActionSheet
        visible={menuVisible}
        onClose={closeMenu}
        fileData={selectedFile}
      />

      <DocumentViewer
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
      <RenameModal
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
      />
      <DownloadModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        files={downloadTargetFiles}
      />
    </View>
  );
};

export default ClientStrategies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
    color: "#111827",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginVertical: 12,
    marginBottom: 16,
    marginTop: 5,
    backgroundColor: "#fff",
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
  },
  searchInputField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
    height: "100%",
    paddingVertical: 0,
  },

  infoPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 12,
  },
  infoText: {
    color: "#64748b",
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },
  fileIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  fileMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  secureText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
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
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: "#0f172a",
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#008080",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#f0fffe",
  },
  uploadIconBox: {
    marginTop: 8,
  },
  uploadIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 15,
    color: "#008080",
    fontWeight: "500",
    textAlign: "center",
  },
  uploadSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  attachedHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  attachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#008080",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  attachedBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  fileListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#008080",
  },
  fileIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0fffe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileNameSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  fileMetaSmall: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  progressSection: {
    backgroundColor: "#f0fffe",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d0f0ee",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#008080",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#008080",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  uploadBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#008080",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#008080",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cancelText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 10,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    maxWidth: "90%",
  },
  fileMeta: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 6,
  },
  noDataText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 24,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: 22,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 12,
    marginTop: 0,
  },
  secureBadgeViewer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 5,
    marginRight: 16,
  },
  secureViewText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
    marginLeft: 6,
  },
  viewerContent: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingVertical: 16,
    backgroundColor: "#f3f4f6",
  },
  documentContentWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  documentPage: {
    marginBottom: 20,
  },
  pageHeader: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  pageNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  documentPlaceholder: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
    textAlign: "center",
  },
  placeholderSubText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  placeholderMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 12,
    fontWeight: "500",
  },
  dataIndicator: {
    fontSize: 12,
    color: "#16a34a",
    marginTop: 12,
    fontWeight: "600",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 36,
    height: 36,
    minWidth: 50,
    textAlign: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 36,
    height: 36,
    minWidth: 50,
    textAlign: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },

  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },

  controlBtnText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
});
