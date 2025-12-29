import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUploadDocumentMutation } from "../src/services/apiSlice";

const UploadDocumentsScreen = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);
  const [filePath, setfilePath] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [uploadDocument, { isLoading, error }] = useUploadDocumentMutation();

  const handleModal = () => {
    setModalVisible(!modalVisible);
  };
const UploadDocuments = async () => {
  try {
    // 1️⃣ Open document picker
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    // 2️⃣ Prepare multipart FormData
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,           // 🔥 MUST
      name: file.name,         // 🔥 MUST
      type: file.mimeType,     // 🔥 MUST
    });

    formData.append("docName", "Aadhaar Card");

    // 3️⃣ Upload to backend (GridFS)
    await uploadDocument(formData).unwrap();

    Toast.show({
      type: "success",
      text1: "Upload Successful",
      text2: "Document saved in database",
    });

  } catch (error) {
    console.log("UPLOAD ERROR:", error);
    Toast.show({
      type: "error",
      text1: "Upload Failed",
      text2: "Please try again",
    });
  }
};

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
    });
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Opens the document picker to select a file
     * and sets the selected file to the state using setFile
     * @returns {Promise<void>} - Resolves when the document picker is closed
     */
    /*******  5991c03d-eebd-4152-b335-ef6a0ea9f301  *******/
    // expo-document-picker returns { type: 'success'|'cancel', uri, name, size, mimeType }
    if (result.type === "success") {
      setFile(result);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TextInput
          style={styles.Txtinput}
          placeholder="Search Documents..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Aadhaar Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, styles.blueBg]}>
                <Icon
                  name="card-account-details-outline"
                  size={22}
                  color="#2563eb"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Aadhaar Card</Text>
                <Text style={styles.subText}>Upload your national ID card</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={UploadDocuments}
              >
                <Text style={styles.primaryBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PAN Card (Uploaded) */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, styles.greenBg]}>
                <Icon name="check" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>PAN Card</Text>
                <Text style={styles.successText}>Uploaded Successfully</Text>
              </View>
              <View style={styles.iconRow}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Icon name="eye-outline" size={22} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Icon name="download-outline" size={22} color="#16A34A" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Icon
                    name="share-variant-outline"
                    size={22}
                    color="#7C3AED"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Icon name="delete-outline" size={22} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Driving License (Failed) */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, styles.redBg]}>
                <Icon name="alert-circle-outline" size={22} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Driving License</Text>
                <Text style={styles.errorText}>
                  Upload failed. Please try again.
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                  placeholder="e.g. Insurance Policy"
                  value={docName}
                  onChangeText={setDocName}
                />

                {/* File Attachment */}
                <Text style={[styles.label, { marginTop: 16 }]}>
                  File Attachment
                </Text>

                <Pressable style={styles.uploadBox} onPress={pickFile}>
                  <Ionicons name="cloud-upload" size={28} color="#1565C0" />
                  <Text style={styles.uploadText}>
                    {file ? file.name : "Click to Upload File"}
                  </Text>
                  <Text style={styles.fileType}>PDF, JPG, or PNG</Text>
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
                    style={styles.uploadBtn}
                    onPress={UploadDocuments}
                  >
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          {/* Uploaded Documents */}
          <Text style={styles.sectionTitle}>Uploaded Documents</Text>

          {[
            { name: "Aadhaar Card", date: "24 May 2024" },
            { name: "PAN Card", date: "23 May 2024" },
            { name: "Driving License", date: "22 May 2024" },
            { name: "Invoice_April.pdf", date: "21 May 2024" },
          ].map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.subText}>Uploaded on: {item.date}</Text>
                </View>
                <View style={styles.iconRow}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Icon name="eye-outline" size={22} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Icon name="download-outline" size={22} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Icon
                      name="share-variant-outline"
                      size={22}
                      color="#7C3AED"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Icon name="delete-outline" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
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
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
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
