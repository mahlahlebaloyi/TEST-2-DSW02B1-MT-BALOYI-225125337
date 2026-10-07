import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export default function App() {
  // -----------------------------
  // STATE
  // -----------------------------

  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // REAL-TIME FIRESTORE LISTENER
  // -----------------------------

  useEffect(() => {
    const tasksRef = collection(db, "tasks");

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const taskList = snapshot.docs.map((taskDoc) => ({
          id: taskDoc.id,
          ...taskDoc.data(),
        }));

        setTasks(taskList);
        setLoading(false);
        setError("");
      },
      (error) => {
        console.log("Firestore error:", error);
        setError("Unable to load tasks. Please try again.");
        setLoading(false);
      }
    );

    // Clean up listener when screen unmounts
    return () => unsubscribe();
  }, []);

  // -----------------------------
  // ADD TASK
  // -----------------------------

  const addTask = async () => {
    // Validate title
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a task title.");
      return;
    }

    // Validate module code
    if (!moduleCode.trim()) {
      Alert.alert("Validation", "Please enter a module code.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        moduleCode: moduleCode.trim(),
        priority: priority,
        completed: false,
        createdAt: serverTimestamp(),
      });

      // Clear inputs only after successful Firestore write
      setTitle("");
      setModuleCode("");
      setPriority("Medium");

      Alert.alert("Success", "Task added successfully.");
    } catch (error) {
      console.log("Add task error:", error);

      Alert.alert(
        "Error",
        "Failed to add task. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // TOGGLE TASK COMPLETION
  // -----------------------------

  const toggleTask = async (task) => {
    try {
      const taskRef = doc(db, "tasks", task.id);

      await updateDoc(taskRef, {
        completed: !task.completed,
      });
    } catch (error) {
      console.log("Update task error:", error);

      Alert.alert(
        "Error",
        "Failed to update the task. Please try again."
      );
    }
  };

  // -----------------------------
  // DELETE TASK
  // -----------------------------

  const deleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);

      await deleteDoc(taskRef);
    } catch (error) {
      console.log("Delete task error:", error);

      Alert.alert(
        "Error",
        "Failed to delete the task. Please try again."
      );
    }
  };

  // -----------------------------
  // LOADING STATE
  // -----------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Loading tasks...</Text>
      </View>
    );
  }

  // -----------------------------
  // MAIN SCREEN
  // -----------------------------

  return (
    <View style={styles.container}>

      <Text style={styles.heading}>UJ Student Task Hub</Text>

      {/* ADD TASK SECTION */}
      <View style={styles.form}>

        <Text style={styles.sectionTitle}>Add Task</Text>

        <TextInput
          style={styles.input}
          placeholder="Task title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Module code"
          value={moduleCode}
          onChangeText={setModuleCode}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Priority</Text>

        <View style={styles.priorityContainer}>

          {["Low", "Medium", "High"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.priorityButton,
                priority === item && styles.selectedPriority,
              ]}
              onPress={() => setPriority(item)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === item && styles.selectedPriorityText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}

        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={addTask}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Task</Text>
          )}
        </TouchableOpacity>

      </View>

      {/* ERROR STATE */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* TASK LIST */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No tasks found.
            </Text>
            <Text style={styles.emptySubText}>
              Add your first task above.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.taskCard,
              item.completed && styles.completedCard,
            ]}
          >

            <View style={styles.taskInfo}>

              <Text
                style={[
                  styles.taskTitle,
                  item.completed && styles.completedText,
                ]}
              >
                {item.title}
              </Text>

              <Text style={styles.module}>
                Module: {item.moduleCode}
              </Text>

              <Text style={styles.priority}>
                Priority: {item.priority}
              </Text>

              <Text style={styles.status}>
                Status: {item.completed ? "Completed" : "Incomplete"}
              </Text>

            </View>

            <View style={styles.actions}>

              {/* COMPLETE BUTTON */}
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => toggleTask(item)}
              >
                <Text style={styles.buttonText}>
                  {item.completed ? "Undo" : "Complete"}
                </Text>
              </TouchableOpacity>

              {/* DELETE BUTTON */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(item.id)}
              >
                <Text style={styles.buttonText}>
                  Delete
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        )}
      />

    </View>
  );
}

// -----------------------------
// STYLES
// -----------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  message: {
    marginTop: 10,
    fontSize: 16,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  form: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
  },

  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  priorityButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  selectedPriority: {
    backgroundColor: "#333",
    borderColor: "#333",
  },

  priorityText: {
    fontWeight: "600",
  },

  selectedPriorityText: {
    color: "#fff",
  },

  addButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  errorBox: {
    backgroundColor: "#ffe5e5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  errorText: {
    color: "#b00020",
  },

  emptyContainer: {
    alignItems: "center",
    padding: 30,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  emptySubText: {
    marginTop: 5,
    color: "#666",
  },

  taskCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  completedCard: {
    opacity: 0.65,
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  completedText: {
    textDecorationLine: "line-through",
  },

  module: {
    color: "#555",
    marginBottom: 4,
  },

  priority: {
    color: "#555",
    marginBottom: 4,
  },

  status: {
    fontWeight: "600",
  },

  actions: {
    justifyContent: "center",
    marginLeft: 10,
  },

  completeButton: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },

  deleteButton: {
    backgroundColor: "#b00020",
    padding: 8,
    borderRadius: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});