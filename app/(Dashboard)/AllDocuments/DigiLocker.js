import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import {
  useCreateDocumentCategoryMutation,
  useDeleteDocumentCategoryMutation,
  useGetAllDocumentCategoriesQuery,
  useUpdateDocumentCategoryMutation,
} from "../../../src/services/apiSlice";

const DigiLocker = () => {
  const router = useRouter();
  const role = useSelector((state) => state.auth.role);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "folder",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // API hooks
  const {
    data: categoriesData,
    refetch,
    isLoading,
  } = useGetAllDocumentCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] =
    useCreateDocumentCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateDocumentCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteDocumentCategoryMutation();

  // Check admin access
  useEffect(() => {
    if (role !== "admin") {
      Alert.alert("Access Denied", "Only admins can access DigiLocker", [
        { text: "Go Back", onPress: () => router.back() },
      ]);
    }
  }, [role]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const categories = categoriesData?.categories || [];
    if (!searchQuery.trim()) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categoriesData, searchQuery]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Modal handlers
  const openAddModal = () => {
    setIsEditMode(false);
    setCategoryForm({ name: "", description: "", icon: "folder" });
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setIsEditMode(true);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "folder",
    });
    setSelectedCategory(category);
    setModalVisible(true);
    setMenuVisible(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryForm({ name: "", description: "", icon: "folder" });
    setSelectedCategory(null);
  };

  // Add category
  const handleAddCategory = async () => {
    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();

    // Validation
    if (!trimmedName) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter category name",
        position: "bottom",
      });
      return;
    }

    if (trimmedName.length < 3) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Category name must be at least 3 characters",
        position: "bottom",
      });
      return;
    }

    try {
      const response = await createCategory({
        name: trimmedName,
        description: trimmedDescription,
        icon: categoryForm.icon || "folder",
      }).unwrap();

      // Verify response
      if (!response || !response._id) {
        throw new Error("Invalid response from server");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Category added successfully",
        position: "bottom",
      });

      // Reset form
      setCategoryForm({ name: "", description: "", icon: "folder" });
      setMenuVisible(false);
      closeModal();

      // Refetch to get updated list
      setTimeout(() => {
        refetch();
      }, 300);
    } catch (error) {
      console.error("Add category error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error?.data?.message || error?.message || "Failed to add category",
        position: "bottom",
      });
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();

    // Validation
    if (!trimmedName) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter category name",
        position: "bottom",
      });
      return;
    }

    if (trimmedName.length < 3) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Category name must be at least 3 characters",
        position: "bottom",
      });
      return;
    }

    if (!selectedCategory || !selectedCategory._id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Category not found",
        position: "bottom",
      });
      return;
    }

    try {
      const response = await updateCategory({
        id: selectedCategory._id,
        name: trimmedName,
        description: trimmedDescription,
        icon: categoryForm.icon || "folder",
      }).unwrap();

      // Verify response
      if (!response || !response._id) {
        throw new Error("Invalid response from server");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Category updated successfully",
        position: "bottom",
      });

      // Reset form
      setCategoryForm({ name: "", description: "", icon: "folder" });
      setSelectedCategory(null);
      closeModal();

      // Refetch to get updated list
      setTimeout(() => {
        refetch();
      }, 300);
    } catch (error) {
      console.error("Update category error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error?.data?.message || error?.message || "Failed to update category",
        position: "bottom",
      });
    }
  };

  // Delete category
  const handleDeleteCategory = (category) => {
    if (!category || !category._id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid category",
        position: "bottom",
      });
      return;
    }

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteCategory(category._id).unwrap();

              // Verify deletion response
              if (!response) {
                throw new Error("Invalid response from server");
              }

              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Category deleted successfully",
                position: "bottom",
              });

              setMenuVisible(false);
              setSelectedCategory(null);

              // Refetch to get updated list
              setTimeout(() => {
                refetch();
              }, 300);
            } catch (error) {
              console.error("Delete category error:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  error?.data?.message ||
                  error?.message ||
                  "Failed to delete category",
                position: "bottom",
              });
            }
          },
        },
      ],
    );
  };

  // Icon options
  const iconOptions = [
    "folder",
    // "file-document",
    // "briefcase",
    // "chart-box",
    // "clipboard-text",
    // "folder-lock",
    // "archive",
    // "cloud",
  ];

  // Category card component
  const CategoryCard = ({ item, onPress }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/(Dashboard)/AllDocuments/${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons
          name={item.icon || "folder"}
          size={40}
          color="#3B82F6"
        />
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(item);
            setMenuVisible(true);
          }}
          style={styles.menuButton}
        >
          <MaterialIcons name="more-vert" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.description && (
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.documentCount}>
          {item.documentCount || 0} Documents
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      {/* Add Category Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddModal}
        disabled={isCreating}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
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

      {/* Categories Grid */}
      {isLoading && !categoriesData ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="folder-open" size={80} color="#ccc" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="folder-open" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No categories found" : "No categories yet"}
          </Text>
          {/* {!searchQuery && (
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={openAddModal}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addCategoryText}>Add Category</Text>
            </TouchableOpacity>
          )} */}
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <CategoryCard item={item} />}
          numColumns={2}
          columnWrapperStyle={styles.grid}
          contentContainerStyle={styles.gridContent}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Context Menu Modal */}
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
              onPress={() => openEditModal(selectedCategory)}
              disabled={isUpdating}
            >
              <MaterialIcons name="edit" size={20} color="#3B82F6" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDeleteCategory(selectedCategory)}
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

      {/* Add/Edit Category Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isCreating || isUpdating}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isEditMode ? "Edit Category" : "Add Category"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Form Content */}
            <View style={styles.formContainer}>
              {/* Icon Selector */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Icon</Text>
                <View style={styles.iconGrid}>
                  {iconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        categoryForm.icon === icon && styles.iconOptionSelected,
                      ]}
                      onPress={() => setCategoryForm({ ...categoryForm, icon })}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={30}
                        color={categoryForm.icon === icon ? "#3B82F6" : "#999"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter category name"
                  value={categoryForm.name}
                  onChangeText={(text) =>
                    setCategoryForm({ ...categoryForm, name: text })
                  }
                  placeholderTextColor="#999"
                />
              </View>

              {/* Description Input */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter category description"
                  value={categoryForm.description}
                  onChangeText={(text) =>
                    setCategoryForm({ ...categoryForm, description: text })
                  }
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={isCreating || isUpdating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (isCreating || isUpdating) && styles.buttonDisabled,
                ]}
                onPress={isEditMode ? handleUpdateCategory : handleAddCategory}
                disabled={isCreating || isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isCreating || isUpdating ? "Saving..." : "Save"}
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  addButton: {
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  // Grid styles
  grid: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  gridContent: {
    paddingTop: 8,
  },

  // Category Card styles
  categoryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  documentCount: {
    fontSize: 12,
    color: "#94a3b8",
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
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  addCategoryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },

  // Form styles
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  formSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top",
  },

  // Icon selector
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconOption: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#eff6ff",
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

export default DigiLocker;
