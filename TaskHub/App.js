import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);

  // Authentication checking state
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form fields
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Login / Register mode
  const [registerMode, setRegisterMode] = useState(false);

  // Request state
  const [loading, setLoading] = useState(false);

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ------------------------------------------------
  // 2.2 AUTHENTICATION STATE
  // ------------------------------------------------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // ------------------------------------------------
  // 2.3 LOAD USER PROFILE
  // ------------------------------------------------

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        setProfileLoading(true);

        const profileRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(profileRef);

        if (snapshot.exists()) {
          setProfile(snapshot.data());
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Unable to load your profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // ------------------------------------------------
  // 2.1 REGISTER
  // ------------------------------------------------

  const register = async () => {
    if (!studentName.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your student name, email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = result.user.uid;

      // Create profile using Firebase UID as document ID
      await setDoc(doc(db, "users", uid), {
        studentName: studentName.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      setStudentName("");
      setEmail("");
      setPassword("");

    } catch (error) {
      console.log(error);

      let message = "Registration failed.";

      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak.";
      }

      Alert.alert("Registration", message);

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // 2.1 LOGIN
  // ------------------------------------------------

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setEmail("");
      setPassword("");

    } catch (error) {
      console.log(error);

      let message = "Login failed.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message = "Incorrect email or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }

      Alert.alert("Login", message);

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // 2.4 LOGOUT
  // ------------------------------------------------

  const logout = async () => {
    try {
      await signOut(auth);

      // Remove private profile information from UI state
      setProfile(null);

    } catch (error) {
      Alert.alert("Error", "Unable to sign out.");
    }
  };

  // ------------------------------------------------
  // AUTH CHECKING SCREEN
  // ------------------------------------------------

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Checking authentication...</Text>
      </View>
    );
  }

  // ------------------------------------------------
  // PROTECTED PROFILE
  // ------------------------------------------------

  if (user) {
    if (profileLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Loading profile...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>MyUJ Profile</Text>

        {profile ? (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>
                {profile.studentName}
              </Text>

              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>
                {profile.email}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>Profile not found.</Text>
        )}
      </View>
    );
  }

  // ------------------------------------------------
  // LOGIN / REGISTER SCREEN
  // ------------------------------------------------

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {registerMode ? "Create Account" : "MyUJ Login"}
      </Text>

      {registerMode && (
        <TextInput
          style={styles.input}
          placeholder="Student display name"
          value={studentName}
          onChangeText={setStudentName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={registerMode ? register : login}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? "Please wait..."
            : registerMode
            ? "Register"
            : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRegisterMode(!registerMode)}
      >
        <Text style={styles.switchText}>
          {registerMode
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 70,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },

  logoutButton: {
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  switchText: {
    textAlign: "center",
    marginTop: 10,
  },

  profileCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },

  label: {
    fontWeight: "bold",
    marginTop: 10,
  },

  value: {
    fontSize: 18,
    marginTop: 5,
  },
});