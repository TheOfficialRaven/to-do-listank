# 📅 Timetable Feature - Student Weekly Schedule Management

## Áttekintés

A **Timetable (Órarend)** funkció egy újfajta szolgáltatás a to-do alkalmazásban, amely kifejezetten a **"student" (diák)** célcsoport számára készült. Lehetővé teszi a diákok számára, hogy felépítsék és kezeljék heti órarendjüket, amely később alapul szolgál a kontextus-tudatos küldetés generáláshoz.

## 🎯 Fő jellemzők

### Funkciók
- ✅ **Heti órarend kezelése** - Tantárgyak, időpontok, tanárok rögzítése
- ✅ **Kétféle nézet** - Táblázatos és lista nézet váltása
- ✅ **Firebase integráció** - Valós idejű adatszinkronizáció
- ✅ **Ütközés-ellenőrzés** - Nem lehet egyszerre két órát beállítani
- ✅ **Reszponzív design** - Mobil és desktop optimalizált
- ✅ **Célcsoport korlátozás** - Csak diák felhasználók látják
- ✅ **Szerkesztés és törlés** - Teljes CRUD funkciók

### Adatstruktúra
Minden órarend bejegyzés a következő adatokat tartalmazza:
```javascript
{
  id: "auto-generated",
  subject: "Matematika",          // Kötelező
  day: "tuesday",                 // Kötelező (monday-sunday)
  startTime: "10:00",            // Kötelező (HH:MM)
  endTime: "10:45",              // Kötelező (HH:MM)
  teacher: "Kovács Béla",        // Opcionális
  classroom: "1/A",              // Opcionális
  onlineLink: "https://...",     // Opcionális
  createdAt: 1234567890,         // Timestamp
  updatedAt: 1234567890          // Timestamp
}
```

## 📁 Fájlstruktúra

### HTML módosítások
- **`index.html`** - Új órarend szekció és navigációs tab hozzáadva
- **Órarend szekció** - Táblázatos és lista nézet UI
- **Szerkesztő modal** - Óra szerkesztése és törlése
- **CSS importok** - Timetable stílusok beillesztése

### CSS stílusok
- **`css/timetable.css`** - Teljes órarend stílusrendszer
  - Reszponzív grid layout
  - Táblázatos és lista nézet stílusok
  - Form styling és validáció
  - Mobil optimalizáció
  - Témavariánsok támogatása

### JavaScript komponensek
- **`js/timetable-manager.js`** - Fő órarend manager osztály
  - TimetableManager osztály
  - Firebase adatkezelés
  - UI renderelés és eseménykezelés
  - Validációs logika
  - Küldetésrendszer integráció API

### Firebase konfiguráció
- **`database.rules.json`** - Órarend adatok biztonsági szabályai
  - Felhasználónkénti hozzáférés-szabályozás
  - Adatvalidációs szabályok
  - Időformátum ellenőrzés

### Nyelvi fordítások
- **`languages/hu.json`** - Magyar fordítások hozzáadva
  - UI szövegek
  - Validációs üzenetek
  - Hibaüzenetek
  - Form címkék

## 🚀 Használat

### Előfeltételek
1. Felhasználónak be kell jelentkeznie
2. A célcsoport "student" kell legyen
3. Firebase kapcsolat aktív

### Órarend hozzáadása
1. Válaszd az "📅 Órarend" tabot (csak diákoknak látható)
2. Kattints az "Új óra hozzáadása" gombra
3. Töltsd ki a kötelező mezőket:
   - Tantárgy neve
   - Nap kiválasztása
   - Kezdési és befejezési idő
4. Opcionálisan add meg:
   - Tanár nevét
   - Terem/helyszín
   - Online link
5. Kattints a "Mentés" gombra

### Órarend szerkesztése
1. Kattints bármelyik órára a táblázatban vagy listában
2. Módosítsd az adatokat
3. Kattints "Mentés" vagy "Törlés" gombra

### Nézetek váltása
- **Táblázat nézet**: Hagyományos heti órarend táblázat
- **Lista nézet**: Napok szerint csoportosított lista nézet

## 🔧 Technikai részletek

### Célcsoport integráció
```javascript
// Diák státusz ellenőrzés
checkStudentStatus() {
  const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
  this.isStudentUser = targetGroup?.id === 'student';
  this.updateVisibility();
}
```

