# 🏗️ Moduláris Fájlstruktúra Útmutató

## 📁 Új Fájlszerkezet

Az alkalmazás nagy fájljait kisebb, kezelhető modulokra bontottam fel. Ez javítja a karbantarthatóságot, áttekinthetőséget és a fejlesztési élményt.

### 🔧 JavaScript Modulok

#### `/js/` mappa:
- **`main.js`** - Fő alkalmazás belépési pont, koordinálja az összes modult
- **`firebase-config.js`** - Firebase konfiguráció és autentikáció
- **`pwa-manager.js`** - PWA telepítés és service worker kezelés
- **`audio-manager.js`** - Hang és értesítés kezelés
- **`language-manager.js`** - Nyelvi rendszer és lokalizáció
- **`quick-fixes.js`** - Gyors javítások a nyelvi kulcsok megjelenítéséhez

#### Modulok céljai:
1. **Firebase Config**: Elkülöníti a Firebase beállításokat és importokat
2. **PWA Manager**: PWA telepítési logika és service worker kezelés
3. **Audio Manager**: Hang és értesítési rendszer
4. **Main**: Központi koordináció és alapvető funkciók

### 🎨 CSS Modulok

#### `/css/` mappa:
- **`variables.css`** - CSS változók, témák és design tokenek
- **`base.css`** - Alapvető stílusok, resetelések és közös elemek
- **`navigation.css`** - Navigáció, menük és PWA gombok stílusai

#### CSS fájlok:
- **`styles.css`** - Fő CSS fájl, amely importálja az összes modult
- **`modern-themes.css`** - Megtartva az eredeti téma rendszerrel

## 🔄 Migráció

### Régi fájlok:
- ❌ `index.js` (193KB, 5679 sor) → ✅ Több kis modul
- ❌ `index.css` (96KB, 4974 sor) → ✅ Moduláris CSS struktúra

### Új struktúra előnyei:
- 📦 **Moduláris**: Logikai egységekre bontva
- 🔍 **Átlátható**: Kisebb fájlok, könnyebb navigáció
- 🛠️ **Karbantartható**: Egy modul változtatása nem érinti a többit
- ⚡ **Gyorsabb fejlesztés**: Könnyebb hibakeresés és fejlesztés
- 🎯 **Specifikus felelősségek**: Minden modul egy konkrét feladatot lát el

## 📖 Használat

### CSS:
Az `index.html` már az új `styles.css` fájlt használja, amely automatikusan importálja az összes modult.

### JavaScript:
Az `index.html` már az új `js/main.js` fájlt használja, amely koordinálja az összes modult.

## 🚀 Következő lépések

További modulok létrehozása szükség szerint:
- `js/notes-manager.js` - Jegyzetek kezelése
- `js/calendar-manager.js` - Naptár funkciók
- `js/lists-manager.js` - Listák kezelése
- `js/theme-manager.js` - Téma váltás
- `js/language-manager.js` - Nyelvi rendszer
- `css/components.css` - UI komponensek
- `css/modals.css` - Modal ablakok stílusai
- `css/forms.css` - Űrlapok stílusai

## ⚠️ Fontos megjegyzések

1. **Import útvonalak**: Figyelj a relatív útvonalakra az importoknál
2. **Függőségek**: A modulok közötti függőségeket minimalizáld
3. **Globális változók**: Kerüld a globális változók túlzott használatát
4. **Export/Import**: Használj ES6 modulokat a tiszta interfészekért

## 🔧 Fejlesztői parancsok

### Hibakeresés:
```javascript
// Browser konzolban:
debugPWA()        // PWA állapot ellenőrzése
showPWAButton()   // PWA gomb megjelenítése
resetPWA()        // PWA beállítások törlése
forceShowPWA()    // PWA gomb kényszerített megjelenítése
```

### Hang tesztelés:
```javascript
// Browser konzolban:
playNotificationSound()  // Hang lejátszása
stopNotificationSound()  // Hang leállítása
```

### Nyelvi javítások:
```javascript
// Browser konzolban:
fixLanguageKeys()     // Nyelvi kulcsok javítása
fixCalendarDisplay()  // Naptár megjelenítés javítása
fixNotesDisplay()     // Jegyzetek megjelenítés javítása
fixOverviewDisplay()  // Áttekintés megjelenítés javítása
```

---

**Készítette**: AI Assistant  
**Dátum**: 2024  
**Verzió**: 1.0 