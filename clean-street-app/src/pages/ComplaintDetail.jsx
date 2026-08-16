import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCommentsByComplaint, addComment } from "../api/comments";
import api from "../api/client";
import { API_BASE_URL } from "../api/config";
import "../styles/complaintDetail.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 });

  // Load complaint + comments
  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then((res) => {
        setComplaint(res.data);
        setVotes(res.data.votes || { upvotes: 0, downvotes: 0 });
      })
      .catch((err) => console.error("Error loading complaint:", err));

    getCommentsByComplaint(id).then(setComments);
  }, [id]);

  // Handle votes
  const handleVote = async (type) => {
    try {
      const res = await api.post(
        "/votes",
        { complaint_id: id, vote_type: type },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setVotes({ upvotes: res.data.upvotes, downvotes: res.data.downvotes });
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  // Handle new comment
  const handleComment = async (e) => {
    e.preventDefault();
    await addComment({ complaint_id: id, content: newComment });
    setNewComment("");
    setComments(await getCommentsByComplaint(id));
  };

  if (!complaint) return <p>Loading...</p>;

  return (
    <div className="container complaint-detail">
      <h2>{complaint.title}</h2>
      <p>
        <b>Status:</b> {complaint.status}
      </p>
      <p>
        <b>Type:</b> {complaint.type}
      </p>
      <p>
        <b>Priority:</b> {complaint.priority}
      </p>
      <p>
        <b>Description:</b> {complaint.description}
      </p>
      <p>
        <b>Address:</b> {complaint.address}, {complaint.city},{" "}
        {complaint.state} - {complaint.pincode}
      </p>
      <p>
        <b>Phone:</b> {complaint.phone}
      </p>
      {/* <p>
        <b>Landmark:</b> {complaint.landmark}
      </p> */}

      {/* Map - fix location field */}
      {complaint.location_coords?.lat && complaint.location_coords?.lng && (
        <div className="map-section">
          <h3>Location</h3>
          <MapContainer
            center={[complaint.location_coords.lat, complaint.location_coords.lng]}
            zoom={15}
            style={{ height: "300px", borderRadius: "8px", marginTop: "10px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker
              position={[
                complaint.location_coords.lat,
                complaint.location_coords.lng,
              ]}
            >
              <Popup>
                {complaint.title} <br /> {complaint.address}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Photos */}
      <h3>Photos</h3>
      <div className="complaint-photos">
        {Array.isArray(complaint.photos) && complaint.photos.length > 0 ? (
          complaint.photos.map((_, idx) => (
            <img
              key={idx}
              src={`${API_BASE_URL}/complaints/${complaint._id}/photo/${idx}`}
              alt={`Complaint ${idx}`}
              className="complaint-photo"
            />
          ))
        ) : (
          <p>No photos uploaded</p>
        )}
      </div>

      {/* Voting Section */}
      <div className="vote-buttons">
        <button onClick={() => handleVote("upvote")}>👍 {votes.upvotes}</button>
        <button onClick={() => handleVote("downvote")}>👎 {votes.downvotes}</button>
      </div>

      {/* Comments */}
      <div className="comments">
        <h3>Comments</h3>
        {comments.length === 0 && <p>No comments yet.</p>}
        {comments.map((c) => (
          <p key={c._id}>
            <b>{c.user_id?.name || "User"}:</b> {c.content}
          </p>
        ))}

        <form onSubmit={handleComment} className="comment-form">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
}
