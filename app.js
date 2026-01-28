// API Configuration - Production Backend
const API_URL = 'https://wizybot-fullstack.onrender.com/agent';
const API_HEALTH_URL = 'https://wizybot-fullstack.onrender.com';

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const typingIndicator = document.getElementById('typingIndicator');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const sendButtonText = document.getElementById('sendButtonText');
const sendButtonIcon = document.getElementById('sendButtonIcon');
const errorMessage = document.getElementById('errorMessage');
const statusText = document.getElementById('statusText');

// State
let isProcessing = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    setupInputListeners();
});

// Check if server is running
async function checkServerStatus() {
    try {
        const response = await fetch(API_HEALTH_URL);
        if (response.ok) {
            const data = await response.json();
            statusText.textContent = 'Online';
            console.log('Backend status:', data);
        }
    } catch (error) {
        statusText.textContent = 'Disconnected';
        showError('Cannot connect to server. Please try again later.');
        console.error('Server connection error:', error);
    }
}

// Setup input listeners
function setupInputListeners() {
    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // Send on Enter (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Send example query
function sendExampleQuery(query) {
    userInput.value = query;
    sendMessage();
}

// Send message
async function sendMessage() {
    const query = userInput.value.trim();
    
    if (!query || isProcessing) return;

    // Hide welcome message
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }

    // Clear error
    hideError();

    // Add user message
    addMessage('user', query);

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show typing indicator
    showTyping();

    // Disable input
    setProcessing(true);

    try {
        // Call API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Hide typing indicator
        hideTyping();

        // Add bot response
        addMessage('bot', data.response);

    } catch (error) {
        hideTyping();
        console.error('Error:', error);
        
        let errorMsg = 'Sorry, there was an error processing your request. ';
        
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            errorMsg += 'Could not connect to the server. Please try again in a few moments.';
        } else {
            errorMsg += 'Please try again.';
        }
        
        showError(errorMsg);
        
        // Add error message as bot response
        addMessage('bot', '❌ ' + errorMsg);
    } finally {
        setProcessing(false);
    }
}

// Add message to chat
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Format message with paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        messageContent.appendChild(p);
    });

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTyping() {
    typingIndicator.classList.add('active');
    scrollToBottom();
}

// Hide typing indicator
function hideTyping() {
    typingIndicator.classList.remove('active');
}

// Set processing state
function setProcessing(processing) {
    isProcessing = processing;
    sendButton.disabled = processing;
    userInput.disabled = processing;

    if (processing) {
        sendButtonText.textContent = '';
        sendButtonIcon.innerHTML = '<span class="spinner"></span>';
    } else {
        sendButtonText.textContent = 'Send';
        sendButtonIcon.textContent = '➤';
    }
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    setTimeout(() => {
        hideError();
    }, 8000);
}

// Hide error
function hideError() {
    errorMessage.classList.remove('show');
}

// Scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Clear chat function
function clearChat() {
    if (confirm('Are you sure you want to clear the chat?')) {
        // Remove all messages except typing indicator
        const messages = messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Show welcome message again
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
        
        // Clear error
        hideError();
        
        // Focus input
        userInput.focus();
    }
}

// Auto-check server status every 30 seconds
setInterval(checkServerStatus, 30000);
