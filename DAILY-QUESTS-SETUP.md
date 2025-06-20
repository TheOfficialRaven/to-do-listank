# Daily Quest Generation System Setup Guide

This guide walks you through setting up the automatic daily quest generation system for your Firebase-based to-do webapp.

## 🏗️ System Architecture

The system consists of:
- **Firebase Cloud Functions**: Scheduled function that runs daily at 6:00 AM UTC
- **Firebase Realtime Database**: Stores user data, quest templates, and generated quests
- **Client-side JavaScript**: Manages quest UI and interactions
- **Security Rules**: Protects user data and ensures proper access control

## 📋 Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Node.js 18+ installed
3. Active Firebase project with Realtime Database enabled
4. Firebase Authentication set up
5. Billing enabled for Cloud Functions (Blaze plan required for scheduled functions)

## 🚀 Installation Steps

### 1. Initialize Firebase Functions

```bash
# Navigate to your project directory
cd your-todo-app

# Login to Firebase
firebase login

# Initialize Functions (if not already done)
firebase init functions

# Choose your existing Firebase project
# Select JavaScript or TypeScript (this guide uses JavaScript)
# Choose to install dependencies
```

### 2. Set up Cloud Functions

```bash
# Navigate to the functions directory
cd functions

# Install dependencies
npm install firebase-admin firebase-functions
```

### 3. Replace Functions Code

Copy the provided `functions/index.js` and `functions/package.json` files to your functions directory.

### 4. Update Firebase Configuration

Update the Firebase configuration in `js/daily-quests-manager.js` with your actual project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.region.firebasedatabase.app/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-app-id"
};
```

### 5. Import Quest Templates

Upload the sample quest templates to your Firebase Realtime Database:

```bash
# Use Firebase CLI to import data
firebase database:set /templates sample-quest-templates.json
```

Or manually import via Firebase Console:
1. Go to Firebase Console > Realtime Database
2. Click "Import JSON"
3. Select `sample-quest-templates.json`

### 6. Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:generateDailyQuests
```

### 7. Update Database Security Rules

Deploy the database rules:

```bash
firebase deploy --only database
```

### 8. Add CSS and JavaScript to Your App

1. Add the CSS file reference to your HTML:
```html
<link rel="stylesheet" href="css/daily-quests.css">
```

2. Add the JavaScript module:
```html
<script type="module" src="js/daily-quests-manager.js"></script>
```

3. Add the quest container to your HTML:
```html
<div id="daily-quests-container" class="daily-quests-container">
  <!-- Quests will be dynamically loaded here -->
</div>
```

## ⚙️ Configuration

### Cloud Scheduler Setup

The scheduled function should automatically create a Cloud Scheduler job. If not, create one manually:

1. Go to Google Cloud Console > Cloud Scheduler
2. Create a new job:
   - Name: `daily-quest-generation`
   - Frequency: `0 6 * * *` (6:00 AM UTC daily)
   - Target Type: Pub/Sub
   - Topic: `firebase-schedule-generateDailyQuests-{region}`

### Time Zone Adjustment

To change the quest generation time, modify the cron expression in `functions/index.js`:

```javascript
exports.generateDailyQuests = functions.pubsub
  .schedule('0 8 * * *')  // 8:00 AM UTC instead of 6:00 AM
  .timeZone('UTC')        // Change to your preferred timezone
  .onRun(async (context) => {
    // ...
  });
```

### Quest Template Management

Templates are stored in Firebase Realtime Database under `/templates/{goalTarget}/`. Each template has:

- `title`: Quest title (supports dynamic fields like `[today]`, `[username]`)
- `description`: Detailed description
- `xp`: Experience points awarded (1-100)
- `estimatedDuration`: Estimated completion time
- `tag`: Category tag
- `tags`: Array of tags for day-specific filtering
- `active`: Boolean to enable/disable template

## 🔧 Testing

### Manual Quest Generation

You can manually trigger quest generation for testing:

