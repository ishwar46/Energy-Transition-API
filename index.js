// importing Packages
const express = require("express");
const dotenv = require("dotenv");
const connectToDB = require("./database/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const Chat = require("./models/chat");
const fs = require("fs");
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseconfig/firebase-config.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// creating an express apps
const app = express();
// configuring dotenv to use the .env file
dotenv.config();
const corsOptions = {
  // origin: "https://crownthevision.vercel.app",
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
// connecting to database
connectToDB();
// accepting json data
app.use(express.json());
// accepting form data
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', true);

const directories = [
  "public/uploads",
  "public/uploads/userimage",
  "public/uploads/accompanyingimages",
  "public/uploads/bannerimages",
  "public/uploads/author1signature",
  "public/uploads/author1image",
  "public/uploads/author2signature",
  "public/uploads/author2image",
  "public/uploads/venueimage",
  "public/uploads/siteimage",
  "public/uploads/excursionPdfs",
  "public/uploads/eventPdfs",
  "public/uploads/pdfs",
  "public/uploads/pdf1",
  "public/uploads/volunteerimage",
  "public/uploads/onSiteRegisterImage"
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  "/public/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);

app.use(
  "/public/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);
app.use(
  "/public/uploads/userimage",
  express.static(path.join(__dirname, "public/uploads/userimage"))
);
app.use(
  "/public/uploads/accompanyingimages",
  express.static(path.join(__dirname, "public/uploads/accompanyingimages"))
);
app.use(
  "/public/uploads/bannerimages",
  express.static(path.join(__dirname, "public/uploads/bannerimages"))
);
app.use(
  "/public/uploads/author1signature",
  express.static(path.join(__dirname, "public/uploads/author1signature"))
);
app.use(
  "/public/uploads/author1image",
  express.static(path.join(__dirname, "public/uploads/author1image"))
);
app.use(
  "/public/uploads/author2signature",
  express.static(path.join(__dirname, "public/uploads/author2signature"))
);
app.use(
  "/public/uploads/author2image",
  express.static(path.join(__dirname, "public/uploads/author2image"))
);

app.use(
  "/public/uploads/pdfs",
  express.static(path.join(__dirname, "public/uploads/pdfs"))
);
app.use(
  "/public/uploads/eventPdfs",
  express.static(path.join(__dirname, "public/uploads/eventPdfs"))
);
app.use(
  "/public/uploads/pdf1",
  express.static(path.join(__dirname, "public/uploads/pdf1"))
);
app.use(
  "/public/uploads/onSiteRegisterImage",
  express.static(path.join(__dirname, "public/uploads/onSiteRegisterImage"))
);

app.use("/api/queries", require("./routes/subscriptionRoutes"));
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.use("/api/speaker", require("./routes/speakerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/season", require("./routes/seasonRoutes"));
app.use("/api", require("./routes/agendaRoutes"));
app.use("/api/buses", require("./routes/busRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/message", require("./routes/messageRoutes"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/venue", require("./routes/venueRoutes"));
app.use("/api/site", require("./routes/siteSceneRoutes"));
app.use("/api/livestream", require("./routes/liveStreamRoutes"));
app.use("/api/pdf", require("./routes/pdfRoutes"));
app.use("/api/pdfevent", require("./routes/eventPdfRoutes"));
app.use("/api/pdf1", require("./routes/onlyPdfRoutes"));
app.use("/api/volunteer", require("./routes/volunteerRoutes"));
app.use("/api/onsite", require("./routes/onSiteRegisterRoutes"));

//Energy Route
app.use("/api/energy", require("./routes/energy_routes/energyUserRoutes"))

// Pass the Socket.IO instance to the routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res, next) => {
  res.status(200).send("Hello world!");
});

// Create an HTTP server
const server = http.createServer(app);

// Set up Socket.IO with CORS settings
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Handle incoming messages
  socket.on("sendMessage", async (message) => {
    const { userId, text } = message;
    const newMessage = new Chat({ userId, message: text });
    await newMessage.save();

    const populatedMessage = await newMessage.populate(
      "userId",
      "personalInformation.fullName profilePicture"
    );
    io.emit("receiveMessage", populatedMessage);
  });

  // Handle notifications
  socket.on("sendNotification", (notification) => {
    io.emit("receiveNotification", notification);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Pass the Socket.IO instance to the routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/chat", require("./routes/chatRoutes"));

// Defining port
const PORT = process.env.PORT || 5000;
// running the server on port 5000
server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});