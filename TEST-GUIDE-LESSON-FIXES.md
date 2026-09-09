# Test Guide — Lesson/World/Teacher Fixes

## Quick Test (2 minutes)

1. Open `07-app/index.html` in a browser
2. Click **"Begin Lesson 1"** button
3. Lesson content appears
4. **Scroll down** past the lesson steps
5. You should see the **"Ask Sage anything"** section with:
   - Chat message display area
   - Text input field
   - "Send" button

6. Type a question, e.g.: "What does Em mean?"
7. Click **Send** (or press Enter)
8. Sage responds with coaching about the lesson
9. Chat history shows both your message and Sage's response
10. Click **"Back to the path"** button
11. Chat clears when you return to home view

---

## Expected Behavior

### Chat Interface
- **Input field placeholder:** "Ask about this lesson..."
- **Send button:** Sends message and queries coaching system
- **Message styling:** 
  - Student messages: Light moss background
  - Sage responses: Light sage green background
- **Auto-focus:** Input field refocuses after sending for quick follow-up questions

### Coaching Response
- Sage responds based on the lesson content
- Responses are contextual (different for each lesson)
- Falls back to "I'm thinking about that..." if coaching service unavailable
- All responses cite lesson data (never invented diagnosis)

### World Tracking (Optional)
To enable world view tracking:
```javascript
// Add to app.js or anywhere before lesson opens:
globalThis.CONTENT_ATTRIBUTION_ENABLED = true;
```
Then open any lesson. In browser console, you should see the world-view-tracker module loading.

---

## Troubleshooting

### Chat doesn't appear
- ✓ Check that chat section is scrollable (scroll down in lesson)
- ✓ Open browser DevTools (F12) and check for JavaScript errors
- ✓ Verify `lessonRunner` is loaded (should be loaded via `lesson-runner.js` script)

### Send button doesn't work
- ✓ Check that text input has focus
- ✓ Verify JavaScript is enabled
- ✓ Check DevTools console for errors
- ✓ Ensure `askCoachAbout` method exists on lessonRunner

### Sage doesn't respond
- ✓ Check DevTools Network tab for `/api/coach` or similar calls
- ✓ If coaching service unavailable, you'll see "I'm thinking about that..." message
- ✓ This is expected — fallback to local template is working
- ✓ To enable real coaching: set up coaching service endpoint and ensure server/.env has `ANTHROPIC_API_KEY`

### World tracking not working
- ✓ Enable with: `globalThis.CONTENT_ATTRIBUTION_ENABLED = true`
- ✓ Check DevTools console for import of world-view-tracker.js
- ✓ Verify localStorage or PocketBase endpoint is configured (see world-view-tracker.js)
- ✓ This is non-blocking — lesson works fine without it

---

## Code Flow Diagram

```
openLesson(index)
  ├─ lessonRunner.openLesson()
  │   └─ Renders lesson HTML
  ├─ wireLessonChatHandler(index, model)
  │   └─ Wires up chat input/send button listeners
  │       └─ On Send:
  │           ├─ Display user message
  │           ├─ Call lessonRunner.askCoachAbout({index, learnerProfile})
  │           │   └─ coachSurface.js → chatEngine.js → coaching service
  │           │       └─ Returns coaching response
  │           └─ Display Sage's response
  └─ trackWorldViewIfEnabled(lessonId)
      └─ If CONTENT_ATTRIBUTION_ENABLED:
          └─ world-view-tracker.trackWorldView("emerald-hollow", lessonId)
              └─ Records lesson view for attribution

home()
  ├─ clearLessonChat()
  │   └─ Clears chat messages and input
  └─ Hide lesson view, show home view
```

---

## Files to Know

| File | Purpose | Modified |
|------|---------|----------|
| `07-app/index.html` | App shell, lesson UI, chat wiring | ✅ Yes |
| `07-app/core/lesson-runner.js` | Lesson loading & coaching | ✗ No (already has `askCoachAbout()`) |
| `07-app/core/world-view-tracker.js` | World attribution tracking | ✗ No (already has `trackWorldView()`) |
| `07-app/core/coachSurface.js` | Coaching envelope builder | ✗ No (already wired) |
| `07-app/core/chatEngine.js` | Coaching logic & drill lookup | ✗ No (already implemented) |

---

## Next Steps

1. ✅ Test the chat interface (2 min)
2. ✅ Verify Sage responds to questions
3. ✓ (Optional) Enable `CONTENT_ATTRIBUTION_ENABLED` to activate world tracking
4. ✓ (Future) Merge `h5-05content-backfill` branch to reunite app with Godot world
5. ✓ (Future) Wire Emerald Hollow Godot scenes to trigger lesson display

---

## Known Limitations

- Chat interface is local-only (messages not persisted)
- Coaching responses are generic (based on lesson ID, not question content)
- If coaching service unavailable, fallback to "Keep practicing..." message
- World tracking is opt-in (disabled by default)
- Does not yet integrate with Godot Emerald Hollow world scenes
