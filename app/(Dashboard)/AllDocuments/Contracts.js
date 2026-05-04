// import AsyncStorage from "@react-native-async-storage/async-storage";
// import ProgressBarAndroid from "@react-native-community/progress-bar-android";
// import { useFocusEffect } from "@react-navigation/native";
// import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from "expo-file-system/legacy";
// import * as MediaLibrary from "expo-media-library";
// import * as ScreenCapture from "expo-screen-capture";
// import * as Sharing from "expo-sharing";
// import { useCallback, useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   Pressable,
//   ProgressViewIOS,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Toast from "react-native-toast-message";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useSelector } from "react-redux";
// // import { WebView } from "react-native-webview";
// import { BACKEND_IP, BACKEND_PORT } from "../../../src/config";
// import {
//   useAdminDownloadDocumentQuery,
//   useAdminRenameDocumentMutation,
//   useAdminUploadDocumentMutation,
//   useDocumentViewQuery,
//   useGetDocumentWithCategoriesQuery,
//   useLazyAdminDownloadDocumentQuery,
//   useLazyAdminShareDocumentQuery,
// } from "../../../src/services/apiSlice";

// const ClientStrategies = () => {
//   const role = useSelector((state) => state.auth.role);

//   const [open, setOpen] = useState(false);
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [modalVisible, setModalVisible] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [sheetVisible, setSheetVisible] = useState(false);
//   const [viewerVisible, setViewerVisible] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   // Modal states - moved to parent
//   const [docName, setDocName] = useState("");
//   const [files, setFiles] = useState([]);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [isUploading, setIsUploading] = useState(false);
//   const uploadLock = useRef(false);

//   const [file, setFile] = useState(null);

//   const BACKEND_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

//   // 🔒 Prevent Screenshots
//    useFocusEffect(
//      useCallback(() => {
//        let isActive = true;

//        const enableSecure = async () => {
//          try {
//            if (Platform.OS === "android") {
//              await ScreenCapture.preventScreenCaptureAsync();
//            }
//          } catch (e) {
//            console.log("❌ Screen capture prevent error:", e);
//          }
//        };

//        enableSecure();

//        return () => {
//          if (isActive) {
//            ScreenCapture.allowScreenCaptureAsync().catch(() => {});
//            isActive = false;
//          }
//        };
//      }, []),
//    );

//   const [uploadDocument] = useAdminUploadDocumentMutation();
//   const { data: strategyDocumentsData, refetch } =
//     useGetDocumentWithCategoriesQuery({
//       refetchOnMountOrArgChange: true,
//       docKey: "CLIENT_STRATEGY",
//     });

//   const [renameDocument] = useAdminRenameDocumentMutation();
//   const {
//     data: downloadData,
//     downloadDocument,
//     isDownloading,
//     downloadError,
//     downloadProgress: downloadProgressValue,
//   } = useAdminDownloadDocumentQuery();

//   const [triggerShare, { isLoading: isTriggeringShare }] =
//     useLazyAdminShareDocumentQuery();
//   const [triggerDownload, { isLoading: isTriggeringDownload }] =
//     useLazyAdminDownloadDocumentQuery();

//   const [renameModalVisible, setRenameModalVisible] = useState(false);
//   const [renameValue, setRenameValue] = useState("");
//   const [renameTargetFiles, setRenameTargetFiles] = useState([]);
//   const [downloadProgressState, setDownloadProgressState] = useState({});
//   const [downloadModalVisible, setDownloadModalVisible] = useState(false);
//   const [downloadTargetFiles, setDownloadTargetFiles] = useState([]);
//   const [downloadProgress, setDownloadProgress] = useState(0);
//   const [loadingAction, setLoadingAction] = useState({ type: null, id: null });

//   // Extract documents array from API response (handle both direct array and wrapped response)
//   const strategyDocuments = Array.isArray(strategyDocumentsData)
//     ? strategyDocumentsData
//     : strategyDocumentsData?.documents || strategyDocumentsData?.data || [];

//   // Map file types to icons and colors
//   const getFileTypeInfo = (fileName) => {
//     const ext = fileName.split(".").pop().toLowerCase();

//     const typeMap = {
//       pdf: { icon: "file-pdf-box", color: "#dc2626", bg: "#fee2e2" },
//       doc: { icon: "file-word", color: "#2563eb", bg: "#dbeafe" },
//       docx: { icon: "file-word", color: "#2563eb", bg: "#dbeafe" },
//       xls: { icon: "file-excel", color: "#16a34a", bg: "#dcfce7" },
//       xlsx: { icon: "file-excel", color: "#16a34a", bg: "#dcfce7" },
//       ppt: { icon: "file-powerpoint-box", color: "#ea580c", bg: "#ffedd5" },
//       pptx: { icon: "file-powerpoint-box", color: "#ea580c", bg: "#ffedd5" },
//       txt: { icon: "file-document-outline", color: "#64748b", bg: "#f1f5f9" },
//       Image: { icon: "file-image", color: "#f59e0b", bg: "#fffbeb" },
//     };

//     return (
//       typeMap[ext] || { icon: "file-outline", color: "#6b7280", bg: "#f3f4f6" }
//     );
//   };

//   // Format document data for display
//   const formatDocuments = (docs) => {
//     if (!docs || !Array.isArray(docs) || docs.length === 0) return [];

//     // Group documents by docName
//     const groupedDocs = {};

//     docs.forEach((doc) => {
//       const docName = doc.docName || "Unknown";
//       if (!groupedDocs[docName]) {
//         groupedDocs[docName] = [];
//       }
//       groupedDocs[docName].push(doc);
//     });

//     // Format grouped documents
//     return Object.entries(groupedDocs).map(([docName, docsArray]) => {
//       const firstDoc = docsArray[0];
//       const typeInfo = getFileTypeInfo(
//         firstDoc.name || firstDoc.fileName || "",
//       );
//       const date = firstDoc.createdAt
//         ? new Date(firstDoc.createdAt).toLocaleDateString("en-US", {
//             year: "numeric",
//             month: "short",
//             day: "numeric",
//           })
//         : "Unknown";

//       const fileCount = docsArray.length;

//       // include all files in this group so viewer can navigate between them
//       const files = docsArray.map((d) => ({
//         id: d._id || d.id || d.fileId || null,
//         name: d.name || d.fileName || d.docName || docName,
//         size: d.size || d.fileSize || 0,
//       }));

//       return {
//         id: docName,
//         files,
//         name: docName,
//         date: date,
//         fileCount: fileCount,
//         ...typeInfo,
//       };
//     });
//   };

