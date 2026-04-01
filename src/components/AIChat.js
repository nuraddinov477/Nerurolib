import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import '../styles/AIChat.css';

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAI, setSelectedAI] = useState('claude');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAISelector, setShowAISelector] = useState(false);
  const messagesEndRef = useRef(null);

  const aiProviders = [
    {
      id: 'claude',
      name: 'Claude',
      icon: '🤖',
      description: 'Anthropic AI - Aqlli va xavfsiz',
      color: '#D97706'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '💬',
      description: 'OpenAI - Eng mashhur AI',
      color: '#10A37F'
    },
    {
      id: 'copilot',
      name: 'Copilot',
      icon: '🚀',
      description: 'Microsoft - Ishonchli yordamchi',
      color: '#0078D4'
    },
    {
      id: 'grok',
      name: 'Grok',
      icon: '⚡',
      description: 'xAI - Yangi avlod AI',
      color: '#000000'
    }
  ];

  const welcomeMessages = {
    claude: "Salom! Men Claude, sizga qanday yordam bera olaman?",
    chatgpt: "Salom! Men ChatGPT. Savollaringiz bo'lsa, so'rang!",
    copilot: "Salom! Men Copilot. Sizga yordam berishga tayyorman!",
    grok: "Hey! Men Grok. Nima kerak?"
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        text: welcomeMessages[selectedAI],
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, selectedAI]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentAI = () => {
    return aiProviders.find(ai => ai.id === selectedAI);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(buildApiUrl('/ai/chat'), {
        message: inputMessage,
      });

      const aiMessage = {
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);

      // Fallback response
      const fallbackResponse = generateFallbackResponse(inputMessage);
      const aiMessage = {
        text: fallbackResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateFallbackResponse = (message) => {
    const responses = {
      claude: `Men sizning "${message}" savolingizga javob berish uchun API key kerak. Admin paneldan API kalitni sozlang.`,
      chatgpt: `Sizning savolingizni tushundim, lekin hozircha API key sozlanmagan. Iltimos, sozlamalarni tekshiring.`,
      copilot: `API ulanishi yo'q. Admin paneldan Copilot API key ni kiriting.`,
      grok: `Yo, API key kerak! Adminga ayt sozlasin.`
    };

    // Simple keyword responses for demo
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('kitob') || lowerMessage.includes('book')) {
      return `Bizning saytimizda juda ko'p kitoblar bor! 📚 Katalogga o'ting va o'zingizga yoqqan kitobni toping.`;
    }

    if (lowerMessage.includes('narx') || lowerMessage.includes('price')) {
      return `Kitoblar narxi turlicha. Katalogda har bir kitobning narxini ko'rishingiz mumkin. 💰`;
    }

    if (lowerMessage.includes('yetkazib') || lowerMessage.includes('delivery')) {
      return `Yetkazib berish 2-3 kun ichida amalga oshiriladi. Bepul yetkazib berish 100,000 UZS dan yuqori buyurtmalar uchun. 🚚`;
    }

    if (lowerMessage.includes('salom') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Salom! Sizga qanday yordam bera olaman? 😊`;
    }

    return responses[selectedAI] || `Kechirasiz, hozirda API ulanmagan. Iltimos, admin paneldan API sozlamalarini to'ldiring.`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChangeAI = (aiId) => {
    setSelectedAI(aiId);
    setShowAISelector(false);
    setMessages([{
      text: welcomeMessages[aiId],
      sender: 'ai',
      timestamp: new Date().toISOString()
    }]);
  };

  const currentAI = getCurrentAI();

  return (
    <>
      {/* Chat Button */}
      <button
        className={`ai-chat-button ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="AI Yordamchi"
      >
        <span className="ai-icon">{currentAI.icon}</span>
        <span className="ai-badge">AI</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header" style={{background: currentAI.color}}>
            <div className="ai-header-info">
              <button
                className="ai-selector-btn"
                onClick={() => setShowAISelector(!showAISelector)}
              >
                <span className="ai-current-icon">{currentAI.icon}</span>
                <div className="ai-current-name">
                  <strong>{currentAI.name}</strong>
                  <small>{currentAI.description}</small>
                </div>
                <span className="ai-dropdown-icon">▼</span>
              </button>
            </div>
            <button
              className="ai-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* AI Selector Dropdown */}
          {showAISelector && (
            <div className="ai-selector-dropdown">
              {aiProviders.map(ai => (
                <button
                  key={ai.id}
                  className={`ai-option ${selectedAI === ai.id ? 'active' : ''}`}
                  onClick={() => handleChangeAI(ai.id)}
                  style={{borderLeft: `4px solid ${ai.color}`}}
                >
                  <span className="ai-option-icon">{ai.icon}</span>
                  <div className="ai-option-info">
                    <strong>{ai.name}</strong>
                    <small>{ai.description}</small>
                  </div>
                  {selectedAI === ai.id && <span className="ai-check">✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="ai-avatar" style={{background: currentAI.color}}>
                    {currentAI.icon}
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {msg.sender === 'user' && (
                  <div className="user-avatar">👤</div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="ai-message">
                <div className="ai-avatar" style={{background: currentAI.color}}>
                  {currentAI.icon}
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`${currentAI.name} ga savol bering...`}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{background: currentAI.color}}
            >
              ➤
            </button>
          </div>

          {/* Footer */}
          <div className="ai-chat-footer">
            <small>Powered by {currentAI.name} AI</small>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChat;