```javascript
// Call from browser console after user is authenticated
dailyQuestsManager.triggerQuestGeneration()
  .then(result => console.log('Quest generation result:', result))
  .catch(error => console.error('Error:', error));
```

### Local Testing

Use Firebase Emulators for local development:

```bash
# Install emulators
firebase init emulators

# Start emulators
firebase emulators:start

# Your functions will be available at http://localhost:5001
```

## 📊 Monitoring

### Cloud Function Logs

View function logs in Firebase Console or via CLI:

```bash
# View recent logs
firebase functions:log

# View specific function logs
firebase functions:log --only generateDailyQuests
```

### Database Monitoring

Monitor quest generation success in Firebase Console:
- Check `/users/{uid}/daily_quests` for generated quests
- Verify `lastQuestDate` and `previousQuestTemplates` are updated
- Monitor XP increases when quests are completed

## 🛠️ Customization

### Adding New Goal Targets

1. Add templates for new goal target in database:
```json
{
  "templates": {
    "newGoalTarget": {
      "template1": {
        "title": "New Quest Type",
        "description": "Description here",
        "xp": 15,
        "estimatedDuration": "20 min",
        "tag": "category",
        "tags": ["monday", "productivity"],
        "active": true
      }
    }
  }
}
```

2. Update client-side validation in `target-group-simple.js`
3. Update database rules if needed

### Custom Dynamic Fields

Add new dynamic field replacements in `functions/index.js`:

```javascript
const replacements = {
  '[today]': date.toLocaleDateString('hu-HU'),
  '[username]': user.username,
  '[dayname]': getDayName(date.getDay()),
  '[weather]': await getWeatherInfo(), // Custom function
  '[mood]': getRandomMood(), // Custom function
  // ... add more fields
};
```

### Quest Difficulty Scaling

Implement difficulty scaling based on user level:

```javascript
function adjustQuestDifficulty(quest, userLevel) {
  const difficultyMultiplier = Math.min(1 + (userLevel / 100), 2);
  quest.xp = Math.round(quest.xp * difficultyMultiplier);
  return quest;
}
```

## 🔒 Security Considerations

1. **Authentication Required**: All Cloud Function calls require user authentication
2. **Rate Limiting**: Implement rate limiting for manual quest generation
3. **Data Validation**: Validate all user inputs and quest data
4. **Privacy**: User data is only accessible by the authenticated user
5. **Admin Functions**: Restrict admin functions to authorized users only

## 🚨 Troubleshooting

### Common Issues

1. **Scheduled Function Not Running**
   - Check Cloud Scheduler in Google Cloud Console
   - Verify billing is enabled (Blaze plan required)
   - Check function logs for errors

2. **Quest Generation Fails**
   - Verify templates exist in database
   - Check user has `goalTarget` set
   - Review function logs for specific errors

3. **Client-side Errors**
   - Ensure Firebase configuration is correct
   - Check browser console for JavaScript errors
   - Verify user is authenticated

4. **Database Permission Denied**
   - Review database security rules
   - Ensure user is properly authenticated
   - Check rule validation logic

### Performance Optimization

1. **Batch Operations**: Use batch writes for multiple database updates
2. **Caching**: Cache template data to reduce database reads
3. **Pagination**: Implement pagination for large user bases
4. **Monitoring**: Set up alerts for function failures

## 📈 Analytics and Metrics

Consider tracking:
- Quest completion rates by goal target
- Average XP earned per user
- Most popular quest types
- User engagement patterns
- Function execution time and success rate

## 🔄 Updates and Maintenance

1. **Regular Template Updates**: Add seasonal or event-specific quests
2. **Function Monitoring**: Monitor performance and error rates
3. **User Feedback**: Collect feedback on quest relevance and difficulty
4. **A/B Testing**: Test different quest generation algorithms
5. **Backup Strategy**: Regular backups of quest templates and user data

---

## 📞 Support

For issues or questions:
1. Check Firebase Console logs
2. Review this documentation
3. Test with Firebase Emulators
4. Check Stack Overflow for Firebase-specific issues

Happy quest generating! 🎯✨ 