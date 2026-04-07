import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import DoctorRecommendationCard from './DoctorRecommendationCard';

const Chat = () => {
  const { token } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ state: 'idle', message: '' });
  const chatHistoryRef = useRef(null);

  // Set initial AI welcome message
  useEffect(() => {
    setChatHistory([
      { role: 'model', content: { question: "Hello! I'm your AI health assistant. Describe your symptoms, and I'll do my best to help." } }
    ]);
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat history when a new message is added
    chatHistoryRef.current?.scrollTo(0, chatHistoryRef.current.scrollHeight);
  }, [chatHistory]);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Reset booking status when conversation changes
    setBookingStatus({ state: 'idle', message: '' });
  }, [chatHistory]);

  const latestAiMessage = () => {
    return [...chatHistory].reverse().find((msg) => msg.role === 'model' && msg.content && msg.content.recommendedDoctor);
  };

  const formatHistoryForBackend = () => {
    return chatHistory.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));
  };

  const lastUserMessage = () => {
    const entry = [...chatHistory].reverse().find((msg) => msg.role === 'user');
    return entry ? entry.content : '';
  };

  const handleBookAppointment = async (doctor) => {
    const latestAI = latestAiMessage();
    if (!latestAI || !doctor || !token) {
      setBookingStatus({ state: 'error', message: 'Unable to book at this time.' });
      return;
    }
    setBookingStatus({ state: 'loading', message: '' });
    try {
      const response = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          diagnosis: latestAI.content.diagnosis || null,
          remedy: latestAI.content.home_remedy || null,
          severityLevel: latestAI.content.severity_level || null,
          consultationDoctor: latestAI.content.consultation_doctor || null,
          symptomSummary: lastUserMessage(),
          chatHistory: formatHistoryForBackend(),
        }),
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      setBookingStatus({ state: 'success', message: `Appointment request sent to ${doctor.name}.` });
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingStatus({ state: 'error', message: 'Unable to send appointment request. Please try again.' });
    }
  };

const handleChatSubmit = async (e) => {
  e.preventDefault();
  if (!symptoms.trim()) return;

  const userMessage = { role: 'user', content: symptoms };
  const newChatHistory = [...chatHistory, userMessage];
  setChatHistory(newChatHistory);
  setLoading(true);
  setSymptoms('');

  try {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        history: newChatHistory.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from the server.');
    }

    const data = await response.json();
    const aiMessage = { role: 'model', content: data };
    setChatHistory([...newChatHistory, aiMessage]);

  } catch (error) {
    const errorMessage = {
      role: 'model',
      content: {
        diagnosis: 'Error',
        home_remedy: 'Could not connect to the AI service. Please try again later.'
      }
    };
    setChatHistory([...newChatHistory, errorMessage]);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="chat-container">
      <div className="chat-history" ref={chatHistoryRef}>
        {chatHistory.map((chat, index) => (
          <div key={index} className={`chat-message ${chat.role === 'user' ? 'user' : 'ai'}`}>
            {chat.role === 'user' ? (
              <p>{chat.content}</p>
            ) : (
              <div>
                {chat.content.question ? (
                  <p>{chat.content.question}</p>
                ) : (
                  <div>
                    <p><strong>Diagnosis:</strong> {chat.content.diagnosis}</p>
                    <p><strong>Remedy:</strong> {chat.content.home_remedy}</p>
                    <p><strong>Severity Level:</strong> {chat.content.severity_level}</p>
                    <p><strong>Consult a:</strong> {chat.content.consultation_doctor}</p>
                    {chat.content.emergency && (
                      <div className="emergency-alert">
                        🚨 This is a medical emergency. Please call emergency services immediately.
                      </div>
                    )}
                    {chat.content.recommendedDoctor && !chat.content.emergency && (
                      <DoctorRecommendationCard
                        doctor={chat.content.recommendedDoctor}
                        onBook={handleBookAppointment}
                        bookingState={bookingStatus}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-message ai"><p>Loading...</p></div>}
      </div>
      <form onSubmit={handleChatSubmit} className="chat-input-form">
        <input
          type="text"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe your symptoms..."
          className="chat-input"
          disabled={loading}
        />
        <button type="submit" className="chat-submit-btn" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
