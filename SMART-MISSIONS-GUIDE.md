# 🧠 Intelligens Küldetések Rendszer - Fejlesztői Dokumentáció

## 📋 Áttekintés

Az intelligens küldetések rendszer automatikusan generál személyre szabott napi kihívásokat diákok számára, az órarendjük és eseményeik alapján. A rendszer intelligens logikát használ a releváns küldetések létrehozásához, duplikációk elkerülésére és a felhasználói élmény optimalizálására.

## 🎯 Főbb Funkciók

### ✅ Implementált Funkciók

1. **Intelligens Küldetésgenerálás**
   - Órarend alapú tantárgy kinyerés
   - Események elemzése (dolgozatok, prezentációk)
   - Duplikáció ellenőrzés meglévő teendőkkel szemben

2. **Sablon Rendszer**
   - 4 küldetéstípus: tanulási felkészülés, vizsga felkészülés, házi feladat, átismétlés
   - Dinamikus tantárgy helyettesítés
   - Változatos nehézségi szintek

3. **XP Rendszer**
   - Küldetéstípus szerinti XP jutalmak (15-25 XP)
   - Teljesítés nyomon követése
   - Firebase integrált progress rendszer

4. **UI/UX**
   - Modern, reszponzív design
   - Animációk és vizuális visszajelzések
   - Mobilbarát felület

### 🔮 Jövőbeli Fejlesztések

1. **AI Integráció**
   - OpenAI/Gemini API használata
   - Intelligens sablongenerálás
   - Személyre szabott nehézségi szintek

2. **Fejlett Analitika**
   - Tanulási minták elemzése
   - Teljesítmény trendek
   - Javaslatok optimalizálásra

## 🏗️ Rendszerarchitektúra

### 📁 Fájlstruktúra

```
js/
├── daily-quests-manager.js    # Fő intelligens küldetés logika
├── quest-ui.js               # UI komponensek
└── target-group-advanced.js  # Célcsoport kezelés

css/
├── daily-quests.css          # Intelligens küldetések stílusok
└── base.css                  # Alap CSS változók

index.js                      # Fő integráció
index.html                    # HTML struktúra
```

### 🔧 Főbb Komponensek

#### 1. DailyQuestsManager Osztály

```javascript
class DailyQuestsManager {
  // Intelligens küldetésgenerálás
  async generateSmartMissionsForStudent()
  
  // Tantárgyak kinyerése órarendből
  async getStudentSubjects()
  
  // Események kinyerése naptárból
  async getStudentEvents()
  
  // Duplikáció ellenőrzés
  isDuplicateMission(missionText, existingTasks)
  
  // UI frissítés
  updateSmartMissionsUI()
}
```

#### 2. Sablon Rendszer

```javascript
getStudentMissionTemplates() {
  return {
    study_preparation: [
      "{subject} órára készülj fel ma legalább 15 percet!",
      "Ismételd át a {subject} témakört a holnapi dolgozatra!"
    ],
    exam_preparation: [
      "Készülj fel a {subject} dolgozatra 30 percet!",
      "Ismételd át a {subject} képleteket!"
    ],
    // ... további típusok
  };
}
```

## 🎮 Használati Útmutató

### 👨‍💻 Fejlesztőknek

#### 1. Rendszer Inicializálása

```javascript
// Automatikus inicializálás
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    await initSmartMissionsSystem();
    updateSmartMissionsVisibility();
  }, 2000);
});
```

#### 2. Küldetések Generálása

```javascript
// Manuális generálás
if (window.smartMissionsManager) {
  const missions = await window.smartMissionsManager.generateSmartMissionsForStudent();
  console.log(`Generated ${missions.length} missions`);
}
```

#### 3. UI Frissítés

```javascript
// UI frissítés
window.smartMissionsManager.updateSmartMissionsUI();
```

### 🧪 Tesztelés

#### Tesztelési Fájl Használata

1. Nyisd meg a `test-smart-missions.html` fájlt
2. Kattints a "Teljes Teszt Futtatása" gombra
3. Ellenőrizd az eredményeket a konzolban