//   const displayDocuments = formatDocuments(strategyDocuments);

//   // Filter documents based on search query
//   const filteredDocuments = displayDocuments.filter((doc) =>
//     doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
//   );
//   const onRefreshAll = async () => {
//     setRefreshing(true);
//     try {
//       await refetch(); // RTK Query
//     } catch (e) {
//       console.log("REFRESH ERROR", e);
//     } finally {
//       setRefreshing(false);
//     }
//   };
//   const handleOpen = () => {
//     if (open) return;
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//   };

//   const openMenu = () => setMenuVisible(true);
//   const closeMenu = () => setMenuVisible(false);

//   const AddDocumentModal = ({ visible, onClose }) => {
//     const [docName, setDocName] = useState("");
//     const [files, setFiles] = useState([]);
//     const [uploadProgress, setUploadProgress] = useState(0);
//     const [isUploading, setIsUploading] = useState(false);
//     const uploadLock = useRef(false);

//     const pickDocument = async () => {
//       try {
//         const res = await DocumentPicker.getDocumentAsync({
//           type: "*/*",
//           multiple: true,
//           copyToCacheDirectory: true,
//         });

//         if (res.canceled || !res.assets) return;

//         // Process all selected files
//         const newFiles = res.assets.filter((file) => {
//           // Validation
//           const maxSize = 50 * 1024 * 1024; // 50MB
//           if (file.size > maxSize) {
//             Alert.alert("File Too Large", `${file.name} exceeds 50MB limit`);
//             return false;
//           }
//           return true;
//         });

//         setFiles((prev) => [...prev, ...newFiles]);
//       } catch (e) {
//         Alert.alert("Error", "Could not open document picker");
//       }
//     };

//     const removeFile = (index) => {
//       setFiles(files.filter((_, i) => i !== index));
//     };
//     const getSafeUploadName = (file, index) => {
//       if (!file) return `document_${index}.bin`;

//       if (file.name && file.name.includes(".")) {
//         return file.name;
//       }

//       const mime = file.mimeType || file.type;
//       if (mime && mime.includes("/")) {
//         const ext = mime.split("/")[1];
//         return `document_${index}.${ext}`;
//       }

//       return `document_${index}.bin`;
//     };

//     const handleUpload = async () => {
//       if (uploadLock.current) return; // ⛔ block second tap
//       uploadLock.current = true;

//       if (!docName.trim()) {
//         Alert.alert("Validation Error", "Please enter a document name.");
//         uploadLock.current = false;
//         return;
//       }
//       if (files.some((f) => !f || (!f.mimeType && !f.type))) {
//         Alert.alert(
//           "Validation Error",
//           "One or more selected files have unsupported type.",
//         );
//         uploadLock.current = false;
//         return;
//       }

//       if (files.length === 0) {
//         Alert.alert(
//           "Validation Error",
//           "Please select at least one file to upload.",
//         );
//         uploadLock.current = false;
//         return;
//       }

//       try {
//         setIsUploading(true);
//         setUploadProgress(0);

//         const formData = new FormData();

//         // Add all files (skip any null entries)
//         files.forEach((file, index) => {
//           if (!file) return;
//           formData.append("files", {
//             uri: file.uri,
//             name: getSafeUploadName(file, index),
//             type: file?.mimeType || "application/octet-stream",
//           });
//         });

//         formData.append("docName", docName);
//         formData.append("docKey", "CLIENT_STRATEGY");

//         // Simulate upload progress
//         const progressInterval = setInterval(() => {
//           setUploadProgress((prev) => {
//             if (prev >= 90) {
//               clearInterval(progressInterval);
//               return prev;
//             }
//             return prev + Math.random() * 30;
//           });
//         }, 300);

//         console.log(
//           "Uploading files metadata:",
//           files.map((f) => ({
//             name: f?.name || null,
//             size: f?.size || null,
//             uri: f?.uri || null,
//             mimeType: f?.mimeType || f?.type || null,
//             type: f?.mimeType || f?.type || null,
//           })),
//         );
//         const response = await uploadDocument(formData).unwrap();
//         console.log("Upload Response:", response);

//         clearInterval(progressInterval);
//         setUploadProgress(100);

//         Toast.show({
//           type: "success",
//           text1: "Success ✅",
//           text2: `${files.length} documents uploaded successfully`,
//           duration: 2000,
//         });
//         onClose();
//         // Close modal and reset state after a short delay
//         setTimeout(() => {
//           setDocName("");
//           setFiles([]);
//           setUploadProgress(0);
//           setIsUploading(false);
//           uploadLock.current = false;
//         }, 300);
//       } catch (error) {
//         console.error("Upload Error:", error);
//         // Try to show helpful server message when available
//         const serverMsg =
//           error?.data?.message ||
//           error?.error ||
//           (error?.data && JSON.stringify(error.data)) ||
//           null;
//         Toast.show({
//           type: "error",
//           text1: "Upload Failed",
//           text2: serverMsg || "Failed to upload document. Please try again.",
//         });
//         setIsUploading(false);
//         setUploadProgress(0);
//         uploadLock.current = false;
//       }
//     };

//     return (
//       <Modal
//         visible={visible}
//         transparent
//         animationType="slide"
//         statusBarTranslucent
//         onRequestClose={onClose}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={styles.overlay}
//         >
//           {/* Tap outside to close - disabled during upload */}
//           {!isUploading && (
//             <TouchableOpacity
//               style={styles.backdrop}
//               activeOpacity={1}
//               onPress={onClose}
//             />
//           )}
//           {isUploading && <View style={styles.backdrop} />}

//           {/* Bottom Sheet */}
//           <View style={styles.sheet}>
//             {/* Handle */}
//             <View style={styles.handle} />

//             {/* Header */}
//             <View style={styles.header}>
//               <Text style={styles.title}>Add New Document</Text>
//               <TouchableOpacity
//                 onPress={() => !isUploading && onClose()}
//                 disabled={isUploading}
//               >
//                 <Ionicons
//                   name="close"
//                   size={22}
//                   color={isUploading ? "#ccc" : "#64748b"}
//                 />
//               </TouchableOpacity>
//             </View>

//             {/* Content */}
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.content}
//             >
//               {/* Document Name */}
//               <Text style={styles.label}>DOCUMENT NAME</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter file name (e.g., Q4 Report)"
//                 placeholderTextColor="#94a3b8"
//                 value={docName}
//                 onChangeText={setDocName}
//                 editable={!isUploading}
//               />

//               {/* Attach Document */}
//               <Text style={styles.label}>ATTACH DOCUMENT</Text>

