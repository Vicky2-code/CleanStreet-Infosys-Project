const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/user");
const votesRoutes = require("./routes/votes");
const adminRoutes = require("./routes/admin");

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/votes", require("./routes/votes"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/user", userRoutes);
app.use("/api/votes", votesRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/reports", require("./routes/reports"));
app.use("/api/reports", require("./routes/reports"));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
