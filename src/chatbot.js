import React, { useState } from 'react';
import "./chatbot.css"; // Assuming the styles are now in `chatbot.css`

function Chatbot() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Track the state of the chat widget
  const [loading, setLoading] = useState(false); // Track loading state for "Bot is typing..."

  // Toggle chat visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // Update chat history with user's input
    setChatHistory((prev) => [...prev, { sender: 'user', message: userInput }]);
    setLoading(true); // Show "Bot is typing..." when waiting for a response

    try {
      const response = await fetch(process.env.CHATBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      const data = await response.json();

      // Update chat history with bot's response
      setChatHistory((prev) => [
        ...prev,
        { sender: 'user', message: userInput },
        { sender: 'bot', message: data.response },
      ]);
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
    } finally {
      setLoading(false); // Hide "Bot is typing..." after response
    }

    // Clear the input
    setUserInput('');
  };

  return (
    <div className="chat-widget">
      {isOpen ? (
        <div className="chat-widget-open">
          <div className="chat-header" onClick={toggleChat}>
            Chat with us
            <button className="close-btn" onClick={toggleChat}>&times;</button>
          </div>
          <div className="chat-body">
            <div className="chat-history">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`chat-bubble ${chat.sender}`}>
                  <strong>{chat.sender === 'user' ? 'You' : 'Bot'}: </strong>
                  {chat.message}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble bot">
                  <strong>Bot: </strong>Bot is typing...
                </div>
              )}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Ask me anything about workouts!"
                className="chat-input"
              />
              <button onClick={handleSend} className="chat-send-btn">Send</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-widget-closed" onClick={toggleChat}>
          <div className="chat-header">
            Chat with us
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
