import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"

// Firebase konfiguráció 
const firebaseConfig = {
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0",
  authDomain: "leads-tracker-app-78b83.firebaseapp.com",
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "leads-tracker-app-78b83",
  storageBucket: "leads-tracker-app-78b83.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:907489703312:web:c4138807d8a7aa96512f15"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// DOM elemek – Autentikáció
const authSection = document.getElementById("auth-section")
const emailInput = document.getElementById("email-input")
const passwordInput = document.getElementById("password-input")
const registerBtn = document.getElementById("register-btn")
const loginBtn = document.getElementById("login-btn")
const logoutBtn = document.getElementById("logout-btn")
const authMessageEl = document.getElementById("auth-message")

// DOM elemek – Teendőlista
const todoSection = document.getElementById("todo-section")
const taskInput = document.getElementById("task-input")
const taskAddBtn = document.getElementById("task-add-btn")
const tasksUl = document.getElementById("tasks-ul")

// DOM elemek – Bevásárlólista
const shopSection = document.getElementById("shop-section")
const shopInput = document.getElementById("shop-input")
const shopAddBtn = document.getElementById("shop-add-btn")
const shopUl = document.getElementById("shop-ul")

// Auth állapot figyelése
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Bejelentkezett:", user.email)
    authSection.style.display = "none"
    todoSection.style.display = "block"
    shopSection.style.display = "block"
    logoutBtn.style.display = "inline-block" // Mindig látható, függetlenül a bejelentkezéstől
    authMessageEl.textContent = ""

    // Felhasználó saját teendői és bevásárló tételei a DB-ben
    const userTasksRef = ref(db, `users/${user.uid}/tasks`)
    const userShoppingRef = ref(db, `users/${user.uid}/shopping`)

    onValue(userTasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const dataObj = snapshot.val()
        const tasksArr = Object.entries(dataObj).map(([key, val]) => ({
          id: key,
          text: val.text,
          done: val.done
        }))
        renderList(tasksArr, tasksUl)
      } else {
        tasksUl.innerHTML = ""
      }
    })

    onValue(userShoppingRef, (snapshot) => {
      if (snapshot.exists()) {
        const dataObj = snapshot.val()
        const shopArr = Object.entries(dataObj).map(([key, val]) => ({
          id: key,
          text: val.text,
          done: val.done
        }))
        renderList(shopArr, shopUl)
      } else {
        shopUl.innerHTML = ""
      }
    })
  } else {
    console.log("Nincs bejelentkezett felhasználó")
    // Mivel a kijelentkezés gomb mindig látható legyen, itt nem rejtjük el
    authSection.style.display = "block"
    todoSection.style.display = "none"
    shopSection.style.display = "none"
    logoutBtn.style.display = "none"
  }
})

// Regisztráció
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (email && password) {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres regisztráció:", userCredential.user.email)
        authMessageEl.textContent = `Sikeres regisztráció! Üdvözlünk, ${userCredential.user.email}!`
      })
      .catch((error) => {
        console.error("Regisztrációs hiba:", error.message)
        authMessageEl.textContent = `Regisztrációs hiba: ${error.message}`
      })
  } else {
    authMessageEl.textContent = "Kérjük, add meg az email címet és a jelszót!"
  }
})

// Bejelentkezés
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (email && password) {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres bejelentkezés:", userCredential.user.email)
      })
      .catch((error) => {
        console.error("Bejelentkezési hiba:", error.message)
        authMessageEl.textContent = `Bejelentkezési hiba: ${error.message}`
      })
  }
})

// Kijelentkezés – mindig látható gomb, ellenőrizzük, hogy be van-e jelentkezve
logoutBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth)
      .then(() => {
        console.log("Sikeres kijelentkezés")
      })
      .catch((error) => {
        console.error("Kijelentkezési hiba:", error.message)
      })
  } else {
    console.log("Nincs bejelentkezett felhasználó, nincs mit kijelentkezni.")
  }
})

// Új teendő hozzáadása
taskAddBtn.addEventListener("click", () => {
  const text = taskInput.value.trim()
  if (text !== "" && auth.currentUser) {
    const userTasksRef = ref(db, `users/${auth.currentUser.uid}/tasks`)
    push(userTasksRef, {
      text: text,
      done: false
    })
    taskInput.value = ""
  }
})

// Új bevásárló tétel hozzáadása
shopAddBtn.addEventListener("click", () => {
  const text = shopInput.value.trim()
  if (text !== "" && auth.currentUser) {
    const userShoppingRef = ref(db, `users/${auth.currentUser.uid}/shopping`)
    push(userShoppingRef, {
      text: text,
      done: false
    })
    shopInput.value = ""
  }
})

// Lista renderelése
function renderList(arr, ulElement) {
  let html = ""
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    const doneClass = item.done ? "done" : ""
    html += `
      <li class="${doneClass}">
        <span class="item-text">${item.text}</span>
        <div class="icons">
          <span class="material-icons done-icon" data-id="${item.id}" data-done="${item.done}">
            done
          </span>
          <span class="material-icons delete-icon" data-id="${item.id}">
            delete
          </span>
        </div>
      </li>
    `
  }
  ulElement.innerHTML = html
}

// Közös kattintáskezelés az ikonokra (event delegation)
document.addEventListener("click", (e) => {
  // Pipa ikon kezelése
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.id
    const currentDone = e.target.dataset.done === "true"
    set(ref(db, `users/${auth.currentUser.uid}/tasks/${itemId}/done`), !currentDone)
  }
  // Kuka ikon kezelése
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.id
    const parentUl = e.target.closest("ul").id
    if (parentUl === "tasks-ul") {
      remove(ref(db, `users/${auth.currentUser.uid}/tasks/${itemId}`))
    } else if (parentUl === "shop-ul") {
      remove(ref(db, `users/${auth.currentUser.uid}/shopping/${itemId}`))
    }
  }
})

//Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker regisztrálva:', registration.scope);
      })
      .catch(err => {
        console.error('ServiceWorker regisztrációs hiba:', err);
      });
  });
}
