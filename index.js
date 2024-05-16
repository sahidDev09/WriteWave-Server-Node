const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5001;

const app = express();

// Middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://writewave-99267.web.app",
    "https://writewave-99267.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//middleware for jwt verify

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ messsage: "Unauthorize Access!" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ messsage: "Unauthorize Access!" });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2fyd1rz.mongodb.net/writeWave?retryWrites=true&w=majority`;

let client;

async function connectToMongoDB() {
  try {
    client = new MongoClient(uri);
    // await client.connect();
    console.log("Connected to MongoDB");

    setupRoutes();

    app.listen(port, () => {
      console.log(`WriteWave backend server is running on PORT:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

function setupRoutes() {
  const blogsCollection = client.db("writeWave").collection("blogs");
  const commentCollection = client.db("writeWave").collection("comments");
  const wishListCollection = client.db("writeWave").collection("wishlist");

  // code for all jwt implementation

  app.post("/jwt", async (req, res) => {
    const email = req.body;
    const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, cookieOption).send({ success: true });
  });

  // clear jwt for logout

  app.get("/logout", (req, res) => {
    res
      .clearCookie("token", { ...cookieOption, maxAge: 0 })
      .send({ success: true });
  });

  app.get("/", (req, res) => {
    res.send("Hello writeWave! This is your backend server.");
  });

  // get all blogs data

  app.get("/blogs", async (req, res) => {
    const result = await blogsCollection.find().sort({ date: -1 }).toArray();
    res.json(result);
  });

  //get all data for table

  app.get("/blogs/table", async (req, res) => {
    const result = await blogsCollection
      .find()
      .sort({ long_des_count: -1 })
      .toArray();
    res.json(result);
  });

  //get specific data using id

  app.get("/blogs/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await blogsCollection.findOne(query);
    res.send(result);
  });

  // get all comments from client

  app.post("/comments", async (req, res) => {
    const commentsData = req.body;
    const result = await commentCollection.insertOne(commentsData);
    res.send(result);
  });

  //get all added post from client

  app.post("/blogs", async (req, res) => {
    const blogsData = req.body;
    const result = await blogsCollection.insertOne(blogsData);
    res.send(result);
  });

  // get wishlisted data from client

  app.post("/wishlist", async (req, res) => {
    const wishListData = req.body;
    const result = await wishListCollection.insertOne(wishListData);
    res.send(result);
  });

  // get wishlist data for specific user email

  app.get("/wishlist/:email", verifyToken, async (req, res) => {
    const tokenEamil = req.user.email;
    const email = req.params.email;

    if (tokenEamil !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const result = await wishListCollection.find({ email: email }).toArray();
    res.send(result);
  });

  // delete wishlist data for specific user email

  app.delete("/wishlist/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await wishListCollection.deleteOne(query);
    res.send(result);
  });

  // update data

  app.put("/blogs/:id", async (req, res) => {
    const id = req.params.id;
    const blogsData = req.body;
    const query = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        ...blogsData,
      },
    };
    const result = await blogsCollection.updateOne(query, updateDoc, options);
    res.send(result);
  });
}

connectToMongoDB();
