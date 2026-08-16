import { useEffect, useState } from "react";
import api from "../api/client";
import { API_BASE_URL } from "../api/config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/reports.css";

const COLORS = [
  "#4caf50",
  "#ff9800",
  "#f44336",
  "#2196f3",
  "#9c27b0",
  "#00bcd4",
];

export default function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [topAreas, setTopAreas] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topUpvoted, setTopUpvoted] = useState([]);
  const [topDownvoted, setTopDownvoted] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [resolution, setResolution] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    ward: "",
    category: "",
  });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      const query = new URLSearchParams();
      if (filters.start) query.append("start", filters.start);
      if (filters.end) query.append("end", filters.end);
      if (filters.ward) query.append("ward", filters.ward);
      if (filters.category) query.append("category", filters.category);

      const qs = query.toString() ? `?${query.toString()}` : "";

      // ✅ API calls (make sure your backend has these routes)
      const [
        sRes,
        catRes,
        areasRes,
        trendsRes,
        upRes,
        downRes,
        contribRes,
        resRes,
        mapRes,
      ] = await Promise.all([
        api.get(`/reports/summary${qs}`),
        api.get(`/reports/complaints/categories${qs}`),
        api.get(`/reports/complaints/top-areas${qs}`),
        api.get(`/reports/complaints/trends${qs}`), 
        api.get(`/reports/votes/top-upvoted${qs}`),
        api.get(`/reports/votes/top-downvoted${qs}`),
        api.get(`/reports/users/top-contributors${qs}`),
        api.get(`/reports/resolution/stats${qs}`),
        api.get(`/reports/complaints/map-points${qs}`),
      ]);

      setSummary(sRes.data);
      setCategoryData(catRes.data);
      setTopAreas(areasRes.data);
      setTrends(trendsRes.data);
      setTopUpvoted(upRes.data);
      setTopDownvoted(downRes.data);
      setTopContributors(contribRes.data);
      setResolution(resRes.data);
      setMapPoints(mapRes.data);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const handleExport = async (format) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/reports/export/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CleanStreet_Report.${format}`;
    link.click();
  } catch (err) {
    alert("Failed to export report");
    console.error(err);
  }
};


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    loadAll();
  };

  function HeatmapLayer({ points }) {
    const map = useMap();

    useEffect(() => {
      if (!map || !window.L.heatLayer) return;
      const heatLayer = window.L.heatLayer(
        points.map((p) => [p.lat, p.lng, 0.5]),
        { radius: 25, blur: 15, maxZoom: 17 }
      ).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    }, [map, points]);

    return null;
  }

  return (
    <div className="reports-page">
      <h1>📊 Admin Reports</h1>

      {/* 🔹 Summary */}
      <div className="summary-cards">
        {summary ? (
          <>
            <div className="card">
              <h3>Total Complaints</h3>
              <p>{summary.totalComplaints}</p>
            </div>
            <div className="card">
              <h3>Pending</h3>
              <p>{summary.pending}</p>
            </div>
            <div className="card">
              <h3>In Progress</h3>
              <p>{summary.inProgress}</p>
            </div>
            <div className="card">
              <h3>Resolved</h3>
              <p>{summary.resolved}</p>
            </div>
            <div className="card">
              <h3>Total Users</h3>
              <p>{summary.totalUsers}</p>
            </div>
          </>
        ) : (
          <p>Loading summary...</p>
        )}
      </div>

      {/* 🔹 Filters */}
      <div className="filters-bar">
        <label>
          Start Date:{" "}
          <input
            type="date"
            name="start"
            value={filters.start}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          End Date:{" "}
          <input
            type="date"
            name="end"
            value={filters.end}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          Ward:{" "}
          <input
            type="text"
            name="ward"
            value={filters.ward}
            onChange={handleFilterChange}
            placeholder="Ward name"
          />
        </label>
        <label>
          Category:{" "}
          <input
            type="text"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="Category"
          />
        </label>
        <button onClick={applyFilters}>Apply</button>
      </div>

      {/* 🔹 Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h4>Complaints Over Time</h4>
          <LineChart width={600} height={250} data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </div>

        <div className="chart-card">
          <h4>Category Distribution</h4>
          <PieChart width={400} height={250}>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* 🔹 Lists & Heatmap */}
      <div className="two-column">
        <div className="list-card">
          <h4>Top Areas</h4>
          <ul>
            {topAreas.map((a) => (
              <li key={a._id}>
                {a._id} — {a.count} complaints
              </li>
            ))}
          </ul>

          <h4>Top Upvoted Complaints</h4>
          <ul>
            {topUpvoted.map((item) => (
              <li key={item._id}>
                {item.complaint?.title || "—"} ({item.upvotes} upvotes)
              </li>
            ))}
          </ul>

          <h4>Top Downvoted Complaints</h4>
          <ul>
            {topDownvoted.map((item) => (
              <li key={item._id}>
                {item.complaint?.title || "—"} ({item.downvotes} downvotes)
              </li>
            ))}
          </ul>
        </div>

        <div className="map-card">
          <h4>Heatmap / Complaint Locations</h4>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: 300 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapLayer points={mapPoints} />
          </MapContainer>
        </div>
      </div>

      {/* 🔹 Contributors & Resolution */}
      <div className="bottom-row">
        <div className="card">
          <h4>Top Contributors</h4>
          <ol>
            {topContributors.map((tc) => (
              <li key={tc.userId}>
                {tc.name} — {tc.complaints} complaints
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h4>Resolution Metrics</h4>
          {resolution ? (
            <>
              <p>Backlog (older than 30 days): {resolution.backlog}</p>
              <p>SLA (resolved within 7 days): {resolution.slaPercent}%</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>

      {/* 🔹 Export */}
      <div className="export-buttons">
  <h3>Export Full Reports</h3>
  <button onClick={() => handleExport("pdf")}>📄 Export PDF</button>
  {/* <button onClick={() => handleExport("excel")}>📊 Export Excel</button> */}
  <button onClick={() => handleExport("csv")}>📊 Export Exel</button>
</div>

    </div>
  );
}