#### Konzol Parancsok

```javascript
// Rendszer tesztelése
window.testSmartMissions()

// Küldetések generálása
window.generateSmartMissions()

// Rendszer állapot ellenőrzése
window.smartMissionsManager.getStudentSubjects()
```

## 📊 Adatstruktúrák

### Küldetés Objektum

```javascript
{
  id: "unique-mission-id",
  title: "🎯 Matematika - Tanulási felkészülés",
  description: "Matematika órára készülj fel ma legalább 15 percet!",
  xp: 15,
  estimatedDuration: "15-20 perc",
  tag: "study_preparation",
  questType: "task",
  priority: "medium",
  icon: "📚",
  subject: "Matematika",
  missionType: "study_preparation",
  isSmartMission: true,
  generatedAt: 1703123456789,
  dueDate: "2023-12-21",
  completed: false
}
```

### Firebase Adatstruktúra

```
users/{userId}/smartMissions/{date}/
├── missions: [mission1, mission2, ...]
├── generatedAt: timestamp
├── completed: number
└── total: number
```

## 🎨 CSS Változók

### Alap Változók

```css
:root {
  --card-bg: var(--bg-secondary);
  --accent-bg: rgba(16, 185, 129, 0.1);
  --accent-color: #10B981;
  --success-bg: rgba(16, 185, 129, 0.1);
  --success-color: #10B981;
  --disabled-bg: #6B7280;
  --disabled-text: #9CA3AF;
  --secondary-bg: var(--bg-tertiary);
}
```

### Komponens Osztályok

- `.smart-missions-container` - Fő konténer
- `.smart-mission-card` - Egyes küldetés kártya
- `.smart-mission-header` - Küldetés fejléc
- `.smart-mission-complete-btn` - Teljesítés gomb

## 🔧 Konfiguráció

### Küldetéstípusok

```javascript
const missionTypes = {
  study_preparation: {
    xp: 15,
    duration: "15-20 perc",
    priority: "medium",
    icon: "📚"
  },
  exam_preparation: {
    xp: 25,
    duration: "30-45 perc",
    priority: "high",
    icon: "📝"
  },
  homework_focus: {
    xp: 20,
    duration: "25-40 perc",
    priority: "high",
    icon: "✏️"
  },
  review_and_practice: {
    xp: 18,
    duration: "20-30 perc",
    priority: "medium",
    icon: "🔄"
  }
};
```

### Duplikáció Szabályok

- 3+ közös szó = duplikátum
- Ugyanaz a tantárgy + küldetéstípus = duplikátum
- 2 egymást követő nap ugyanaz a feladattípus = duplikátum

## 🚀 Teljesítmény Optimalizálás

### Gyorsítótárazás

- Firebase adatok gyorsítótárazása
- UI frissítések optimalizálása
- Debounced eseménykezelés

### Memória Kezelés

- Event listener cleanup
- Firebase listener unsubscribe
- Garbage collection optimalizálás

## 🐛 Hibaelhárítás

### Gyakori Hibák

1. **"Smart missions manager nem inicializálva"**
   - Ellenőrizd a Firebase kapcsolatot
   - Várj 2-3 másodpercet az inicializálásra

2. **"Nincs tantárgy találva"**
   - Ellenőrizd az órarend adatokat
   - Győződj meg róla, hogy a felhasználó diák célcsoportba tartozik

3. **"UI nem frissül"**
   - Ellenőrizd a DOM elemeket
   - Frissítsd az oldalt

### Debug Parancsok

```javascript
// Részletes debug információk
console.log('Smart Missions Debug:', {
  manager: window.smartMissionsManager,
  firebase: !!(window.db && window.auth),
  user: window.auth?.currentUser,
  container: document.getElementById('smart-missions-container')
});

// Küldetések ellenőrzése
window.smartMissionsManager?.loadSmartMissionsFromFirebase()
  .then(missions => console.log('Current missions:', missions));
```

## 📈 Metrikák és Analitika

### Követett Adatok