//               <TouchableOpacity
//                 style={[styles.uploadBox, isUploading && { opacity: 0.5 }]}
//                 onPress={pickDocument}
//                 disabled={isUploading}
//               >
//                 <Ionicons
//                   name="cloud-upload-outline"
//                   size={32}
//                   color="#008080"
//                 />
//                 <Text style={styles.uploadText}>Tap to select file</Text>
//                 <Text style={styles.uploadSub}>PDF, DOCX, XLSX up to 50MB</Text>
//               </TouchableOpacity>

//               {/* Selected Files List */}
//               {files.length > 0 && (
//                 <>
//                   <View style={styles.attachedHeader}>
//                     <View style={styles.attachedBadge}>
//                       <Ionicons
//                         name="checkmark-circle"
//                         size={16}
//                         color="#fff"
//                       />
//                       <Text style={styles.attachedBadgeText}>
//                         {files.length} file(s) attached
//                       </Text>
//                     </View>
//                   </View>

//                   {files.map((file, index) => (
//                     <View key={index} style={styles.fileListItem}>
//                       <View style={styles.fileIconSmall}>
//                         <MaterialCommunityIcons
//                           name="file"
//                           size={20}
//                           color="#008080"
//                         />
//                       </View>

//                       <View style={{ flex: 1 }}>
//                         <Text style={styles.fileNameSmall} numberOfLines={1}>
//                           {file.name}
//                         </Text>
//                         <Text style={styles.fileMetaSmall}>
//                           {(file.size / (1024 * 1024)).toFixed(2)} MB
//                         </Text>
//                       </View>

//                       <TouchableOpacity
//                         onPress={() => removeFile(index)}
//                         disabled={isUploading}
//                         style={styles.removeBtn}
//                       >
//                         <Ionicons
//                           name="close-circle"
//                           size={24}
//                           color={isUploading ? "#ccc" : "#ef4444"}
//                         />
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </>
//               )}

//               {/* Upload Progress */}
//               {isUploading && (
//                 <View style={styles.progressSection}>
//                   <View style={styles.progressHeader}>
//                     <Text style={styles.progressText}>Uploading...</Text>
//                     <Text style={styles.progressPercent}>
//                       {Math.round(uploadProgress)}%
//                     </Text>
//                   </View>
//                   {Platform.OS === "ios" ? (
//                     <ProgressViewIOS
//                       progress={uploadProgress / 100}
//                       style={styles.progressBar}
//                     />
//                   ) : (
//                     <ProgressBarAndroid
//                       progress={uploadProgress / 100}
//                       styleAttr="Horizontal"
//                       color="#008080"
//                       style={styles.progressBar}
//                     />
//                   )}
//                 </View>
//               )}

//               {/* Upload Button */}
//               <TouchableOpacity
//                 style={[
//                   styles.uploadBtn,
//                   isUploading && { backgroundColor: "#666" },
//                   files.length === 0 &&
//                     !isUploading && { backgroundColor: "#ccc" },
//                 ]}
//                 onPress={handleUpload}
//                 disabled={isUploading || files.length === 0}
//               >
//                 {isUploading ? (
//                   <>
//                     <Ionicons name="hourglass-outline" size={18} color="#fff" />
//                     <Text style={styles.uploadBtnText}>
//                       {" "}
//                       Uploading {Math.round(uploadProgress)}%
//                     </Text>
//                   </>
//                 ) : (
//                   <>
//                     <Ionicons name="cloud-upload" size={18} color="#fff" />
//                     <Text style={styles.uploadBtnText}>
//                       {" "}
//                       {files.length > 0 ? "Upload Files" : "Select File First"}
//                     </Text>
//                   </>
//                 )}
//               </TouchableOpacity>

//               {/* Cancel */}
//               <TouchableOpacity
//                 onPress={onClose}
//                 disabled={isUploading}
//                 style={{ opacity: isUploading ? 0.5 : 1 }}
//               >
//                 <Text style={styles.cancelText}>Cancel</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     );
//   };

//   const RenameModal = ({ visible, onClose }) => {
//     const handleRename = async () => {
//       if (!renameValue || renameValue.trim() === "") {
//         Toast.show({ type: "error", text1: "Name required" });
//         return;
//       }

//       try {
//         const ids = (renameTargetFiles || []).map((f) => f.id).filter(Boolean);
//         if (ids.length === 0) {
//           Toast.show({ type: "info", text1: "No files to rename" });
//           onClose();
//           return;
//         }

//         await Promise.all(
//           ids.map((id) =>
//             renameDocument({ id, docName: renameValue }).unwrap(),
//           ),
//         );

//         Toast.show({
//           type: "success",
//           text1: "Renamed",
//           text2: "Document(s) renamed",
//         });
//         refetch();
//         onClose();
//       } catch (err) {
//         console.error("Rename error:", err);
//         Toast.show({ type: "error", text1: "Rename failed" });
//       }
//     };

//     return (
//       <Modal
//         visible={visible}
//         transparent
//         animationType="fade"
//         statusBarTranslucent
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={{ flex: 1, justifyContent: "flex-end" }}
//           keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
//         >
//           <Pressable style={styles.backdrop} onPress={onClose} />
//           <View style={[styles.sheet, { padding: 20, margin: 20 }]}>
//             <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
//               Rename Document
//             </Text>
//             <TextInput
//               style={[styles.input, { marginBottom: 12 }]}
//               value={renameValue}
//               onChangeText={setRenameValue}
//               placeholder="New name"
//               returnKeyType="done"
//               blurOnSubmit={true}
//             />
//             <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
//               <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
//                 <Text style={{ color: "#64748b" }}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity onPress={handleRename}>
//                 <Text style={{ color: "#2563eb", fontWeight: "700" }}>
//                   Rename
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     );
//   };
//   const FileActionSheet = ({ visible, onClose, fileData }) => {
//     if (!visible) {
//       return null;
//     }

//     // Get file info from passed data or use defaults
//     const displayName = fileData?.name || "Document.pdf";
//     const displaySize = fileData?.fileCount || 1;
//     const displayDate = fileData?.date || "Unknown date";
//     const displayIcon = fileData?.icon || "file-pdf-box";
//     const displayColor = fileData?.color || "#ef4444";

//     return (
//       <Modal visible={visible} transparent animationType="slide">
//         <Pressable style={styles.backdrop} onPress={onClose} />

//         <View style={styles.sheet}>
//           <View style={styles.handle} />

