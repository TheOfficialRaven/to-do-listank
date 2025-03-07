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

// Firebase konfiguráció – cseréld ki a saját adataidra, ha szükséges!
const firebaseConfig = {
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// DOM elemek - Autentikáció
const authSection = document.getElementById("auth-section")
const emailInput = document.getElementById("email-input")
const passwordInput = document.getElementById("password-input")
const registerBtn = document.getElementById("register-btn")
const loginBtn = document.getElementById("login-btn")
const logoutBtn = document.getElementById("logout-btn")

// DOM elemek - Teendőlista
const todoSection = document.getElementById("todo-section")
const taskInput = document.getElementById("task-input")
const taskAddBtn = document.getElementById("task-add-btn")
const tasksUl = document.getElementById("tasks-ul")

// DOM elemek - Bevásárlólista
const shopSection = document.getElementById("shop-section")
const shopInput = document.getElementById("shop-input")
const shopAddBtn = document.getElementById("shop-add-btn")
const shopUl = document.getElementById("shop-ul")

// Felhasználói állapot figyelése
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Bejelentkezett:", user.email)
    // Elrejti az autentikációs részt, megjeleníti a listákat
    authSection.style.display = "none"
    todoSection.style.display = "block"
    shopSection.style.display = "block"
    logoutBtn.style.display = "inline-block"

    // Beállítjuk a bejelentkezett felhasználó saját feladatait a DB-ben
    const userTasksRef = ref(db, `users/${user.uid}/tasks`)
    const userShoppingRef = ref(db, `users/${user.uid}/shopping`)

    // Feladatok figyelése
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
      })
      .catch((error) => {
        console.error("Regisztráció hiba:", error.message)
      })
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
        console.error("Bejelentkezés hiba:", error.message)
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
      console.error("Kijelentkezés hiba:", error.message)
    })
})

// Új feladat hozzáadása
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

// Közös kattintáskezelés a lista ikonokra
// Event delegation: a <ul>-re tesszük, és az ikonok alapján kezeljük a kattintásokat.
tasksUl.addEventListener("click", (e) => {
  handleListClick(e, "tasks")
})
shopUl.addEventListener("click", (e) => {
  handleListClick(e, "shopping")
})

function handleListClick(e, type) {
  // Meghatározzuk a megfelelő adatbázis útvonalat a type alapján
  let refPath = ""
  if (auth.currentUser) {
    if (type === "tasks") {
      refPath = `users/${auth.currentUser.uid}/tasks`
    } else if (type === "shopping") {
      refPath = `users/${auth.currentUser.uid}/shopping`
    }
  } else {
    return
  }
  
  // Pipa (done) ikon kezelése
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.id
    const currentDone = e.target.dataset.done === "true"
    set(ref(db, `${refPath}/${itemId}/done`), !currentDone)
  }
  
  // Kuka (delete) ikon kezelése
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.id
    remove(ref(db, `${refPath}/${itemId}`))
  }
}