### Firebase útvonal
```
users/{uid}/timetable/{entryId}
```

### Eseménykezelés
```javascript
// Célcsoport változás figyelése
document.addEventListener('targetGroupChanged', (event) => {
  this.checkStudentStatus();
  if (this.isStudentUser) {
    this.loadTimetableData();
  }
});
```

### API a küldetésrendszerhez
```javascript
// Mai órák lekérdezése
window.timetableManager.getTodayClasses()

// Közelgő órák (következő 24 órában)
window.timetableManager.getUpcomingClasses(24)

// Összes tantárgy listája
window.timetableManager.getSubjects()
```

## 🎯 Jövőbeli integráció

### Küldetésrendszer kapcsolat
Az órarend adatok fel lesznek használva a napi küldetések generálásában:

1. **Kontextus-tudatos küldetések**
   - "Készülj fel a holnapi matematika órára"
   - "Ismételd át a fizika jegyzeteidet 2 órával az óra előtt"

2. **Időzített emlékeztetők**
   - Óra előtti felkészülési feladatok
   - Jegyzetek áttekintési küldetések

3. **Tantárgy-specifikus feladatok**
   - Az órarendből kinyert tantárgyak alapján
   - Tanár nevének felhasználása személyre szabáshoz

### Példa küldetés generálás
```javascript
// Példa: Következő óra alapján küldetés készítés
const upcomingClass = timetableManager.getUpcomingClasses(2)[0];
if (upcomingClass) {
  const quest = {
    title: `Készülj fel a ${upcomingClass.subject} órára`,
    description: `${upcomingClass.teacher} tanárnál ${upcomingClass.startTime}-kor`,
    type: 'preparation',
    dueTime: upcomingClass.date,
    subject: upcomingClass.subject
  };
}
```

## 🔒 Biztonság

### Adatvédelem
- Csak a felhasználó saját órarendjét érheti el
- Firebase biztonsági szabályokkal védett
- Minden változás hitelesített felhasználó által

### Validáció
- Kötelező mezők ellenőrzése
- Időformátum validáció
- Ütközés-ellenőrzés
- Nap érvényességének ellenőrzése

## 📱 Reszponzív design

### Desktop (>768px)
- Kétoszlopos form layout
- Teljes táblázatos nézet
- Hover effektek

### Tablet (768px)
- Egyoszlopos form layout
- Összenyomott táblázat
- Touch-friendly gombok

### Mobil (<480px)
- Függőleges form layout
- Lista nézet preferált
- Nagyobb érintési területek

## 🐛 Debug funkciók

### Konzol parancsok
```javascript
// Órarend debug információk
debugTimetable()

// Mai órák lekérdezése
getTodayClasses()

// Közelgő órák lekérdezése
getUpcomingClasses(24)
```

### Hibaelhárítás
1. **Órarend tab nem látható**: Ellenőrizd a célcsoportot (student kell legyen)
2. **Adatok nem mentődnek**: Firebase kapcsolat és bejelentkezés ellenőrzése
3. **Validációs hibák**: Kötelező mezők és időformátum ellenőrzése

## 📄 Telepítés

A funkció automatikusan elérhető, ha:
1. ✅ Firebase inicializálva van
2. ✅ Felhasználó bejelentkezett
3. ✅ Célcsoport "student"-re állított
4. ✅ CSS és JS fájlok betöltve

## 🔄 Frissítések

### v1.0.0 (Aktuális)
- ✅ Alap órarend funkciók
- ✅ CRUD műveletek
- ✅ Kétféle nézet
- ✅ Firebase integráció
- ✅ Reszponzív design

### Tervezett fejlesztések
- 🔄 Ismétlődő órák támogatása
- 🔄 Színes kategorizálás tantárgyak szerint
- 🔄 Export/import funkciók
- 🔄 Küldetés generátor integráció
- 🔄 Push értesítések órák előtt
- 🔄 Statisztikák és kimutatások

## 📞 Támogatás

Ha problémába ütközöl az órarend funkcióval:
1. Ellenőrizd a konzol hibaüzeneteket
2. Használd a debug funkciókat
3. Ellenőrizd a Firebase kapcsolatot
4. Győződj meg róla, hogy diák célcsoportot választottál

---

**Fejlesztette:** AI Assistant  
**Verzió:** 1.0.0  
**Utolsó frissítés:** 2024.12.20 