//           <View style={styles.fileHeader}>
//             <MaterialCommunityIcons
//               name={displayIcon}
//               size={42}
//               color={displayColor}
//             />
//             <View style={{ marginLeft: 12 }}>
//               <Text style={styles.fileName} numberOfLines={2}>
//                 {displayName}
//               </Text>
//               <Text style={styles.fileMeta}>
//                 {displaySize} file{displaySize > 1 ? "s" : ""} · {displayDate}
//               </Text>
//             </View>
//           </View>

//           <TouchableOpacity
//             style={styles.actionRow}
//             onPress={() => {
//               setFile({
//                 files: fileData?.files || [],
//                 currentIndex: 0,
//                 name: fileData?.name,
//                 size: fileData?.fileCount,
//               });
//               setViewerVisible(true);
//               onClose();
//             }}
//           >
//             <Ionicons name="eye-outline" size={22} color="#334155" />
//             <Text style={styles.actionText}>View Document</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionRow}
//             onPress={() => {
//               // start share; close modal when server share has started
//               shareDocumentHandler(fileData?.files || fileData?.id, () =>
//                 onClose(),
//               );
//             }}
//             disabled={loadingAction.type === "share"}
//           >
//             <Ionicons name="share-outline" size={22} color="#334155" />
//             <Text style={styles.actionText}>Share</Text>
//             {(() => {
//               const primaryId = fileData?.files?.[0]?.id || fileData?.id;
//               if (
//                 loadingAction.type === "share" &&
//                 loadingAction.id === primaryId
//               ) {
//                 return (
//                   <ActivityIndicator
//                     size="small"
//                     color="#2563eb"
//                     style={{ marginLeft: 8 }}
//                   />
//                 );
//               }
//               return null;
//             })()}
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionRow}
//             onPress={() => {
//               setDownloadTargetFiles(fileData?.files || []);
//               setDownloadModalVisible(true);
//               onClose();
//               setDownloadProgress(0);
//             }}
//           >
//             <Ionicons name="download-outline" size={22} color="#334155" />
//             <Text style={styles.actionText}>Download</Text>
//           </TouchableOpacity>

//           <View style={styles.divider} />

//           <TouchableOpacity
//             style={styles.actionRow}
//             onPress={() => {
//               setRenameTargetFiles(fileData?.files || []);
//               setRenameValue(fileData?.name || "");
//               setRenameModalVisible(true);
//               onClose();
//             }}
//           >
//             <Ionicons name="pencil-outline" size={22} color="#334155" />
//             <Text style={styles.actionText}>Rename File</Text>
//           </TouchableOpacity>

//           <View style={styles.divider} />

//           <Action icon="trash-outline" text="Delete" danger />
//         </View>
//       </Modal>
//     );
//   };

//   const Action = ({ icon, text, danger }) => (
//     <TouchableOpacity style={styles.actionRow}>
//       <Ionicons name={icon} size={22} color={danger ? "#ef4444" : "#334155"} />
//       <Text style={[styles.actionText, danger && { color: "#ef4444" }]}>
//         {text}
//       </Text>
//     </TouchableOpacity>
//   );

//   const downloadAndSave = async (file, { saveToFolder = false } = {}) => {
//     try {
//       const token = await AsyncStorage.getItem("token");

//       const fileId = file?.id || file?._id || file?.fileId || file;
//       const fileName = (
//         file?.name ||
//         file?.originalName ||
//         fileId ||
//         "file"
//       ).replace(/[^a-zA-Z0-9._-]/g, "_");

//       // Probe endpoints to find a working download URL
//       const tryUrls = [
//         `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/download/${fileId}`,
//         `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/download/${fileId}`,
//       ];

//       let goodUrl = null;
//       for (const u of tryUrls) {
//         try {
//           const r = await fetch(u, {
//             method: "HEAD",
//             headers: { Authorization: token ? `Bearer ${token}` : "" },
//           });
//           if (r.ok) {
//             goodUrl = u;
//             break;
//           }
//         } catch (e) {
//           // ignore and try next
//         }
//       }

//       if (!goodUrl) {
//         // fallback to first admin url
//         goodUrl = tryUrls[0];
//       }

//       const tempUri = FileSystem.cacheDirectory + fileName;

//       const downloadResumable = FileSystem.createDownloadResumable(
//         goodUrl,
//         tempUri,
//         { headers: { Authorization: token ? `Bearer ${token}` : "" } },
//         (progress) => {
//           try {
//             const pct =
//               progress.totalBytesExpectedToWrite > 0
//                 ? Math.round(
//                     (progress.totalBytesWritten /
//                       progress.totalBytesExpectedToWrite) *
//                       100,
//                   )
//                 : 0;
//             setDownloadProgress(pct);
//           } catch (e) {}
//         },
//       );

//       const { uri } = await downloadResumable.downloadAsync();

//       if (saveToFolder && Platform.OS === "android") {
//         // Use SAF to save to user chosen directory (Android)
//         try {
//           const permission =
//             await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
//           if (!permission.granted) {
//             Toast.show({ type: "error", text1: "Permission denied" });
//             return uri;
//           }

//           try {
//             const destUri =
//               await FileSystem.StorageAccessFramework.createFileAsync(
//                 permission.directoryUri,
//                 fileName,
//                 file?.mimeType || "application/octet-stream",
//               );

//             const b64 = await FileSystem.readAsStringAsync(uri, {
//               encoding: FileSystem.EncodingType.Base64,
//             });
//             await FileSystem.writeAsStringAsync(destUri, b64, {
//               encoding: FileSystem.EncodingType.Base64,
//             });

//             Toast.show({ type: "success", text1: `Saved ${fileName}` });
//             return destUri;
//           } catch (safErr) {
//             console.error("SAF create/write failed", safErr);
//             // Fallback: open share sheet so user can save the file manually
//             try {
//               if (await Sharing.isAvailableAsync()) {
//                 await Sharing.shareAsync(uri);
//                 Toast.show({
//                   type: "info",
//                   text1: "Save failed; opened share sheet as fallback",
//                 });
//               } else {
//                 Toast.show({ type: "error", text1: "Save failed" });
//               }
//             } catch (shareErr) {
//               console.error("Fallback share failed", shareErr);
//               Toast.show({ type: "error", text1: "Save failed" });
//             }

//             return uri;
//           }
//         } catch (e) {
//           console.error("SAF permission/request failed", e);
//           Toast.show({ type: "error", text1: "Save failed" });
//           return uri;
//         }
//       }

