// Setup UI Elements
const sendButton = document.querySelector('.send-btn');
const inputField = document.querySelector('input[placeholder="How can I help?"]');
const chatHistory = document.querySelector('.chat-history');
const chatListSection = document.querySelector('.chat-list-section');
const newChatBtn = document.querySelector('.new-chat-btn');
const chatTitle = document.querySelector('.chat-title');

// State Management for Multiple Chats
const systemPrompt = { role: "system", content: "You are Diia.AI, a helpful, concise personal assistant for Ukrainian government services. Keep your answers brief." };

let conversations = {
    'chat1': [
        systemPrompt, 
        { role: "assistant", content: "Hello, Roman! I am Diia.AI, your personal assistant.<br><br>Roman, I remember your name. How can I help you today with government services?" }
    ],
    'chat2': [
        systemPrompt, 
        { role: "assistant", content: "Hello, Roman! I am Diia.AI, your personal assistant.<br><br>Do you need help checking your passport expiration date?" }
    ],
    'chat3': [
        systemPrompt, 
        { role: "assistant", content: "Hello, Roman! I am Diia.AI, your personal assistant.<br><br>What else can I help you with today?" }
    ]
};

let activeChatId = 'chat1';
let totalChats = 3; 

// Draw the active chat to the screen
function renderChat() {
    chatHistory.innerHTML = ''; // Clear canvas
    
    conversations[activeChatId].forEach(msg => {
        if (msg.role === 'system') return; // Hide system instructions

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
        
        if (msg.role === 'user') {
            msgDiv.innerHTML = `<div class="bubble">${msg.content}</div>`;
        } else {
            msgDiv.innerHTML = `<div class="text">${msg.content}</div>`;
        }
        chatHistory.appendChild(msgDiv);
    });
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Sidebar & New Chat Logic
function switchChat(tabElement) {
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    tabElement.classList.add('active');
    
    activeChatId = tabElement.getAttribute('data-chat');
    chatTitle.textContent = tabElement.textContent; // Update top header
    renderChat(); // Redraw UI
}

// Attach click listeners to default hardcoded chats
document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', function() { switchChat(this); });
});

// "Create New Chat" Button Logic
newChatBtn.addEventListener('click', function() {
    totalChats++;
    const newChatId = 'chat' + totalChats;
    
    // Add a fresh chat array to State Memory
    conversations[newChatId] = [
        systemPrompt, 
        { role: "assistant", content: "Hello, Roman! What new topic would you like to discuss today?" }
    ];

    // Build new sidebar tab
    const newTab = document.createElement('div');
    newTab.className = 'chat-item';
    newTab.setAttribute('data-chat', newChatId);
    newTab.textContent = 'New Chat ' + (totalChats - 2);
    
    // Make new tab clickable and switch to it
    newTab.addEventListener('click', function() { switchChat(this); });
    chatListSection.appendChild(newTab);
    newTab.click(); 
});

// Initial render on page load
renderChat();

// Input Listeners
inputField.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') sendButton.click();
});

// Initialize WarpMind with try-catch to handle potential issues
let mind = null;
try {
    mind = new WarpMind({ baseURL: "https://ai.cavi.au.dk", model: "warp/mind-small" });
} catch (error) {
    console.error("WarpMind init failed. Check server/CORS.", error);
}

// Handle sending messages
sendButton.addEventListener('click', async function() {
    const userText = inputField.value.trim();
    if (userText === '') return;

    // Save user message to active chat state and redraw
    conversations[activeChatId].push({ role: "user", content: userText });
    inputField.value = '';
    renderChat(); 

    // Show Thinking indicator
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai-message thinking-indicator';
    thinkingDiv.innerHTML = `<div class="text" style="color: #666; font-style: italic;">Diia.AI is thinking...</div>`;
    chatHistory.appendChild(thinkingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (!mind) {
         chatHistory.removeChild(thinkingDiv);
         conversations[activeChatId].push({ role: "assistant", content: "<span style='color:red;'>API Error: Not connected. Please run on warp.cs.au.dk</span>" });
         renderChat();
         return;
    }

    try {
        // Fetch from API
        const response = await mind.chat(conversations[activeChatId]);
        
        // Save AI response to active chat state and redraw
        conversations[activeChatId].push({ role: "assistant", content: response });
        renderChat();
    } catch (error) {
        chatHistory.removeChild(thinkingDiv);
        conversations[activeChatId].push({ role: "assistant", content: "<span style='color:red;'>Connection error.</span>" });
        renderChat();
        console.error("API Error:", error);
    }
});