// coachSurface.js — coaching UI layer for lessons + practice
// Integrates chatEngine.js to show teacher responses during lessons

import { reply as chatReply } from './chatEngine.js';

export function createCoachSurface(store, teacherId, containerEl) {
  // Build the coach chat UI
  const surface = {
    chatLog: [],
    store,
    teacherId,
    containerEl,
  };

  // Create the coach UI structure
  const coachBox = document.createElement('div');
  coachBox.className = 'coach-surface';
  coachBox.innerHTML = `
    <div class="coach-header">
      <span class="coach-title">Ask your teacher</span>
    </div>
    <div class="coach-log"></div>
    <div class="coach-input-row">
      <input type="text" class="coach-input" placeholder="Ask about a chord, your progress, or the lesson..." />
      <button class="coach-send-btn">Send</button>
    </div>
  `;

  const chatLogEl = coachBox.querySelector('.coach-log');
  const inputEl = coachBox.querySelector('.coach-input');
  const sendBtn = coachBox.querySelector('.coach-send-btn');

  function addMessage(text, isUser) {
    const msg = document.createElement('div');
    msg.className = 'coach-msg' + (isUser ? ' user' : ' teacher');
    msg.textContent = text;
    chatLogEl.appendChild(msg);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function handleSend() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, true);
    inputEl.value = '';
    const response = chatReply(surface.store, surface.teacherId, text);
    addMessage(response.text, false);
  }

  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  surface.element = coachBox;
  surface.addMessage = addMessage;
  surface.handleSend = handleSend;

  if (containerEl) containerEl.appendChild(coachBox);
  return surface;
}

export function closeCoachSurface(surface) {
  if (surface?.element?.parentNode) {
    surface.element.parentNode.removeChild(surface.element);
  }
}