//       // For media files, save to media library where possible
//       const ext = (file?.name || fileName).split(".").pop().toLowerCase();
//       const mediaTypes = ["jpg", "jpeg", "png", "gif", "mp4", "mov"];
//       if (mediaTypes.includes(ext)) {
//         const { status } = await MediaLibrary.requestPermissionsAsync();
//         if (status === "granted") {
//           await MediaLibrary.createAssetAsync(uri);
//           Toast.show({ type: "success", text1: `Saved ${fileName}` });
//         } else {
//           Toast.show({
//             type: "info",
//             text1: "Permission required to save to gallery",
//           });
//         }
//         return uri;
//       }

//       // For non-media, return cached uri (caller can share or handle further)
//       return uri;
//     } catch (err) {
//       console.error("Download error:", err);
//       Toast.show({ type: "error", text1: "Download failed" });
//       throw err;
//     }
//   };

//   const DownloadModal = ({ visible, onClose, files = [] }) => {
//     const [selectedIndexes, setSelectedIndexes] = useState([]);

//     useEffect(() => {
//       setSelectedIndexes(files.map(() => true));
//     }, [files]);

//     const toggleIndex = (i) => {
//       setSelectedIndexes((s) => {
//         const copy = [...s];
//         copy[i] = !copy[i];
//         return copy;
//       });
//     };

//     const handleDownloadSelected = async () => {
//       const toDownload = files.filter((_, i) => selectedIndexes[i]);
//       if (!toDownload.length) {
//         Toast.show({ type: "info", text1: "No files selected" });
//         return;
//       }

//       try {
//         for (const f of toDownload) {
//           // When user chooses download, save to folder on Android where possible
//           await downloadAndSave(f, { saveToFolder: true });
//         }
//         Toast.show({ type: "success", text1: "All downloads complete" });
//         onClose();
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setDownloadProgress(0);
//       }
//     };

//     if (!visible) return null;

//     return (
//       <Modal visible={visible} transparent animationType="slide">
//         <Pressable style={styles.backdrop} onPress={onClose} />
//         <View style={[styles.sheet, { padding: 18 }]}>
//           <View style={styles.handle} />
//           <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
//             Download Files
//           </Text>

//           {files.length === 0 ? (
//             <Text style={styles.noDataText}>No files available</Text>
//           ) : (
//             files.map((f, i) => (
//               <TouchableOpacity
//                 key={f.id || i}
//                 onPress={() => toggleIndex(i)}
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   paddingVertical: 10,
//                 }}
//               >
//                 <Ionicons
//                   name={selectedIndexes[i] ? "checkbox" : "square-outline"}
//                   size={20}
//                   color="#2563eb"
//                 />
//                 <Text style={{ marginLeft: 10, flex: 1 }}>
//                   {f.name || f.id}
//                 </Text>
//               </TouchableOpacity>
//             ))
//           )}

//           <View
//             style={{
//               flexDirection: "row",
//               justifyContent: "flex-end",
//               marginTop: 12,
//             }}
//           >
//             <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
//               <Text style={{ color: "#64748b" }}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleDownloadSelected}>
//               <Text style={{ color: "#2563eb", fontWeight: "700" }}>
//                 Download
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     );
//   };

//   const shareDocumentHandler = async (file) => {
//     const token = await AsyncStorage.getItem("token");

//     const fileId = file._id;
//     const originalName = file.originalName; // MUST exist

//     if (!originalName || !originalName.includes(".")) {
//       throw new Error("Invalid filename from backend");
//     }

//     const url = `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/share/${fileId}`;

//     // 🔥 EXTENSION IS MANDATORY
//     const localUri = FileSystem.cacheDirectory + originalName;

//     await FileSystem.downloadAsync(url, localUri, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     await Sharing.shareAsync(localUri, {
//       dialogTitle: "Share Document",
//     });
//   };

//   const DocumentViewer = ({ visible, onClose }) => {
//     const [webViewKey, setWebViewKey] = useState(0);
//     const [currentDocIndex, setCurrentDocIndex] = useState(
//       file?.currentIndex || 0,
//     );

//     useEffect(() => {
//       setCurrentDocIndex(file?.currentIndex || 0);
//       setWebViewKey((k) => k + 1);
//     }, [file]);

//     const currentFile = file?.files?.[currentDocIndex] || null;
//     const fileName = currentFile?.name || "Document";
//     const fileSize = currentFile?.size || 0;
//     const [currentPage, setCurrentPage] = useState(1);
//     const [token, setToken] = useState(null);
//     const touchStartXRef = useRef(0);

//     // Fetch token from AsyncStorage once
//     useEffect(() => {
//       const fetchToken = async () => {
//         try {
//           const storedToken = await AsyncStorage.getItem("token");
//           setToken(storedToken);
//         } catch (error) {
//           console.error("❌ Error fetching token:", error);
//         }
//       };

//       if (visible) {
//         fetchToken();
//       }
//     }, [visible]);

//     // Construct full document URL from API with backend IP and PORT for current file
//     const documentUrl = currentFile?.id
//       ? `http://${BACKEND_IP}:${BACKEND_PORT}/api/admin/view/${currentFile.id}`
//       : null;

//     const { data: documentViewData, isLoading: isDocumentLoading } =
//       useDocumentViewQuery(currentFile?.id, { skip: !currentFile?.id });

//     // Use data from API if available
//     const totalPages =
//       documentViewData?.totalPages || documentViewData?.pages || 12;

//     // Memoize headers to prevent re-renders
//     const webViewHeaders = useCallback(
//       () => ({
//         Authorization: token ? `Bearer ${token}` : "",
//       }),
//       [token],
//     );

//     return (
//       <Modal
//         visible={visible}
//         transparent
//         animationType="slide"
//         statusBarTranslucent
//         onRequestClose={onClose}
//       >
//         <View style={styles.viewerContainer}>
//           {/* Header */}
//           <View style={styles.viewerHeader}>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="chevron-back" size={28} color="#111827" />
//             </TouchableOpacity>
//             <Text style={styles.viewerTitle} numberOfLines={1}>
//               {fileName}
//             </Text>
//             <View style={{ flexDirection: "row", alignItems: "center" }}>
//               {file?.files && file.files.length > 1 && (
//                 <>
//                   <TouchableOpacity
//                     onPress={() => {
//                       setCurrentPage(1);
//                       setCurrentDocIndex((i) => Math.max(0, i - 1));
//                       setWebViewKey((k) => k + 1);
//                     }}
//                     style={{ marginRight: 8 }}
//                   >
//                     <Ionicons
//                       name="arrow-back-circle"
//                       size={24}
//                       color="#2563eb"
//                     />
//                   </TouchableOpacity>

//                   <Text style={{ marginRight: 8, fontWeight: "700" }}>
//                     {currentDocIndex + 1}/{file.files.length}
//                   </Text>

