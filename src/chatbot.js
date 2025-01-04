import React, { useState } from 'react';
import keywords from './keywords';
import "./chatbot.css";

function Chatbot() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    setChatHistory((prev) => [...prev, { sender: 'user', message: userInput }]);

    // Check if the input is workout-related
    const isWorkoutRelated = keywords.some((keyword) =>
      userInput.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!isWorkoutRelated) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: "I can only help with workout-related questions. Please ask about fitness or exercises!",
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(process.env.REACT_APP_CHATBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        { sender: 'bot', message: data.response },
      ]);
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
    } finally {
      setLoading(false);
      setUserInput('');
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? "chat-widget-expanded" : ""}`}>
      {isOpen ? (
        <div className="chat-widget-open">
          <div className="chat-header" onClick={toggleChat}>
            <span className="chat-title">Chat with us</span>
            <button className="close-btn" onClick={toggleChat}>&times;</button>
          </div>
          <div className="chat-body">
            <div className="chat-history">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`chat-bubble ${chat.sender}`}>
                  <strong>{chat.sender === "user" ? "You" : "Bot"}: </strong>
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
              <button onClick={handleSend} className="chat-send-btn">
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-widget-closed" onClick={toggleChat}>
          <div className="chat-header">
            <span className="chat-title">Chat with us</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
