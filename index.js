const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fvtteka.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const submitCollection = client.db("formBuilder").collection("submits");
    const formCollection = client.db("formBuilder").collection("forms");
    const applicationCollection = client
      .db("formBuilder")
      .collection("applications");

    // Post form
    app.post("/forms", async (req, res) => {
      const formData = req.body;
      console.log("Received form data:", formData);
      const result = await formCollection.insertOne(formData);
      res.json({ message: "Form submitted successfully" });
    });

    // get all forms
    app.get("/forms", async (req, res, next) => {
      try {
        // Retrieve all documents from the formCollection
        const allForms = await formCollection.find().toArray();

        // Respond with the array of form documents
        res.json(allForms);
      } catch (error) {
        console.error("Error retrieving form data", error);
        // Pass the error to the next middleware
        next(error);
      }
    });

    // get single form by ID
    app.get("/forms/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await formCollection.findOne(query);
        if (!result) {
          return res.status(404).json({ error: "Form not found" });
        }
        res.json(result);
      } catch (error) {
        console.error("Error retrieving form by ID", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Post application
    app.post("/application", async (req, res) => {
      try {
        await client.connect();

        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );
        const formData = req.body;
        // Generate a new ObjectId for applicationCollection
        const applicationId = new ObjectId();
        const applicationData = { _id: applicationId, ...formData };
        const result = await applicationCollection.insertOne(applicationData);
        res.json({
          message: "Form submitted successfully",
          applicationId: result.insertedId,
        });
      } catch (error) {
        console.error("Error submitting form:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection
        // await client.close();
      }
    });

    // get Applications
    app.get("/applications", async (req, res) => {
      try {
        await client.connect();
        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );
        // Fetch all documents from the application collection
        const allApplications = await applicationCollection.find({}).toArray();

        res.json(allApplications);
      } catch (error) {
        console.error("Error retrieving applications:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection
        // await client.close();
      }
    });

    // submit collections
    app.post("/submits", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection"); // Change collection name

        // Extract form data from the request body
        const formData = req.body;

        // Generate a new ObjectId for submitCollection
        const submissionId = new ObjectId();
        const submissionData = { _id: submissionId, ...formData };

        // Insert the form data into the MongoDB collection
        const result = await submitCollection.insertOne(submissionData);

        // Send a response indicating success and the inserted document's ID
        res.json({
          message: "Form submitted successfully",
          submissionId: result.insertedId,
        });
      } catch (error) {
        console.error("Error submitting form:", error);
        // Send a 500 Internal Server Error response if an error occurs
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection (optional)
        // await client.close();
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Form Builder is running");
});

app.listen(port, () => {
  console.log(`Dynamic Form Builder is Running on Port ${port}`);
});
