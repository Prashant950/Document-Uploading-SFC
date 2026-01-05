import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
//import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as IntentLauncher from "expo-intent-launcher";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import WebView from "react-native-webview";
import {
  useDeleteDocumentMutation,
  useFetchDocumentsQuery,
  useLazyDownloadDocumentQuery,
  useLazyShareDocumentQuery,
  useLazyViewDocumentQuery,
  useUploadDocumentMutation,
} from "../src/services/apiSlice";

import { BACKEND_IP, BACKEND_PORT } from "../src/config";

const BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

const UploadDocumentsScreen = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);
  const [viewUri, setViewUri] = useState(null);
  const [viewType, setViewType] = useState(null);
  const [viewVisible, setViewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [docs, setDocs] = useState({});
  const [files, setFiles] = useState([]);
  // Prevent duplicate manual uploads
  const [isManualUploading, setIsManualUploading] = useState(false);

  // Group modal state to show multiple files uploaded together
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupFilesList, setGroupFilesList] = useState([]);
  const [groupTitle, setGroupTitle] = useState("");

  // Preview state for group modal
  const [groupPreviewUri, setGroupPreviewUri] = useState(null);
  const [groupPreviewType, setGroupPreviewType] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [uploadDocument, { error }] = useUploadDocumentMutation();
  const { data: documents = [], isLoading, isError } = useFetchDocumentsQuery();
  const [
    deleteDocument,
    { isLoading: isLoadingDelete, isError: isErrorDelete },
  ] = useDeleteDocumentMutation();
  const [
    triggerViewDocument,
    { isLoading: isLoadingView, isError: isErrorView },
  ] = useLazyViewDocumentQuery();
  const [
    downloadDocument,
    { isLoading: isLoadingDownload, isError: isErrorDownload },
  ] = useLazyDownloadDocumentQuery();
  const [shareDocument, { isLoading: isLoadingShare, isError: isErrorShare }] =
    useLazyShareDocumentQuery();

  useEffect(() => {
    if (!documents || documents.length === 0) return;

    setDocs((prev) => {
      const newDocs = {
        AADHAAR: documents.find((d) => d.docKey === "AADHAAR") || null,
        PAN: documents.find((d) => d.docKey === "PAN") || null,
        DL: documents.find((d) => d.docKey === "DL") || null,
        Passport: documents.find((d) => d.docKey === "Passport") || null,
        Insurance: documents.find((d) => d.docKey === "Insurance") || null,
        Salary: documents.find((d) => d.docKey === "Salary") || null,
        Bank: documents.find((d) => d.docKey === "Bank") || null,
      };

      // ✅ Only update if different from previous
      const isSame = Object.keys(newDocs).every(
        (key) => newDocs[key]?._id === prev[key]?._id
      );
      if (isSame) return prev;

      return newDocs;
    });
  }, [documents]);

  const getDoc = useCallback(
    (docKey) => documents.find((d) => d.docKey === docKey) || null,
    [documents]
  );

  const groupedDocs = useMemo(() => {
    const map = {};
    documents.forEach((doc) => {
      if (!map[doc.docKey]) map[doc.docKey] = [];
      map[doc.docKey].push(doc);
    });
    return map;
  }, [documents]);

  // Group OTHER uploads by the provided document name (docName)
  const otherGroups = useMemo(() => {
    const map = {};
    (groupedDocs.OTHER || []).forEach((doc) => {
      const name = doc.docName || "Manual Upload";
      if (!map[name]) map[name] = [];
      map[name].push(doc);
    });
    return map;
  }, [groupedDocs.OTHER]);

  const openGroupModal = (name) => {
    let docs = [];
    if (name === "Manual Uploads") {
      docs = groupedDocs.MANUAL || [];
    } else {
      docs = otherGroups[name] || [];
    }
    setGroupFilesList(docs);
    setGroupTitle(name);
    setGroupModalVisible(true);

    // start preview with first file (if any)
    if (docs.length > 0) previewGroupFileByDocs(docs, 0);
  };

  // Preview helpers for group modal
  const previewGroupFileByDocs = async (docs, index) => {
    if (!docs || docs.length === 0) return;
    const doc = docs[index];
    try {
      setIsPreviewLoading(true);
      const token = await AsyncStorage.getItem("token");
      const tempUri =
        FileSystem.cacheDirectory +
        (doc.originalName || doc.docName || "file").replace(/\s/g, "_");

      const downloadResumable = FileSystem.createDownloadResumable(
        `${BASE_URL}/documents/download/${doc._id}`,
        tempUri,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // On Android convert to content:// URI for better compatibility (guarded)
      let previewUri = uri;
      if (
        typeof Platform !== "undefined" &&
        Platform.OS === "android" &&
        typeof FileSystem.getContentUriAsync === "function"
      ) {
        try {
          previewUri = await FileSystem.getContentUriAsync(uri);
        } catch (e) {
          // fallback to file uri
        }
      }

      setGroupPreviewUri(previewUri);
      setGroupPreviewType(doc.contentType || "");
      setActiveIndex(index);
    } catch (err) {
      console.log("PREVIEW ERROR", err);
      Toast.show({ type: "error", text1: "Preview Failed" });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const previewIndex = (newIndex) => {
    if (!groupFilesList || groupFilesList.length === 0) return;
    const clamped =
      ((newIndex % groupFilesList.length) + groupFilesList.length) %
      groupFilesList.length;
    previewGroupFileByDocs(groupFilesList, clamped);
  };

  useEffect(() => {
    if (!groupModalVisible) {
      setGroupPreviewUri(null);
      setGroupPreviewType(null);
      setActiveIndex(0);
      setGroupFilesList([]);
    }
  }, [groupModalVisible]);

  // End preview helpers

  const uploadDocumentByType = async (type, label) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const formData = new FormData();
      formData.append("files", {
        uri: asset.fileCopyUri || asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      });

      formData.append("docName", label);
      formData.append("docKey", type);

      await uploadDocument(formData).unwrap(); // 🔥 IMPORTANT

      Toast.show({
        type: "success",
        text1: `${label} Uploaded`,
      });
    } catch (err) {
      console.log("UPLOAD ERROR 👉", err);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
      });
    }
  };

