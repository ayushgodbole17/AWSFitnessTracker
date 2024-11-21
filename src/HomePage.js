import React, { useEffect, useState } from "react";
import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import Chatbot from "./chatbot"; // Import the chatbot component
import axios from "axios";
import "./HomePage.css";
import "./chatbot.css"; // Import chatbot-specific styling
import { toast } from "react-toastify";

const HomePage = ({ onLogout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkouts = async () => {
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        process.env.GET_WORKOUT_URL + `?email=${userID}`
      );
      // Sort workouts by date in descending order
      const sortedWorkouts = response.data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast.error("Failed to fetch workouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userID = localStorage.getItem("email");
    if (userID) {
      fetchWorkouts();
    } else {
      // Redirect to login if the user is not authenticated
      toast.error("You are not authenticated. Redirecting to login.");
      onLogout(); // Trigger logout and redirect
    }
  }, []);

  return (
    <div className="container">
      <h2 className="page-title">Workout Tracker</h2>
      <button className="btn-danger" onClick={onLogout}>
        Sign Out
      </button>
      <div className="row">
        <div className="card">
          <UploadWorkout onWorkoutSave={fetchWorkouts} />
        </div>
        <div className="card scroll-card">
          <GetWorkouts workouts={workouts} loading={loading} />
        </div>
      </div>
      
      {/* Add the chatbot widget to the homepage */}
      <Chatbot />
    </div>
  );
};

export default HomePage;
