// Import Firebase modulokat
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

// Firebase konfiguráció – cseréld ki a saját adataidra!
const firebaseConfig = {
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// DOM elemek – Autentikációs rész
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
    // Felhasználó be van jelentkezve: rejtjük az auth részt, megjelenítjük a to‑do és bevásárló UI-t
    authSection.style.display = "none"
    todoSection.style.display = "block"
    shopSection.style.display = "block"
    logoutBtn.style.display = "inline-block"
  } else {
    console.log("Nincs bejelentkezett felhasználó")
    // Nincs bejelentkezve: megjelenítjük az auth UI-t, elrejtjük a to‑do UI-t
    authSection.style.display = "block"
    todoSection.style.display = "none"
    shopSection.style.display = "none"
    logoutBtn.style.display = "none"
  }
});

    // Beállítjuk a felhasználó saját feladatait a DB-ben
    const userTasksRef = ref(db, `users/${user.uid}/tasks`)
    const userShoppingRef = ref(db, `users/${user.uid}/shopping`)

    // Teendők figyelése
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

    // Bevásárlólista figyelése
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

// Kijelentkezés
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("Sikeres kijelentkezés")
    })
    .catch((error) => {
      console.error("Kijelentkezési hiba:", error.message)
    })
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

// Közös renderelő függvény (lista kirajzolása)
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
  // Teendő lista elemein belül
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.id
    const currentDone = e.target.dataset.done === "true"
    set(ref(db, `users/${auth.currentUser.uid}/tasks/${itemId}/done`), !currentDone)
  }
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.id
    // Meg kell határozni, hogy a teendő- vagy bevásárlólista eleme
    if (e.target.closest("ul").id === "tasks-ul") {
      remove(ref(db, `users/${auth.currentUser.uid}/tasks/${itemId}`))
    }
    if (e.target.closest("ul").id === "shop-ul") {
      remove(ref(db, `users/${auth.currentUser.uid}/shopping/${itemId}`))
    }
  }
})
