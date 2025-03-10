import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, set, get
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase konfiguráció – cseréld ki a saját adataidra!
const firebaseConfig = {
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0",
  authDomain: "leads-tracker-app-78b83.firebaseapp.com",
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "leads-tracker-app-78b83",
  storageBucket: "leads-tracker-app-78b83.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:907489703312:web:c4138807d8a7aa96512f15"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// DOM elemek – Autentikáció
const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authMessageEl = document.getElementById("auth-message");

// DOM elemek – Eredeti listák (todo, shop)
// Ezeket a default listákat a Firebaseből töltjük be, és megjelenítjük az egyesített konténerben.
const tasksUl = document.getElementById("tasks-ul");
const shopUl = document.getElementById("shop-ul");

// DOM elemek – Egyesített lista konténer (default + egyéni)
const listsContainer = document.getElementById("lists-container");

// DOM elemek – Új lista létrehozása
const newListSection = document.getElementById("new-list-section");
const customListNameInput = document.getElementById("custom-list-name-input");
const customListCategoryInput = document.getElementById("custom-list-category-input");
const customNewListBtn = document.getElementById("custom-new-list-btn");
const filterCategorySelect = document.getElementById("filter-category");

// Auth állapot figyelése
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    newListSection.style.display = "block";
    document.getElementById("logout-section").style.display = "block";
    // Csak egyszer hozod létre a default listákat, ha még nem léteznek:
    createDefaultLists(user.uid);
    // Utána betöltöd az összes listát:
    loadUserLists(user.uid);
  } else {
    authSection.style.display = "block";
    newListSection.style.display = "none";
    document.getElementById("logout-section").style.display = "none";
    listsContainer.innerHTML = "";
  }
});

// Regisztráció
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (email && password) {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres regisztráció:", userCredential.user.email);
        authMessageEl.textContent = `Sikeres regisztráció! Üdvözlünk, ${userCredential.user.email}!`;
      })
      .catch((error) => {
        console.error("Regisztrációs hiba:", error.message);
        authMessageEl.textContent = `Regisztrációs hiba: ${error.message}`;
      });
  } else {
    authMessageEl.textContent = "Kérjük, add meg az email címet és a jelszót!";
  }
});

// Bejelentkezés
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (email && password) {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres bejelentkezés:", userCredential.user.email);
      })
      .catch((error) => {
        console.error("Bejelentkezési hiba:", error.message);
        authMessageEl.textContent = `Bejelentkezési hiba: ${error.message}`;
      });
  }
});

// Kijelentkezés
logoutBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth)
      .then(() => {
        console.log("Sikeres kijelentkezés");
      })
      .catch((error) => {
        console.error("Kijelentkezési hiba:", error.message);
      });
  } else {
    console.log("Nincs bejelentkezett felhasználó, nincs mit kijelentkezni.");
  }
});

// Létrehozza a default listákat (Teendőlista és Bevásárlólista), ha még nem léteznek
function createDefaultLists(uid) {
  // Detektáljuk az aktuális nyelvet az <html lang="..."> attribútumból
  const lang = document.documentElement.lang || "hu"; // ha nincs beállítva, alapértelmezetten magyar
  
  let todoListName, shoppingListName, todoCategory, shoppingCategory;
  if (lang === "en") {
    todoListName = "📋 To-Do List";
    shoppingListName = "🛒 Shopping List";
    todoCategory = "Tasks";
    shoppingCategory = "Shopping";
  } else if (lang === "de") {
    todoListName = "📋 Aufgabenliste";
    shoppingListName = "🛒 Einkaufsliste";
    todoCategory = "Aufgaben";
    shoppingCategory = "Einkauf";
  } else { // alapértelmezetten magyar
    todoListName = "📋 Teendőlista";
    shoppingListName = "🛒 Bevásárlólista";
    todoCategory = "Feladatok";
    shoppingCategory = "Bevásárlás";
  }

  const userListsRef = ref(db, `users/${uid}/lists`);
  get(userListsRef).then((snapshot) => {
    // Csak akkor hozza létre a default listákat, ha még nem léteznek
    if (!snapshot.exists()) {
      push(userListsRef, { name: todoListName, category: todoCategory });
      push(userListsRef, { name: shoppingListName, category: shoppingCategory });
    }
  });
}