const manualUploadingRef = useRef(false);

const handleManualUpload = async () => {
  // 🔒 STRONG synchronous guard (DEV + PROD safe)
  if (manualUploadingRef.current) return;

  manualUploadingRef.current = true;
  setIsManualUploading(true);

  try {
    if (!docName) {
      Toast.show({ type: "error", text1: "Please enter document name" });
      return;
    }

    const filesToUpload =
      files && files.length > 0
        ? files
        : file
        ? Array.isArray(file)
          ? file
          : [file]
        : [];

    if (filesToUpload.length === 0) {
      Toast.show({ type: "error", text1: "Please select file(s)" });
      return;
    }

    // 🧹 Deduplicate by URI
    const uniqueMap = {};
    filesToUpload.forEach((f) => {
      const key = f.uri || `${f.name}-${f.size || 0}`;
      if (!uniqueMap[key]) uniqueMap[key] = f;
    });
    const uniqueFiles = Object.values(uniqueMap);

    const formData = new FormData();
    uniqueFiles.forEach((f) => {
      formData.append("files", {
        uri: f.uri,
        name: f.name,
        type: f.mimeType || "application/octet-stream",
      });
    });

    formData.append("docName", docName);
    formData.append("docKey", "OTHER");

    // 🔥 optional but recommended (backend dedupe)
    formData.append(
      "clientRequestId",
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );

    const res = await uploadDocument(formData).unwrap();

    const uploadedCount = res?.documents?.length ?? uniqueFiles.length;

    Toast.show({
      type: "success",
      text1: `${uploadedCount} file(s) uploaded successfully`,
    });

    setModalVisible(false);
    setDocName("");
    setFile(null);
    setFiles([]);
  } catch (err) {
    console.log("UPLOAD ERROR", err);
    Toast.show({ type: "error", text1: "Upload Failed" });
  } finally {
    manualUploadingRef.current = false;
    setIsManualUploading(false);
  }
};

  // const handleManualUpload = async () => {
  //   // prevent double submissions
  //   if (isManualUploading) return;

  //   try {
  //     if (!docName) {
  //       Toast.show({ type: "error", text1: "Please enter document name" });
  //       return;
  //     }

  //     // support both single `file` and multiple `files` state
  //     const filesToUpload =
  //       files && files.length > 0
  //         ? files
  //         : file
  //           ? Array.isArray(file)
  //             ? file
  //             : [file]
  //           : [];

  //     if (filesToUpload.length === 0) {
  //       Toast.show({ type: "error", text1: "Please select file(s)" });
  //       return;
  //     }

  //     // Dedupe files by URI (avoid duplicates causing multiple uploads)
  //     const uniqueMap = {};
  //     filesToUpload.forEach((f) => {
  //       const key = f.uri || `${f.name}-${f.size || 0}`;
  //       if (!uniqueMap[key]) uniqueMap[key] = f;
  //     });
  //     const uniqueFiles = Object.values(uniqueMap);

  //     if (uniqueFiles.length === 0) {
  //       Toast.show({ type: "error", text1: "Please select file(s)" });
  //       return;
  //     }

  //     setIsManualUploading(true);

  //     // Put all files into a single FormData as `files[]`
  //     const formData = new FormData();
  //     uniqueFiles.forEach((f) => {
  //       formData.append("files", {
  //         uri: f.uri,
  //         name: f.name,
  //         type: f.mimeType || "application/octet-stream",
  //       });
  //     });

  //     formData.append("docName", docName);
  //     formData.append("docKey", "OTHER");

  //     const res = await uploadDocument(formData).unwrap();

  //     const uploadedCount = res?.documents?.length ?? uniqueFiles.length;

  //     Toast.show({
  //       type: "success",
  //       text1: `${uploadedCount} file(s) uploaded successfully`,
  //     });

  //     setModalVisible(false);
  //     setDocName("");
  //     setFile(null);
  //     setFiles([]);
  //   } catch (err) {
  //     console.log("UPLOAD ERROR", err);
  //     Toast.show({ type: "error", text1: "Upload Failed" });
  //   } finally {
  //     setIsManualUploading(false);
  //   }
  // };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // ✅ ALL FILE TYPES
        copyToCacheDirectory: true, // ✅ REQUIRED for large files
        multiple: true,
      });

      if (result.canceled) return;

      const assets = result.assets || [];

      if (assets.length > 1) {
        setFiles(
          assets.map((asset) => ({
            uri: asset.fileCopyUri || asset.uri,
            name: asset.name,
            mimeType: asset.mimeType || "application/octet-stream",
            size: asset.size,
          }))
        );
        setFile(null);
      } else if (assets.length === 1) {
        const asset = assets[0];
        setFile({
          uri: asset.fileCopyUri || asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/octet-stream",
          size: asset.size,
        });
        setFiles([]);
      }
    } catch (err) {
      console.log("PICK FILE ERROR", err);
    }
  };

  const handleView = async (doc) => {
    try {
      const token = await AsyncStorage.getItem("token");

      // 1️⃣ Local file path
      const fileUri =
        FileSystem.cacheDirectory + doc.originalName.replace(/\s/g, "_");

      // 2️⃣ Download file
      const downloadResumable = FileSystem.createDownloadResumable(
        `${BASE_URL}/documents/download/${doc._id}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // 🔥 3️⃣ Convert to content:// URI if available (guarded)
      let contentUri = uri;
      if (
        typeof Platform !== "undefined" &&
        Platform.OS === "android" &&
        typeof FileSystem.getContentUriAsync === "function"
      ) {
        try {
          contentUri = await FileSystem.getContentUriAsync(uri);
        } catch (e) {
          // fallback to file uri
        }
      }

      // 4️⃣ Open with native app (Android) or fall back to in-app viewer
      if (typeof Platform !== "undefined" && Platform.OS === "android") {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: doc.contentType || "*/*",
        });
      } else {
        setViewUri(contentUri);
        setViewType(doc.contentType || "");
        setViewVisible(true);
      }
    } catch (err) {
      console.log("VIEW ERROR", err);
      Toast.show({
        type: "error",
        text1: "Cannot open file",
      });
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = await AsyncStorage.getItem("token");

      // 🔥 Ask permission (Android)
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Toast.show({ type: "error", text1: "Storage permission denied" });
          return;
        }
      } catch (err) {
        console.log("DOWNLOAD PERMISSION ERROR", err);
        Toast.show({
          type: "error",
          text1: "Media library permission failed",
          text2:
            "Expo Go may be unable to request this permission on some Android versions. Create a development build or add RECORD_AUDIO to Android permissions and rebuild.",
        });
        return;
      }

      const tempUri =
        FileSystem.cacheDirectory + doc.originalName.replace(/\s/g, "_");

      // ⬇️ Download file
      const downloadResumable = FileSystem.createDownloadResumable(
        `${BASE_URL}/documents/download/${doc._id}`,
        tempUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (progress) => {
          const percent =
            (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) *
            100;

          console.log(`Downloading: ${percent.toFixed(0)}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // ✅ Save to public Downloads
      const asset = await MediaLibrary.createAssetAsync(uri);

      await MediaLibrary.createAlbumAsync("Download", asset, false);

      Toast.show({
        type: "success",
        text1: "File saved to Downloads",
      });
    } catch (err) {
      console.log("DOWNLOAD ERROR", err);
      Toast.show({
        type: "error",
        text1: "Download Failed",
      });
    }
  };

  // const handleDownload = async (doc) => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");

  //     const fileUri =
  //       FileSystem.documentDirectory +
  //       doc.originalName.replace(/\s/g, "_");

  //     const result = await FileSystem.downloadAsync(
  //       `${BASE_URL}/documents/download/${doc._id}`,
  //       fileUri,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     // 🔥 Open Share Sheet (user can Save / Open / Send)
  //     await Sharing.shareAsync(result.uri);

  //     Toast.show({
  //       type: "success",
  //       text1: "Downloaded successfully",
  //     });
  //   } catch (err) {
  //     console.log("DOWNLOAD ERROR", err);
  //     Toast.show({
  //       type: "error",
  //       text1: "Download Failed",
  //     });
  //   }
  // };

  const handleShare = async (doc) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const fileUri =
        FileSystem.cacheDirectory + doc.originalName.replace(/\s/g, "_");

      await FileSystem.downloadAsync(
        `${BASE_URL}/documents/download/${doc._id}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Toast.show({ type: "error", text1: "Share Failed" });
    }
  };

  const handleDelete = (doc) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete ${doc.docName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(doc._id).unwrap();

              // ✅ ONLY reset that document (keep card)
              setDocs((prev) => ({
                ...prev,
                [doc.docKey]: null,
              }));

              Toast.show({
                type: "success",
                text1: `${doc.docName} Deleted`,
                text2: "Successfully",
              });
            } catch (err) {
              console.log("DELETE ERROR", err);
              Toast.show({
                type: "error",
                text1: "Delete Failed",
              });
            }
          },
        },
      ]
    );
  };

  const filteredDocuments = useMemo(() => {
    const constantKeys = [
      "AADHAAR",
      "PAN",
      "DL",
      "Passport",
      "Insurance",
      "Salary",
      "Bank",
    ];

    // When not searching, show only MANUAL / OTHER uploaded documents in the list
    if (!searchQuery.trim()) {
      return documents.filter(
        (d) => d.docKey === "MANUAL" || d.docKey === "OTHER"
      );
    }

    // When searching, show ALL documents that match the query (including constants)
    return documents.filter((doc) =>
      doc.docName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  const DocumentCard = ({
    title,
    desc,
    docKey,
    uploaded,
    onUpload,
    onDelete,
    countText,
    onView, // optional override for View action
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              uploaded ? styles.greenBg : styles.blueBg,
            ]}
          >
            <Icon
              name={uploaded ? "check" : "card-account-details-outline"}
              size={22}
              color={uploaded ? "#16a34a" : "#2563eb"}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {uploaded ? (
              <View>
                <Text style={styles.successText}>
                  {countText ?? "Uploaded Successfully"}
                </Text>
                {uploaded?.createdAt && (
                  <Text style={styles.dateText}>
                    Uploaded on:{" "}
                    {new Date(uploaded.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.subText}>{desc}</Text>
            )}
          </View>

          {!uploaded && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onUpload(docKey, title)}
            >
              <Text style={styles.primaryBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons Row (Only when uploaded) */}
        {uploaded && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => (onView ? onView(uploaded) : handleView(uploaded))}
            >
              <Icon name="eye-outline" size={20} color="#2563EB" />
              <Text style={[styles.actionText, { color: "#2563EB" }]}>
                View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDownload(uploaded)}
            >
              <Icon name="download-outline" size={20} color="#16A34A" />
              <Text style={[styles.actionText, { color: "#16A34A" }]}>
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleShare(uploaded)}
            >
              <Icon name="share-variant-outline" size={20} color="#7C3AED" />
              <Text style={[styles.actionText, { color: "#7C3AED" }]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(uploaded)}
            >
              <Icon name="delete-outline" size={20} color="#DC2626" />
              <Text style={[styles.actionText, { color: "#DC2626" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <TextInput
                style={styles.Txtinput}
                placeholder="Search Documents..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {!searchQuery.trim() && (
                <>
                  <DocumentCard
                    title="Aadhaar Card"
                    desc="Upload ID card"
                    docKey="AADHAAR"
                    uploaded={getDoc("AADHAAR")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />

                  <DocumentCard
                    title="PAN Card"
                    desc="Upload document"
                    docKey="PAN"
                    uploaded={getDoc("PAN")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />

                  <DocumentCard
                    title="Driving License"
                    desc="Upload driving license"
                    docKey="DL"
                    uploaded={getDoc("DL")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />
                  <DocumentCard
                    title="Passport"
                    desc="Upload passport"
                    docKey="Passport"
                    uploaded={getDoc("Passport")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />
                  <DocumentCard
                    title="Insurance Policy"
                    desc="Upload Insurance Policy"
                    docKey="Insurance"
                    uploaded={getDoc("Insurance")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />
                  <DocumentCard
                    title="Salary Slip"
                    desc="Upload Salary Slip"
                    docKey="Salary"
                    uploaded={getDoc("Salary")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />
                  <DocumentCard
                    title="Bank Statement"
                    desc="Upload Bank Statement"
                    docKey="Bank"
                    uploaded={getDoc("Bank")}
                    onUpload={uploadDocumentByType}
                    onDelete={handleDelete}
                  />

                  {/* Other Documents */}
                  <Text style={styles.sectionTitle}>Other Documents</Text>

                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => setModalVisible(true)}
                  >
                    <View style={styles.row}>
                      <View style={[styles.iconCircle, styles.blueBg]}>
                        <Icon name="upload-outline" size={22} color="#2563eb" />
                      </View>
                      <Text style={[styles.cardTitle, { flex: 1 }]}>
                        Manually Upload Document
                      </Text>
                      <Icon name="chevron-right" size={26} />
                    </View>
                  </TouchableOpacity>

                  {/* MODAL */}
                  <Modal
                    transparent
                    animationType="fade"
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                  >
                    <View style={styles.overlay}>
                      <View style={styles.modalBox}>
                        {/* Title */}
                        <Text style={styles.modalTitle}>Manual Upload</Text>

                        {/* Document Name */}
                        <Text style={styles.label}>Document Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter Document Name"
                          placeholderTextColor="#6b7280"
                          value={docName}
                          onChangeText={setDocName}
                        />

                        {/* File Attachment */}
                        <Text style={[styles.label, { marginTop: 16 }]}>
                          File Attachment
                        </Text>

                        <Pressable style={styles.uploadBox} onPress={pickFile}>
                          <Ionicons
                            name="cloud-upload"
                            size={28}
                            color="#1565C0"
                          />
                          <Text style={styles.uploadText}>
                            {files && files.length > 0
                              ? `${files.length} file(s) selected`
                              : file
                                ? file.name
                                : "Click to Upload File"}
                          </Text>
                          <Text style={styles.fileType}>
                            PDF, JPG, or PNG etc
                          </Text>
                        </Pressable>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setModalVisible(false)}
                          >
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.uploadBtn,
                              isManualUploading && { opacity: 0.6 },
                            ]}
                            onPress={handleManualUpload}
                            disabled={isManualUploading}
                          >
                            {isManualUploading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.uploadBtnText}>Upload</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>

                  {/* Manual / Other Uploaded Summary */}
                  {groupedDocs.MANUAL?.length > 0 && (
                    <DocumentCard
                      title={"Manual Uploads"}
                      uploaded={groupedDocs.MANUAL[0]}
                      countText={`${groupedDocs.MANUAL.length} Uploaded Successfully`}
                      onView={() => {
                        if (groupedDocs.MANUAL.length === 1) {
                          // single file → open directly
                          handleView(groupedDocs.MANUAL[0]);
                        } else {
                          // multiple files → open modal
                          openGroupModal("Manual Uploads");
                        }
                      }}
                    />
                  )}

                  {/* Uploaded Documents */}
                  <Text style={styles.sectionTitle}>Uploaded Documents</Text>
                  {Object.keys(otherGroups).length > 0 && (
                    <>
                      {Object.entries(otherGroups).map(([name, docs]) => (
                        <DocumentCard
                          key={name}
                          title={name}
                          uploaded={docs[0]}
                          countText={`${docs.length} Uploaded Successfully`}
                          onView={() =>
                            docs.length === 1
                              ? handleView(docs[0])
                              : openGroupModal(name)
                          }
                        />
                      ))}
                    </>
                  )}
                </>
              )}
              {isLoading && (
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              )}
              {isError && (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: "red", textAlign: "center" }}>
                    {isError}
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => (
            <DocumentCard
              title={item.docName}
              uploaded={item}
              onView={handleView}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          )}
          ListFooterComponent={() => <View style={{ marginBottom: 40 }} />}
        />
      </View>

      {/* Group files modal (shows when a grouped card's View is tapped) */}
      <Modal
        visible={groupModalVisible}
        animationType="slide"
        onRequestClose={() => setGroupModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.card, { margin: 16 }]}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, styles.greenBg]}>
                <Icon name="check" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{groupTitle}</Text>
                <Text style={styles.successText}>
                  {groupFilesList.length} Uploaded Successfully
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
                <Text style={{ color: "#2563EB", fontWeight: "600" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview area */}
          <View style={styles.previewContainer}>
            {isPreviewLoading ? (
              <ActivityIndicator size="large" color="#2563EB" />
            ) : groupPreviewUri ? (
              <>
                <View style={styles.previewNav}>
                  <TouchableOpacity
                    onPress={() => previewIndex(activeIndex - 1)}
                    style={styles.navBtn}
                  >
                    <Text style={{ fontSize: 22 }}>‹</Text>
                  </TouchableOpacity>

                  <View style={styles.previewBox}>
                    {groupPreviewType?.includes("image") ? (
                      <Image
                        source={{ uri: groupPreviewUri }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : groupPreviewType?.includes("video") ? (
                      <WebView
                        originWhitelist={["*"]}
                        source={{
                          html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="margin:0;background:#000"><video controls autoplay style="width:100%;height:100%"><source src="${groupPreviewUri}" type="${groupPreviewType}"/></video></body></html>`,
                        }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <View
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "#6b7280" }}>
                          Preview not available
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleView(groupFilesList[activeIndex])
                          }
                          style={{ marginTop: 8 }}
                        >
                          <Text style={{ color: "#2563EB", fontWeight: "600" }}>
                            Open
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => previewIndex(activeIndex + 1)}
                    style={styles.navBtn}
                  >
                    <Text style={{ fontSize: 22 }}>›</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleDownload(groupFilesList[activeIndex])}
                  >
                    <Icon name="download-outline" size={20} color="#16A34A" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShare(groupFilesList[activeIndex])}
                  >
                    <Icon
                      name="share-variant-outline"
                      size={20}
                      color="#7C3AED"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(groupFilesList[activeIndex])}
                  >
                    <Icon name="delete-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ color: "#6b7280" }}>Select a file to preview</Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            {groupFilesList.map((doc, idx) => (
              <View
                key={doc._id}
                style={[styles.card, { paddingVertical: 12, marginBottom: 8 }]}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {doc.originalName || doc.docName}
                    </Text>
                    {doc.createdAt && (
                      <Text style={styles.dateText}>
                        Uploaded on:{" "}
                        {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    )}
                  </View>

                  <View style={styles.iconRow}>
                    <TouchableOpacity
                      onPress={() =>
                        previewGroupFileByDocs(groupFilesList, idx)
                      }
                    >
                      <Icon name="eye-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDownload(doc)}>
                      <Icon name="download-outline" size={18} color="#16A34A" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleShare(doc)}>
                      <Icon
                        name="share-variant-outline"
                        size={18}
                        color="#7C3AED"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDelete(doc)}>
                      <Icon name="delete-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={viewVisible} animationType="slide">
        {viewType?.includes("image") ? (
          <Image
            source={{ uri: viewUri }}
            style={{ flex: 1, resizeMode: "contain" }}
          />
        ) : (
          <WebView source={{ uri: viewUri }} style={{ flex: 1 }} />
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default UploadDocumentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  Txtinput: {
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  blueBg: {
    backgroundColor: "#dbeafe",
  },
  greenBg: {
    backgroundColor: "#dcfce7",
  },
  redBg: {
    backgroundColor: "#fee2e2",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  subText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  successText: {
    fontSize: 13,
    color: "#16a34a",
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: "#fff",

    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  manualCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  manualText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  /* Manual files list */
  multiFileBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    elevation: 1,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countTextGreen: {
    color: "#16a34a",
    fontWeight: "700",
    marginBottom: 8,
  },

  /* Group Preview */
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  previewNav: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBox: {
    flex: 1,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    marginTop: 8,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "500",
  },
  fileType: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
