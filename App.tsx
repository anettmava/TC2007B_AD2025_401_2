import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Image } from 'react-native';
import { useState, useEffect } from 'react';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// import stuff for authentication
import { 
  initializeAuth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  UserCredential,
  sendPasswordResetEmail,
  getReactNativePersistence,
  UserInfo,
} from 'firebase/auth';

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// import stuff for firestore (database)
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  QuerySnapshot 
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// initialize auth
// our authentication credentials at this point are saved on volatile memory (RAM)
// it means that if the app's memory is dumped we will lose our credentials
// const auth = getAuth(app);

// how to save credentials on persistent storage
const auth = initializeAuth(app, {persistence: getReactNativePersistence(ReactNativeAsyncStorage)});

// initialize firestore
const db = getFirestore(app);

export default function App() {

  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");

  useEffect(() => {
    
    // listen for user status change
    onAuthStateChanged(
      auth, 
      user => {
        if(user) {
          alert("USER IS AUTHENTICATED: " + user.email);
        } else {
          alert("SIGNED OUT :(");
        }
      }
    );

    // listen for collection data change 
    onSnapshot(
      collection(db, "perritos"),
      querySnapshot => {
        console.log("******************************************* SNAPSHOT CHANGE");
        querySnapshot.forEach(
          currentDocument => {
            console.log(currentDocument.data());
          }
        );
      }
    );

  }, []);

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder='email'
        onChangeText={text => {
          setEmail(text);
        }}
      />
      <TextInput 
        placeholder='password'
        secureTextEntry={true}
        onChangeText={text => {
          setPassword(text);
        }}
      />
      <Button 
        title='Sign up'
        onPress={() => {
          createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential : UserCredential) => {
            console.log("NEW USER: " + userCredential.user.email);
          })
          .catch(error => {
            console.log("ERROR: " + error.message + " " + error.code);

            if(error.code == "auth/missing-password")
              alert("YOU NEED TO PUT A PASSWORD!");
          });
        }}
      />
      <Button 
        title='Sign in'
        onPress={() => {
          signInWithEmailAndPassword(auth, email, password)
          .then(userCredential => {
            console.log("SIGNED IN: " + userCredential.user.email);
          })
          .catch(error => {
            console.log("error: " + error);
          });
        }}
      />
      <Button 
        title='Sign out'
        onPress={() => {
          auth.signOut();
          console.log("SIGNING OUT!");
        }}
      />
      <Button 
        title='Reset password'
        onPress={() => {
          sendPasswordResetEmail(auth, email)
          .then(() => {
            alert("RESET EMAIL HAS BEEN SENT");
          });
        }}
      />
      <Button 
        title='Add dog'
        onPress={async () => {

          // THERE IS CODE HERE THAT COULD RAISE AN EXCEPTION!
          // fail gracefully

          try {
            // a lot of things in the firebase api are async
            var perritosCollection = collection(db, 'perritos');
            
            const newDoc = await addDoc(
              perritosCollection, 
              {
                name: 'El Solovino',
                breed: 'Callejero'
              }
            );

            console.log("NEW DOG!: " + newDoc.id);
          } catch(e) {
            alert("EXCEPTION THROWN: " + e);
          } finally {
            console.log("THIS ALWAYS RUNS");
          }
        }}
      />
      <Button 
        title='List all dogs'
        onPress={async () => {
          const perritos = collection(db, "perritos");
          var snapshot = await getDocs(perritos);
          snapshot.forEach(currentDocument => {
            console.log(currentDocument.data());
          });
        }}
      />
      <Button 
        title='Query dogs'
        onPress={async () => {

          const perritos = collection(db, 'perritos');
          const q = query(perritos, where('breed', '==', 'Callejero'));
          const snapshot = await getDocs(q);
          snapshot.forEach(currentDocument => {
            console.log(currentDocument.data());
          });
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