//                   <TouchableOpacity
//                     onPress={() => {
//                       setCurrentPage(1);
//                       setCurrentDocIndex((i) =>
//                         Math.min(i + 1, file.files.length - 1),
//                       );
//                       setWebViewKey((k) => k + 1);
//                     }}
//                   >
//                     <Ionicons
//                       name="arrow-forward-circle"
//                       size={24}
//                       color="#2563eb"
//                     />
//                   </TouchableOpacity>
//                 </>
//               )}
//             </View>
//           </View>

//           {/* Secure View Badge */}
//           <View style={styles.secureBadgeViewer}>
//             <Ionicons name="shield-checkmark" size={18} color="#2563eb" />
//             <Text style={styles.secureViewText}>SECURE VIEW</Text>
//           </View>

//           {/* Swipe overlay to navigate between files (left/right) */}
//           <View
//             style={StyleSheet.absoluteFill}
//             onStartShouldSetResponder={() => true}
//             onResponderGrant={(e) => {
//               touchStartXRef.current = e.nativeEvent.pageX;
//             }}
//             onResponderRelease={(e) => {
//               const dx = e.nativeEvent.pageX - touchStartXRef.current;
//               if (!file?.files || file.files.length <= 1) return;
//               if (dx < -50) {
//                 // swipe left -> next
//                 setCurrentPage(1);
//                 setCurrentDocIndex((i) =>
//                   Math.min(i + 1, file.files.length - 1),
//                 );
//                 setWebViewKey((k) => k + 1);
//               } else if (dx > 50) {
//                 // swipe right -> prev
//                 setCurrentPage(1);
//                 setCurrentDocIndex((i) => Math.max(0, i - 1));
//                 setWebViewKey((k) => k + 1);
//               }
//             }}
//           />

//           {/* Document Viewer Area */}
//           {isDocumentLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#008080" />
//               <Text style={styles.loadingText}>Loading document...</Text>
//             </View>
//           ) : documentUrl && token ? (
//             <WebView
//               key={webViewKey}
//               style={{ flex: 1 }}
//               source={{
//                 uri: documentUrl,
//                 headers: webViewHeaders(),
//               }}
//               startInLoadingState={true}
//               cacheMode="LOAD_NO_CACHE"
//               renderLoading={() => (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator size="large" color="#008080" />
//                   <Text style={styles.loadingText}>Rendering document...</Text>
//                 </View>
//               )}
//               onError={(e) => {
//                 console.error("❌ WebView Error:", e.nativeEvent);
//                 Toast.show({
//                   type: "error",
//                   text1: "Error",
//                   text2: "Unable to load document",
//                 });
//               }}
//               javaScriptEnabled={false}
//               domStorageEnabled={false}
//               scalesPageToFit={true}
//               allowFileAccess={true}
//               mixedContentMode="always"
//             />
//           ) : (
//             <ScrollView
//               style={{ flex: 1 }}
//               contentContainerStyle={styles.scrollContent}
//               showsVerticalScrollIndicator={true}
//               scrollEventThrottle={16}
//             >
//               {documentViewData ? (
//                 <View style={styles.documentContentWrapper}>
//                   {/* If documentViewData has pages array */}
//                   {Array.isArray(documentViewData?.pages) &&
//                   documentViewData.pages.length > 0 ? (
//                     documentViewData.pages.map((page, index) => (
//                       <View key={index} style={styles.documentPage}>
//                         <View style={styles.pageHeader}>
//                           <Text style={styles.pageNumber}>
//                             Page {index + 1} of {documentViewData.pages.length}
//                           </Text>
//                         </View>
//                         <View
//                           style={[
//                             styles.documentPlaceholder,
//                             { marginBottom: 16 },
//                           ]}
//                         >
//                           <MaterialCommunityIcons
//                             name="file-pdf-box"
//                             size={50}
//                             color="#dc2626"
//                           />
//                           <Text
//                             style={styles.placeholderText}
//                             numberOfLines={2}
//                           >
//                             {page?.content || fileName}
//                           </Text>
//                           <Text style={styles.placeholderMeta}>
//                             {page?.size || fileSize} MB
//                           </Text>
//                         </View>
//                       </View>
//                     ))
//                   ) : (
//                     <View style={styles.documentPlaceholder}>
//                       <MaterialCommunityIcons
//                         name="file-pdf-box"
//                         size={60}
//                         color="#dc2626"
//                       />
//                       <Text style={styles.placeholderText} numberOfLines={2}>
//                         {fileName}
//                       </Text>
//                       <Text style={styles.placeholderSubText}>
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       <Text style={styles.placeholderMeta}>{fileSize} MB</Text>
//                       <Text style={styles.dataIndicator}>✓ Document Ready</Text>
//                     </View>
//                   )}
//                 </View>
//               ) : (
//                 <View style={styles.documentPlaceholder}>
//                   <MaterialCommunityIcons
//                     name="file-pdf-box"
//                     size={60}
//                     color="#dc2626"
//                   />
//                   <Text style={styles.placeholderText} numberOfLines={2}>
//                     {fileName}
//                   </Text>
//                   <Text style={styles.placeholderSubText}>
//                     Page {currentPage} of {totalPages}
//                   </Text>
//                   <Text style={styles.placeholderMeta}>{fileSize} MB</Text>
//                 </View>
//               )}
//             </ScrollView>
//           )}
//         </View>
//       </Modal>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.searchBox}>
//         <Ionicons name="search-outline" size={20} color="#A1A1AA" />
//         <TextInput
//           style={styles.searchInputField}
//           placeholder="Search"
//           placeholderTextColor="#A1A1AA"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//           autoCorrect={false}
//           clearButtonMode="while-editing"
//         />
//       </View>

//       {/* ===== Files Info ===== */}
//       <View style={styles.infoPill}>
//         <Text style={styles.infoText}>{filteredDocuments.length} Files</Text>
//       </View>

//       {/* ===== Documents List ===== */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 120 }}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefreshAll} />
//         }
//       >
//         {filteredDocuments.length > 0 ? (
//           filteredDocuments.map((item) => (
//             <View key={item.id} style={styles.card}>
//               <View style={[styles.fileIcon, { backgroundColor: item.bg }]}>
//                 <MaterialCommunityIcons
//                   name={item.icon}
//                   size={26}
//                   color={item.color}
//                 />
//               </View>

//               <View style={styles.fileInfo}>
//                 <Text style={styles.fileName} numberOfLines={1}>
//                   {item.name}
//                 </Text>
//                 <Text style={styles.fileMeta}>
//                   {item.date} · {item.fileCount} file
//                   {item.fileCount > 1 ? "s" : ""}
//                 </Text>