- Generált küldetések száma
- Teljesítési arány
- Népszerű küldetéstípusok
- Felhasználói engagement

### Firebase Analytics

```javascript
// Küldetés generálás követése
analytics.logEvent('smart_mission_generated', {
  mission_count: missions.length,
  mission_types: missions.map(m => m.missionType)
});

// Teljesítés követése
analytics.logEvent('smart_mission_completed', {
  mission_id: missionId,
  xp_earned: mission.xp
});
```

## 🔮 Jövőbeli Fejlesztések

### AI Integráció

```javascript
// AI prompt előkészítés
prepareMissionPrompt(subjects, events) {
  return {
    subjects: subjects,
    events: events,
    context: `Generate personalized daily missions...`,
    requirements: [
      '2-4 missions per day',
      'Relevant to current subjects',
      'Appropriate difficulty level'
    ]
  };
}
```

### Fejlett Analitika

- Tanulási minták elemzése
- Teljesítmény trendek
- Javaslatok optimalizálásra
- Személyre szabott nehézségi szintek

### Mobil Optimalizálás

- PWA funkciók
- Offline támogatás
- Push értesítések
- Gyorsítótárazás

## 📝 Licenc és Közreműködés

Ez a rendszer a Todo & Shopping List alkalmazás része. A fejlesztéshez való hozzájárulásokat szívesen fogadjuk!

### Közreműködés

1. Fork a repository-t
2. Hozz létre egy feature branch-et
3. Commit a változtatásaidat
4. Push a branch-re
5. Nyiss egy Pull Request-et

---

**Fejlesztői csapat**: Todo & Shopping List Team  
**Verzió**: 1.0.0  
**Utolsó frissítés**: 2023. december 21. 

## 🤖 AI-Based Mission Generation

### Overview

The system now supports AI-powered mission generation as an alternative to template-based generation. This feature prepares comprehensive prompts based on the user's schedule and sends them to AI services for personalized mission creation.

### Key Functions

#### `prepareMissionPromptForAI()`
Prepares a comprehensive AI prompt by gathering:
- Today's schedule from timetable
- Calendar events for the next week
- Previous missions from last 3 days

**Returns:** A well-formatted prompt string ready for AI API calls

#### `generateMissionsWithAI()`
Generates missions using AI (currently uses sample responses, ready for API integration)

**Returns:** Array of AI-generated mission objects

#### `getSampleMissionResponse(prompt)`
Provides dummy AI responses for testing and development

**Parameters:**
- `prompt`: The prepared AI prompt
**Returns:** Array of sample mission descriptions

#### `convertAIResponseToMissions(aiResponse)`
Converts AI text responses into structured mission objects

**Parameters:**
- `aiResponse`: Array of mission descriptions from AI
**Returns:** Array of mission objects with metadata

### AI Prompt Structure

The generated prompt includes:
```
Kérlek, készíts 3 rövid, motiváló, napi küldetést egy diák számára a mai feladataihoz.

📚 A mai órái: ["matematika", "történelem", "fizika"].
📅 Közelgő események: ["holnap: matek dolgozat", "pénteken: angol prezentáció"].
🔄 A tegnapi küldetései: ["Ismételd át a matekot!", "Írj egy vázlatot a prezentációhoz"].

🎯 A cél, hogy:
- Ne ismétlődjenek a tegnapi küldetésekkel
- Legyenek hasznosak és relevánsak a mai órákhoz
- Adják érzetet, hogy 'küldetést' teljesít a felhasználó
- Motiválóak és rövidek legyenek (max 2-3 mondat)
- Különböző nehézségi szintűek legyenek
```

### Future AI API Integration

The system is prepared for OpenAI/Gemini API integration:

```javascript
// Example OpenAI API call structure (commented in code)
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates personalized daily missions for students."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 300,
    temperature: 0.7
  })
});
```

### Global Functions for AI Testing

```javascript
// Generate AI-based missions
window.generateAIMissions()

// Prepare AI prompt
window.prepareAIPrompt()

// Test AI mission generation
window.testAIMissions()
``` 