const sidebar = document.getElementById('sidebar');
const mobileMenu = document.getElementById('mobileMenu');
const backdrop = document.getElementById('backdrop');
const desktopToggle = document.getElementById('desktopToggle');
const newChatButton = document.getElementById('newChatButton');
const chatList = document.getElementById('chatList');
const form = document.getElementById('composer');
const input = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

let chats = JSON.parse(localStorage.getItem('chatgpt-clone-chats') || '[]');
let activeChatId = localStorage.getItem('chatgpt-clone-active') || null;

function save() {
  localStorage.setItem('chatgpt-clone-chats', JSON.stringify(chats));
  localStorage.setItem('chatgpt-clone-active', activeChatId || '');
}

function escapeHTML(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function getActiveChat() {
  return chats.find(chat => chat.id === activeChatId);
}

function renderHistory() {
  chatList.innerHTML = '';
  chats.forEach(chat => {
    const button = document.createElement('button');
    button.className = 'history-item' + (chat.id === activeChatId ? ' active' : '');
    const title = document.createElement('span');
    title.textContent = chat.title;
    button.appendChild(title);
    button.addEventListener('click', () => {
      activeChatId = chat.id;
      save();
      renderHistory();
      renderMessages();
      closeMobileSidebar();
    });
    chatList.appendChild(button);
  });
}

function renderMessages() {
  const chat = getActiveChat();
  messages.innerHTML = '';
  emptyState.style.display = chat && chat.messages.length ? 'none' : 'flex';
  if (!chat) return;

  chat.messages.forEach(item => {
    const row = document.createElement('div');
    row.className = `message ${item.role}`;
    if (item.role === 'assistant') {
      row.innerHTML = `<div class="assistant-avatar"><svg viewBox="0 0 24 24"><path d="M12 2.2 14.1 4l.1 2.8 2.7.8 2-1.9 2.2 2.2-1.9 2 .8 2.7H22v3.1h-2.8l-1.2 2.5 1.9 2-2.2 2.2-2-1.9-2.7.8-.1 2.8H8.9l-.1-2.8-2.7-.8-2 1.9-2.2-2.2 1.9-2-.8-2.7H.8v-3.1h2.8l.8-2.7-1.9-2 2.2-2.2 2 1.9 2.7-.8L9.5 4l2.5-1.8Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></div>`;
    }
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = escapeHTML(item.content).replace(/\n/g, '<br>');
    row.appendChild(bubble);
    messages.appendChild(row);
  });
  document.getElementById('chatStage').scrollTop = document.getElementById('chatStage').scrollHeight;
}

function createChat(title) {
  const chat = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, messages: [] };
  chats.unshift(chat);
  activeChatId = chat.id;
  save();
  renderHistory();
  return chat;
}

function openNewChat() {
  activeChatId = null;
  save();
  renderHistory();
  renderMessages();
  input.focus();
  closeMobileSidebar();
}

function closeMobileSidebar() {
  document.body.classList.remove('mobile-open');
}

function generateReply(prompt) {
  const text = prompt.trim().toLowerCase();
  if (/^(hi|hello|hey)[!.]?$/.test(text)) return 'Hello! How can I help you today?';
  if (text.includes('html') || text.includes('website')) return 'I can help with that. Start with a clear page structure, add semantic HTML, style it with responsive CSS, and keep interactions in JavaScript. What part would you like to build?';
  if (text.includes('weather')) return 'I don’t have live location or weather data in this demo, but I can help you design or implement a weather interface.';
  if (text.includes('thank')) return 'You’re welcome! Happy to help.';
  return `I’m ready to help with “${prompt.trim()}”. This is a polished frontend demo, so the built-in assistant provides local example responses rather than calling an external AI API.`;
}

function sendMessage(value) {
  const text = value.trim();
  if (!text) return;

  let chat = getActiveChat();
  if (!chat) chat = createChat(text.length > 28 ? text.slice(0, 28) + '…' : text);

  chat.messages.push({ role: 'user', content: text });
  chat.title = chat.messages.length === 1 ? (text.length > 28 ? text.slice(0, 28) + '…' : text) : chat.title;
  save();
  renderHistory();
  renderMessages();
  input.value = '';
  input.style.height = '26px';
  sendButton.disabled = true;

  const typingRow = document.createElement('div');
  typingRow.className = 'message assistant';
  typingRow.innerHTML = `<div class="assistant-avatar"><svg viewBox="0 0 24 24"><path d="M12 2.2 14.1 4l.1 2.8 2.7.8 2-1.9 2.2 2.2-1.9 2 .8 2.7H22v3.1h-2.8l-1.2 2.5 1.9 2-2.2 2.2-2-1.9-2.7.8-.1 2.8H8.9l-.1-2.8-2.7-.8-2 1.9-2.2-2.2 1.9-2-.8-2.7H.8v-3.1h2.8l.8-2.7-1.9-2 2.2-2.2 2 1.9 2.7-.8L9.5 4l2.5-1.8Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
  messages.appendChild(typingRow);
  document.getElementById('chatStage').scrollTop = document.getElementById('chatStage').scrollHeight;

  setTimeout(() => {
    typingRow.remove();
    chat.messages.push({ role: 'assistant', content: generateReply(text) });
    save();
    renderMessages();
  }, 650);
}

input.addEventListener('input', () => {
  input.style.height = '26px';
  input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  sendButton.disabled = !input.value.trim();
});

input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventEvent = true;
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  sendMessage(input.value);
});

mobileMenu.addEventListener('click', () => document.body.classList.add('mobile-open'));
backdrop.addEventListener('click', closeMobileSidebar);
desktopToggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
newChatButton.addEventListener('click', openNewChat);
document.getElementById('attachButton').addEventListener('click', () => showToast('Attachment picker opened'));
document.getElementById('toolsButton').addEventListener('click', () => showToast('Tools are ready'));
document.getElementById('profileButton').addEventListener('click', () => showToast('Profile menu'));
document.getElementById('modelButton').addEventListener('click', () => showToast('ChatGPT'));
document.getElementById('shareButton').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast('Link copied');
  } catch {
    showToast('Share link ready');
  }
});

renderHistory();
renderMessages();