//                 <View style={styles.secureBadge}>
//                   <Ionicons name="shield-checkmark" size={14} color="#2563eb" />
//                   <Text style={styles.secureText}> SECURE</Text>
//                 </View>
//               </View>

//               <TouchableOpacity
//                 onPress={() => {
//                   setSelectedFile(item);
//                   setMenuVisible(true);
//                 }}
//               >
//                 <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
//               </TouchableOpacity>
//             </View>
//           ))
//         ) : (
//           <View style={styles.emptyContainer}>
//             <Ionicons name="document-outline" size={48} color="#ccc" />
//             <Text style={styles.emptyText}>No documents yet</Text>
//             <Text style={styles.emptySubText}>Upload files to get started</Text>
//           </View>
//         )}
//       </ScrollView>

//       {/* ===== Floating Add Button ===== */}
//       {role !== "user" && (
//         <TouchableOpacity
//           style={styles.fab}
//           onPress={() => setModalVisible(true)}
//         >
//           <Ionicons name="add" size={28} color="#fff" />
//         </TouchableOpacity>
//       )}

//       <AddDocumentModal visible={open} onClose={handleClose} />

//       <FileActionSheet
//         visible={menuVisible}
//         onClose={closeMenu}
//         fileData={selectedFile}
//       />

//       <DocumentViewer
//         visible={viewerVisible}
//         onClose={() => setViewerVisible(false)}
//       />
//       <RenameModal
//         visible={renameModalVisible}
//         onClose={() => setRenameModalVisible(false)}
//       />
//       <DownloadModal
//         visible={downloadModalVisible}
//         onClose={() => setDownloadModalVisible(false)}
//         files={downloadTargetFiles}
//       />
//     </View>
//   );
// };

// export default ClientStrategies;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f9fafb",
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 14,
//     marginBottom: 16,
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 22,
//     fontWeight: "700",
//     marginLeft: 10,
//     color: "#111827",
//   },
//   headerIcons: {
//     flexDirection: "row",
//   },
//   iconBtn: {
//     marginLeft: 16,
//   },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: "#d1d5db",
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//     marginVertical: 12,
//     marginBottom: 16,
//     marginTop: 5,
//     backgroundColor: "#fff",
//   },
//   searchBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 48,
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//   },
//   searchInputField: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 14,
//     color: "#111827",
//     height: "100%",
//     paddingVertical: 0,
//   },

//   infoPill: {
//     alignSelf: "flex-start",
//     backgroundColor: "#f1f5f9",
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 16,
//     marginTop: 12,
//   },
//   infoText: {
//     color: "#64748b",
//     fontWeight: "600",
//   },

//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 14,
//     borderRadius: 16,
//     marginBottom: 14,
//     elevation: 2,
//   },
//   fileIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },
//   fileInfo: {
//     flex: 1,
//   },
//   fileName: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#111827",
//   },
//   fileMeta: {
//     fontSize: 13,
//     color: "#6b7280",
//     marginTop: 2,
//   },
//   secureBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#e0e7ff",
//     alignSelf: "flex-start",
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 10,
//     marginTop: 6,
//   },
//   secureText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#2563eb",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#111827",
//     marginTop: 16,
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: "#6b7280",
//     marginTop: 8,
//   },

//   fab: {
//     position: "absolute",
//     right: 20,
//     bottom: 30,
//     width: 58,
//     height: 58,
//     borderRadius: 29,
//     backgroundColor: "#1976D2",
//     alignItems: "center",
//     justifyContent: "center",
//     elevation: 6,
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//   },
//   backdrop: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.4)",
//   },
//   sheet: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 8,
//     paddingBottom: 24,
//     maxHeight: "90%",
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: "#CBD5E1",
//     alignSelf: "center",
//     marginBottom: 12,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#0F172A",
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#f1f5f9",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   content: {
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//   },
//   label: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#64748b",
//     marginTop: 14,
//     marginBottom: 6,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     height: 48,
//     fontSize: 16,
//     color: "#0f172a",
//   },
//   uploadBox: {
//     borderWidth: 2,
//     borderStyle: "dashed",
//     borderColor: "#008080",
//     borderRadius: 16,
//     padding: 24,
//     alignItems: "center",
//     marginTop: 10,
//     backgroundColor: "#f0fffe",
//   },
//   uploadIconBox: {
//     marginTop: 8,
//   },
//   uploadIcon: {
//     width: 54,
//     height: 54,
//     borderRadius: 16,
//     backgroundColor: "#eff6ff",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 10,
//   },
//   uploadText: {
//     marginTop: 8,
//     fontSize: 15,
//     color: "#008080",
//     fontWeight: "500",
//     textAlign: "center",
//   },
//   uploadSub: {
//     marginTop: 4,
//     fontSize: 12,
//     color: "#64748b",
//   },
//   attachedHeader: {
//     marginTop: 16,
//     marginBottom: 12,
//   },
//   attachedBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#008080",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     alignSelf: "flex-start",
//   },
//   attachedBadgeText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#fff",
//     marginLeft: 6,
//   },
//   fileListItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 8,
//     borderLeftWidth: 3,
//     borderLeftColor: "#008080",
//   },
//   fileIconSmall: {
//     width: 40,
//     height: 40,
//     borderRadius: 8,
//     backgroundColor: "#f0fffe",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },
//   fileNameSmall: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#0f172a",
//   },
//   fileMetaSmall: {
//     fontSize: 12,
//     color: "#64748b",
//     marginTop: 2,
//   },
//   removeBtn: {
//     padding: 4,
//   },
//   progressSection: {
//     backgroundColor: "#f0fffe",
//     borderRadius: 12,
//     padding: 14,
//     marginTop: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#d0f0ee",
//   },
//   progressHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   progressText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#008080",
//   },
//   progressPercent: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#008080",
//   },
//   progressBar: {
//     height: 6,
//     borderRadius: 3,
//   },
//   uploadBtn: {
//     flexDirection: "row",
//     height: 56,
//     borderRadius: 16,
//     backgroundColor: "#008080",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 20,
//     shadowColor: "#008080",
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   uploadBtnText: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#ffffff",
//   },
//   cancelText: {
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#64748b",
//     marginTop: 14,
//   },
//   backdrop: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.35)",
//   },
//   sheet: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 22,
//     borderTopRightRadius: 22,
//     paddingBottom: 24,
//     paddingHorizontal: 16,
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     backgroundColor: "#cbd5e1",
//     borderRadius: 2,
//     alignSelf: "center",
//     marginVertical: 10,
//   },
//   fileHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 14,
//   },
//   fileName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#0f172a",
//     maxWidth: "90%",
//   },
//   fileMeta: {
//     fontSize: 13,
//     color: "#64748b",
//     marginTop: 2,
//   },
//   actionRow: {
//     flexDirection: "row",
//     marginTop: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 14,
//   },
//   actionText: {
//     fontSize: 16,
//     marginLeft: 14,
//     color: "#0f172a",
//     fontWeight: "500",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#e5e7eb",
//     marginVertical: 6,
//   },
//   noDataText: {
//     fontSize: 14,
//     color: "#6b7280",
//     textAlign: "center",
//     fontWeight: "500",
//   },
//   viewerContainer: {
//     flex: 1,
//     backgroundColor: "#f3f4f6",
//     paddingHorizontal: 16,
//     paddingTop: 26,
//     paddingBottom: 24,
//   },
//   viewerHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//     paddingTop: 22,
//   },
//   viewerTitle: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#111827",
//     marginHorizontal: 12,
//     marginTop: 0,
//   },
//   secureBadgeViewer: {
//     flexDirection: "row",
//     alignItems: "center",
//     alignSelf: "flex-end",
//     backgroundColor: "#eff6ff",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     margin: 5,
//     marginRight: 16,
//   },
//   secureViewText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#2563eb",
//     marginLeft: 6,
//   },
//   viewerContent: {
//     flex: 1,
//     backgroundColor: "#f3f4f6",
//     paddingHorizontal: 12,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingHorizontal: 4,
//     paddingVertical: 16,
//     backgroundColor: "#f3f4f6",
//   },
//   documentContentWrapper: {
//     paddingVertical: 16,
//     paddingHorizontal: 4,
//   },
//   documentPage: {
//     marginBottom: 20,
//   },
//   pageHeader: {
//     paddingHorizontal: 8,
//     paddingVertical: 8,
//     marginBottom: 8,
//     backgroundColor: "#e5e7eb",
//     borderRadius: 8,
//   },
//   pageNumber: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#64748b",
//     textAlign: "center",
//   },
//   documentPlaceholder: {
//     width: "100%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     paddingVertical: 40,
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#e5e7eb",
//     borderStyle: "dashed",
//   },
//   placeholderText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#111827",
//     marginTop: 12,
//     textAlign: "center",
//   },
//   placeholderSubText: {
//     fontSize: 12,
//     color: "#6b7280",
//     marginTop: 6,
//   },
//   placeholderMeta: {
//     fontSize: 11,
//     color: "#94a3b8",
//     marginTop: 4,
//     fontWeight: "500",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 60,
//   },
//   loadingText: {
//     fontSize: 14,
//     color: "#64748b",
//     marginTop: 12,
//     fontWeight: "500",
//   },
//   dataIndicator: {
//     fontSize: 12,
//     color: "#16a34a",
//     marginTop: 12,
//     fontWeight: "600",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#fff",
//     borderTopWidth: 1,
//     borderTopColor: "#e5e7eb",
//     gap: 12,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#f3f4f6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#f3f4f6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     minWidth: 50,
//     textAlign: "center",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#f3f4f6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     minWidth: 50,
//     textAlign: "center",
//   },
//   viewerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#f3f4f6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },

