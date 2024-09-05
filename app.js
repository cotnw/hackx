const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chatRouter = require("./routes/chat");
const dashboardRouter = require("./routes/dashboard");

app.use("/chat", chatRouter);
app.use("/dashboard", dashboardRouter);

const db = process.env.MONGODB_URL;

mongoose
    .connect(db)
    .then(() => console.log("MongoDB Connected..."))
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
