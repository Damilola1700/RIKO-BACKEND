const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db")
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


const userRoute = require("./route/userRoute");
const adminRoute = require("./route/adminRoute");
const userProfileC = require("./route/updateProfile");
const articleRoute = require("./route/articleRoute");
const notificationRoute = require("./route/notificationRoute");
const bookmarkRoute = require("./route/bookmarkRoute");


app.use("/api/auth", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/profile", userProfileC);
app.use("/api/articles", articleRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/bookmarks", bookmarkRoute);


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server showing at http://localhost:${PORT}`);
});