//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },
//   controlBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#f3f4f6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },

//   controlBtnText: {
//     fontSize: 20,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   pageIndicator: {
//     fontSize: 13,
//     color: "#64748b",
//     fontWeight: "600",
//     minWidth: 50,
//     textAlign: "center",
//   },
// });

import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as MediaLibrary from "expo-media-library";
import * as ScreenCapture from "expo-screen-capture";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
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
  View,ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  useAdminDocumentDeleteMutation,
  useAdminUploadDocumentMutation,
  useGetDocumentWithCategoriesQuery,
} from "../../../src/services/apiSlice";

import { useSelector } from "react-redux";
import { BACKEND_IP, BACKEND_PORT } from "../../../src/config";
const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

const Contracts = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [docKey, setDocKey] = useState("CONTRACT"); // default document type
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  const [adminUploadDocument, { isLoadingDocument, error }] =
    useAdminUploadDocumentMutation();
  const [deleteDocument] = useAdminDocumentDeleteMutation({});

  const { data: documentCategoriesData, refetch } =
    useGetDocumentWithCategoriesQuery(
      { docKey: "CONTRACT" },
      { refetchOnMountOrArgChange: true },
    );

  // download progress tracker in toast
  let lastProgress = 0;

  const role = useSelector((state) => state.auth.role);

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
      formData.append("docKey", docKey || "CONTRACT");

      files.forEach((f, index) => {
        if (!f?.uri) return;
        formData.append("files", {
          uri: f.uri,
          // name: f.name || `file_${index}`,
          // type: f.type || f.mimeType || "application/octet-stream",

          name: f.name || `document_${index}.pdf`,
          type: f.mimeType || "application/pdf", // 🔥 KEY FIX
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
      setDocKey("CONTRACT");
      setModalVisible(false);

      // 🔄 Refresh data to show newly uploaded documents
      await refetch();
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

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
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

      {/* Add Document btn in Conditional */}
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
             <ScrollView style={{ height: 150, marginBottom: 12 }} keyboardShouldPersistTaps="handled">
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
            </ScrollView>

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
              style={[
                styles.actionRow,
                role === "user" && styles.disabledButton,
              ]}
              disabled={role === "user"}
              onPress={() => {
                handleDownloadDocument(actionItem);
              }}
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={role === "user" ? "#94a3b8" : "#334155"}
              />
              <Text
                style={[
                  styles.actionText,
                  role === "user" && styles.disabledText,
                ]}
              >
                Download
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[
                styles.actionRow,
                role === "user" && styles.disabledButton,
              ]}
              disabled={role === "user"}
              onPress={() => {
                /* rename */
              }}
            >
              <Ionicons name="pencil-outline" size={22} color="#334155" />
              <Text
                style={[
                  styles.actionText,
                  role === "user" && styles.disabledText,
                ]}
              >
                Rename File
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[
                styles.actionRow,
                role === "user" && styles.disabledButton,
              ]}
              disabled={role === "user"}
              onPress={() => {
                handleDeleteDocument(actionItem);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text
                style={[
                  styles.actionText,
                  role === "user" && styles.disabledText,
                ]}
              >
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
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 180 }}
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

export default Contracts;

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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },

  disabledButton: {
    opacity: 0.5,
  },

  actionText: {
    marginLeft: 8,
    color: "#334155",
  },

  disabledText: {
    color: "#94a3b8",
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
    padding: 5,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 6,
    marginTop: 5,
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
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
});