// Betöltjük a felhasználó összes listáját (default + egyéni)
function loadUserLists(uid) {
  createDefaultLists(uid);
  const userListsRef = ref(db, `users/${uid}/lists`);
  onValue(userListsRef, (snapshot) => {
    listsContainer.innerHTML = "";
    if (snapshot.exists()) {
      // Készítünk egy tömböt az összes listával
      const fullListsArray = Object.entries(snapshot.val()).map(
        ([id, data]) => ({ id, ...data })
      );
      // Szűrés: ha a filter nem "all", akkor kiszűrjük a kategóriát
      const filterValue = filterCategorySelect.value;
      let filteredListsArray = fullListsArray;
      if (filterValue !== "all") {
        filteredListsArray = fullListsArray.filter(
          list => list.category.toLowerCase() === filterValue.toLowerCase()
        );
      }
      // Rendereljük a szűrt listákat
      filteredListsArray.forEach(list => {
        renderListBox(list.id, list.name, list.category, uid);
      });
      // Frissítjük a filter opciókat a teljes listából, de visszaállítjuk a jelenlegi értéket
      updateFilterOptions(fullListsArray);
    } else {
      listsContainer.innerHTML = "<p>Nincsenek listák.</p>";
    }
  });
}

function updateFilterOptions(listsArray) {
  // Elmentjük a jelenlegi kiválasztást
  const currentValue = filterCategorySelect.value;
  filterCategorySelect.innerHTML = `<option value="all">Összes</option>`;
  const categories = new Set(listsArray.map(list => list.category));
  categories.forEach(cat => {
    filterCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  // Ha volt kiválasztott érték, visszaállítjuk
  if (currentValue) {
    filterCategorySelect.value = currentValue;
  }
}


filterCategorySelect.addEventListener("change", () => {
  if (auth.currentUser) {
    loadUserLists(auth.currentUser.uid);
  }
});

// Megjeleníti a lista boxot (default és egyéni)
function renderListBox(listId, listName, category, uid) {
  const box = document.createElement("div");
  box.classList.add("list-box");
  // A h2-ben a cím egy span-ben van, majd egy "title-icons" konténer a jobb felső sarkában,
  // amely tartalmazza az edit és delete gombokat.
  box.innerHTML = `
    <h2>
      <span class="list-title">${listName}</span>
      <div class="title-icons">
        <button class="edit-title-btn" data-list="${listId}">
          <span class="material-icons">edit</span>
        </button>
        <button class="delete-list-btn" data-list="${listId}">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </h2>
    <input type="text" class="item-input" placeholder="Új elem hozzáadása">
    <button class="item-add-btn" data-list="${listId}">Hozzáadás</button>
    <ul class="items-ul" id="items-${listId}"></ul>
  `;
  listsContainer.appendChild(box);
  loadListItems(uid, listId, box.querySelector(".items-ul"));
}

// Betölti az adott lista elemeit
function loadListItems(uid, listId, ulElement) {
  const itemsRef = ref(db, `users/${uid}/lists/${listId}/items`);
  onValue(itemsRef, (snapshot) => {
    ulElement.innerHTML = "";
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([itemId, item]) => {
        renderListItem(itemId, item.text, item.done, ulElement, listId, uid);
      });
    }
  });
}

// Megjeleníti az egyes listaelemeket
function renderListItem(itemId, text, done, ulElement, listId, uid) {
  const li = document.createElement("li");
  li.classList.toggle("done", done);
  li.innerHTML = `
    <span class="item-text">${text}</span>
    <div class="icons">
      <span class="material-icons done-icon" data-item="${itemId}" data-list="${listId}" data-done="${done}">done</span>
      <span class="material-icons delete-icon" data-item="${itemId}" data-list="${listId}">delete</span>
      <span class="material-icons edit-icon" data-item="${itemId}" data-list="${listId}">edit</span>
    </div>
  `;
  ulElement.appendChild(li);
}

