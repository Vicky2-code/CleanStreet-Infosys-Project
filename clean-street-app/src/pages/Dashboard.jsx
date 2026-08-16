import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { API_BASE_URL } from "../api/config";
import { getComplaints } from "../api/complaints";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
  });
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    api
      .get("/complaints")
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error("API error:", err));

    getComplaints().then((data) => {
      setMetrics({
        total: data.length,
        pending: data.filter((c) => c.status === "received").length,
        inReview: data.filter((c) => c.status === "in_progress").length,
        resolved: data.filter((c) => c.status === "resolved").length,
      });
      setComplaints(data);
    });
  }, []);

  return (
    <div className="container">
      <h2>Complaints Dashboard</h2>

      {/* Metrics Section */}
      <div className="metrics">
        <div className="metric-card">
          <p>Total Issues</p>
          <h3>{metrics.total}</h3>
        </div>
        <div className="metric-card">
          <p>Pending</p>
          <h3>{metrics.pending}</h3>
        </div>
        <div className="metric-card">
          <p>In Progress</p>
          <h3>{metrics.inReview}</h3>
        </div>
        <div className="metric-card">
          <p>Resolved</p>
          <h3>{metrics.resolved}</h3>
        </div>
      </div>

      {/* Complaints List */}
      <div className="dashboard-content">
        <div className="recent">
          <h3>Recent Complaints</h3>
          {complaints
            .slice(-5)
            .reverse()
            .map((c) => (
              <div key={c._id} className="complaint-card">
                <h4>{c.title}</h4>
                <p>{c.description.substring(0, 80)}...</p>
                <p className="status">Status: {c.status}</p>

                <div className="votes">
                  <span>👍 {c.upvotes || 0}</span>
                  <span>👎 {c.downvotes || 0}</span>
                </div>

                {/* ✅ Show complaint photos */}
                {c.photos && c.photos.length > 0 && (
                  <div className="complaint-photos">
                    {c.photos.map((_, index) => (
                      <img
                        key={index}
                        src={`${API_BASE_URL}/complaints/${c._id}/photo/${index}`}
                        alt={`Complaint ${index}`}
                        className="complaint-photo"
                      />
                    ))}
                  </div>
                )}

                <Link to={`/complaints/${c._id}`} className="view-btn">
                  View Details
                </Link>
              </div>
            ))}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <Link to="/new-complaint">
            <button>+ Report New Issue</button>
          </Link>
          <Link to="/complaints">
            <button>View All Complaints</button>
          </Link>
          <Link to="/map">
            <button>Issue Map</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
