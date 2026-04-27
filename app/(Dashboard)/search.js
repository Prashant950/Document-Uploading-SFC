import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {useGetDocumentWithCategoriesQuery} from "../../src/services/apiSlice";

const Search = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);

const { data: documentsData, error, isLoading } = useGetDocumentWithCategoriesQuery({});

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* SEARCH BAR */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>DOCUMENTS</Text>
      </ScrollView>

      {/* ================= FILTER MODAL ================= */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <Pressable
          style={styles.backdrop}
          onPress={() => setFilterVisible(false)}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Filter Documents</Text>
          <Text style={styles.sheetSubTitle}>
            SNOW FOUNTAIN CONSULTANTs
          </Text>

          {/* CATEGORY */}
          <Text style={styles.label}>CATEGORY</Text>
          <TouchableOpacity style={styles.selectBox}>
            <Text style={styles.selectText}>
              {category || "Select Category"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          {/* SUB CATEGORY */}
          <Text style={styles.label}>SUB-CATEGORY</Text>
          <TouchableOpacity style={styles.selectBox}>
            <Text style={styles.selectText}>
              {subCategory || "Select Sub-Category"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          {/* APPLY BUTTON */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setFilterVisible(false)}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>

          {/* RESET */}
          <TouchableOpacity
            onPress={() => {
              setCategory(null);
              setSubCategory(null);
              setFilterVisible(false);
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
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
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    
    borderWidth: 1,
    borderColor: "#c4d8ff",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
  },

  filterBtn: {
    width: 50,
    height: 50,
    marginLeft: 12,
    borderRadius: 14,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    paddingHorizontal: 20,
  },

  /* ===== MODAL ===== */

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },

  handle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 18,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  sheetSubTitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 28,
    marginTop: 6,
    letterSpacing: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 18,
  },

  selectBox: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 15,
    color: "#64748B",
  },

  applyBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },

  applyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  resetText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 18,
  },
});