//Lista boxok létrehozása
customNewListBtn.addEventListener("click", () => {
  const listName = document.getElementById("custom-list-name-input").value.trim();
  const category = document.getElementById("custom-list-category-input").value.trim();
  console.log("Custom lista hozzáadása:", listName, category);

  if (listName === "") {
    console.warn("Üres lista név!");
    return;
  }
  if (!auth.currentUser) {
    console.warn("Nincs bejelentkezett felhasználó!");
    return;
  }

  // DEFINIÁLD A VÁLTOZÓT, mielőtt push() hívnád!
  const userListsRef = ref(db, `users/${auth.currentUser.uid}/lists`);

  let fullName = listName;
  if (category.toLowerCase() === "bevásárlás") {
    fullName = "🛒 " + listName;
  } else if (category.toLowerCase() === "feladatok") {
    fullName = "📋 " + listName;
  }

  push(userListsRef, { name: fullName, category: category })
    .then(() => {
      console.log("Custom lista sikeresen hozzáadva:", fullName);
    })
    .catch((error) => {
      console.error("Hiba a custom lista hozzáadásakor:", error);
    });

  // Töröljük az inputok tartalmát
  document.getElementById("custom-list-name-input").value = "";
  document.getElementById("custom-list-category-input").value = "";
});

// Eseménykezelés a listaelemekhez
document.addEventListener("click", (e) => {
  // Új elem hozzáadása a lista boxban
  if (e.target.matches(".item-add-btn")) {
    const listId = e.target.dataset.list;
    const inputField = e.target.previousElementSibling;
    const text = inputField.value.trim();
    if (text !== "" && auth.currentUser) {
      const itemsRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items`);
      push(itemsRef, { text: text, done: false });
      inputField.value = "";
    }
  }
  
  // Lista box törlése
  if (e.target.closest(".delete-list-btn")) {
    const listId = e.target.closest(".delete-list-btn").dataset.list;
    remove(ref(db, `users/${auth.currentUser.uid}/lists/${listId}`));
  }
  
  // Listaelem pipálása
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    const currentDone = e.target.dataset.done === "true";
    set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}/done`), !currentDone);
  }
  
  // Listaelem törlése
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    remove(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}`));
  }
  
  // Listaelem inline szerkesztése
  if (e.target.matches(".edit-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    const spanEl = e.target.parentElement.previousElementSibling;
    const input = document.createElement("input");
    input.type = "text";
    input.value = spanEl.textContent;
    input.className = "inline-edit-input";
    spanEl.replaceWith(input);
    input.focus();
    input.addEventListener("blur", () => {
      const newText = input.value.trim();
      if (newText !== "") {
        set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}/text`), newText);
      }
      const newSpan = document.createElement("span");
      newSpan.className = "item-text";
      newSpan.textContent = newText;
      input.replaceWith(newSpan);
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        input.blur();
      }
    });
  }

  // Lista box címének inline szerkesztése
  if (e.target.matches(".edit-title-btn") || e.target.closest(".edit-title-btn")) {
    const btn = e.target.closest(".edit-title-btn");
    const listId = btn.dataset.list;
    // Keressük meg a h2 elemet, amely tartalmazza a listabox címét
    const h2El = btn.closest("h2");
    if (!h2El) return;
    // Keressük meg a cím span elemét
    const titleSpan = h2El.querySelector(".list-title");
    if (!titleSpan) return;
    const currentTitle = titleSpan.textContent;
    // Hozzunk létre egy input mezőt az inline szerkesztéshez
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentTitle;
    input.className = "inline-edit-input";
    // Cseréljük le a span-t az inputra
    titleSpan.replaceWith(input);
    input.focus();
    input.addEventListener("blur", () => {
      const newTitle = input.value.trim();
      if (newTitle !== "") {
        set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/name`), newTitle);
      }
      const newSpan = document.createElement("span");
      newSpan.className = "list-title";
      newSpan.textContent = newTitle || currentTitle;
      input.replaceWith(newSpan);
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        input.blur();
      }
    });
  }
});

// Hamburger ikon és nyelvválasztó menü kezelése
const hamburgerIcon = document.getElementById("hamburger-icon");
const languageDropdown = document.getElementById("language-dropdown");

hamburgerIcon.addEventListener("click", () => {
  // Egyszerű toggle: ha nem látszik, megjelenítjük, ha látszik, elrejtjük
  if (languageDropdown.style.display === "none" || languageDropdown.style.display === "") {
    languageDropdown.style.display = "block";
  } else {
    languageDropdown.style.display = "none";
  }
});




// Service Worker regisztráció (PWA támogatás)
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
