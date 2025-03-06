import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

// Firebase config
const firebaseConfig = {
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/"
}
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// Két kulcs a DB-ben: "tasks" és "shopping"
const tasksRef = ref(db, "tasks")
const shoppingRef = ref(db, "shopping")

// DOM elemek:
// 1) E heti teendők
const taskInput = document.getElementById("task-input")
const taskAddBtn = document.getElementById("task-add-btn")
const tasksUl = document.getElementById("tasks-ul")

// 2) Bevásárlólista
const shopInput = document.getElementById("shop-input")
const shopAddBtn = document.getElementById("shop-add-btn")
const shopUl = document.getElementById("shop-ul")

// FIGYELÉS: TEENDŐK
onValue(tasksRef, (snapshot) => {
  if (snapshot.exists()) {
    const dataObj = snapshot.val()
    const taskArr = Object.entries(dataObj).map(([key, val]) => {
      return {
        id: key,
        text: val.text,
        done: val.done
      }
    })
    renderList(taskArr, tasksUl, "tasks")
  } else {
    tasksUl.innerHTML = ""
  }
})

// FIGYELÉS: BEVÁSÁRLÓLISTA
onValue(shoppingRef, (snapshot) => {
  if (snapshot.exists()) {
    const dataObj = snapshot.val()
    const shopArr = Object.entries(dataObj).map(([key, val]) => {
      return {
        id: key,
        text: val.text,
        done: val.done
      }
    })
    renderList(shopArr, shopUl, "shopping")
  } else {
    shopUl.innerHTML = ""
  }
})

// HOZZÁADÁS: TEENDŐ
taskAddBtn.addEventListener("click", () => {
  let txt = taskInput.value.trim()
  if (txt !== "") {
    push(tasksRef, {
      text: txt,
      done: false
    })
    taskInput.value = ""
  }
})

// HOZZÁADÁS: BEVÁSÁRLÓ
shopAddBtn.addEventListener("click", () => {
  let txt = shopInput.value.trim()
  if (txt !== "") {
    push(shoppingRef, {
      text: txt,
      done: false
    })
    shopInput.value = ""
  }
})

// Eseménykezelés a listákra – mindkettőn event delegation
tasksUl.addEventListener("click", (e) => {
  handleListClick(e, tasksRef)
})
shopUl.addEventListener("click", (e) => {
  handleListClick(e, shoppingRef)
})

// Közös renderelő függvény: paraméterként kapja a listatömböt, a UL elemet és a "típus" stringet
function renderList(arr, ulEl, type) {
  let html = ""
  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i]
    let doneClass = obj.done ? "done" : ""

    // Egy li sor, pipa + kuka ikon
    html += `
      <li class="${doneClass}">
        <span class="item-text">${obj.text}</span>
        <div class="icons">
          <span
            class="material-icons done-icon"
            data-id="${obj.id}"
            data-done="${obj.done}"
            data-type="${type}"
          >
            done
          </span>
          <span
            class="material-icons delete-icon"
            data-id="${obj.id}"
            data-type="${type}"
          >
            delete
          </span>
        </div>
      </li>
    `
  }
  ulEl.innerHTML = html
}

// Közös kattintáskezelő (pipa/kuka)
function handleListClick(e, reference) {
  // pipa
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.id
    const currentDone = e.target.dataset.done === "true"
    // Toggoljuk a done mezőt
    set(ref(db, `${reference.key}/${itemId}/done`), !currentDone)
  }

  // kuka
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.id
    remove(ref(db, `${reference.key}/${itemId}`))
  }
}