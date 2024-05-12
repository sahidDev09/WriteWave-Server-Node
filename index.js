const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;

const app = express();

// Middleware
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2fyd1rz.mongodb.net`;

let client;

async function connectToMongoDB() {
  try {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Connected to MongoDB");

    // Setup routes after successful connection
    setupRoutes();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

function setupRoutes() {

  const blogsCollection = client.db("writeWave").collection("blogs");
  const commentCollection = client.db("writeWave").collection("comments");

  app.get("/", (req, res) => {
    res.send("Hello writeWave! This is your backend server.");
  });

  // get all blogs data

  app.get("/blogs", async (req, res) => {
    const result = await blogsCollection.find().toArray();
    res.json(result);
  });

  

  // server checkup
  app.listen(port, () => {
    console.log(`WriteWave backend server is running on PORT:${port}`);
  });
}

connectToMongoDB();
