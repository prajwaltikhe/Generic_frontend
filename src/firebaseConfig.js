// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: 'AIzaSyD9My0x-mgjHAkvULxGdgMrR9pjhCzNkiA',
//   authDomain: 'samsung-generic.firebaseapp.com',
//   projectId: 'samsung-generic',
//   storageBucket: 'samsung-generic.firebasestorage.app',
//   messagingSenderId: '490356922935',
//   appId: '1:490356922935:web:38f47ed3592b63041c3db2',
//   measurementId: 'G-6GXPGLVPHG',
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);



// gentrax

// // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXzmXymN8x4fPC5zOxWGI9RnCEwVNGHSk",
  authDomain: "gentrax-4f79f.firebaseapp.com",
  projectId: "gentrax-4f79f",
  storageBucket: "gentrax-4f79f.firebasestorage.app",
  messagingSenderId: "789285233417",
  appId: "1:789285233417:web:49427c79b25afc8ac229d8",
  measurementId: "G-NG1503YZHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
