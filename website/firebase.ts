import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD9HO2A1COJ5Z3Za7vsvKFAtna6XAKsd70",
    authDomain: "space-bots-f7fc0.firebaseapp.com",
    projectId: "space-bots-f7fc0",
    storageBucket: "space-bots-f7fc0.appspot.com",
    messagingSenderId: "779280785013",
    appId: "1:779280785013:web:762874545935ef306be23c",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
