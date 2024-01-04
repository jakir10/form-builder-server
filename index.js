const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { writeFileSync } = require("fs");
const ExcelJS = require("exceljs");
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

    // export database data to excel file
    const ExcelJS = require("exceljs");
    const { writeFileSync } = require("fs");

    app.get("/export-applications-excel", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );

        // Retrieve all fields without projection
        const allApplications = await applicationCollection.find({}).toArray();

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Applications");

        // Define the columns including formData fields
        const columns = [
          "_id",
          "insuranceName",
          "headings",
          "tableData",
          "slNo", // Add slNo
          "elements",
          "unauditedColumns",
          // Add other fields as needed
          // ... (formData fields will be added dynamically)
        ];

        // Add headers to worksheet
        worksheet.addRow(columns);

        // Add data rows
        allApplications.forEach((applicationData) => {
          // Exclude certain fields (input fields, placeholders, etc.) from the formData
          const modifiedFormData = filterFormData(applicationData.formData);

          // Create an object with all fields, including formData fields
          const rowObject = {
            _id: applicationData._id,
            insuranceName: applicationData.insuranceName,
            headings: applicationData.headings,
            tableData: applicationData.tableData,
            slNo: applicationData.slNo,
            elements: applicationData.elements,
            unauditedColumns: applicationData.unauditedColumns,
            // Add other fields as needed
            ...modifiedFormData,
          };

          // Extract values based on column order
          const values = columns.map((column) => rowObject[column]);

          // Add the values to the worksheet
          worksheet.addRow(values);
        });

        // Save Excel file
        const excelFilePath =
          "C:\\Users\\DELL\\Desktop\\Redux\\job-intern-projeacts\\sadek vai project\\form-builder-server\\excel_file\\applications_data_exceljs_all_fields.xlsx";
        await workbook.xlsx.writeFile(excelFilePath);

        // Send the Excel file as a response
        res.download(
          excelFilePath,
          "applications_data_exceljs_all_fields.xlsx",
          () => {
            // After sending the file, delete it from the server
            writeFileSync(excelFilePath, "");
          }
        );
      } catch (error) {
        console.error("Error exporting applications data to Excel:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection (optional)
        // await client.close();
      }
    });

    // Function to filter unwanted fields from formData
    function filterFormData(formData) {
      // Modify this function based on your specific criteria
      // For example, you can exclude fields with specific keys, like "input", "placeholder", etc.
      const filteredFormData = Object.keys(formData).reduce((acc, key) => {
        if (!key.includes("input") && !key.includes("placeholder")) {
          acc[key] = formData[key];
        }
        return acc;
      }, {});

      return filteredFormData;
    }

    // Post form
    app.post("/forms", async (req, res) => {
      const formData = req.body;
      console.log("Received form data:", formData);
      const result = await formCollection.insertOne(formData);
      res.json({ message: "Form submitted successfully" });
    });

    // get all forms
    // app.get("/forms", async (req, res, next) => {
    //   try {
    //     // Retrieve all documents from the formCollection
    //     const allForms = await formCollection.find().toArray();

    //     // Respond with the array of form documents
    //     res.json(allForms);
    //   } catch (error) {
    //     console.error("Error retrieving form data", error);
    //     // Pass the error to the next middleware
    //     next(error);
    //   }
    // });

    // submit form get
    app.get("/submits", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection");

        // Retrieve all documents from the submitCollection
        const allSubmits = await submitCollection.find().toArray();

        // Send a response with the array of submission documents
        res.json(allSubmits);
      } catch (error) {
        console.error("Error retrieving submit data:", error);
        // Send a 500 Internal Server Error response if an error occurs
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection (optional)
        // await client.close();
      }
    });

    // get single submits form by id
    app.get("/submits/:id", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection");

        // Extract the submission ID from the request parameters
        const submissionId = req.params.id;

        // Check if the submissionId is a valid ObjectId
        if (!ObjectId.isValid(submissionId)) {
          return res.status(400).json({ error: "Invalid submission ID" });
        }

        // Query the submitCollection for the submission with the specified ID
        const submission = await submitCollection.findOne({
          _id: new ObjectId(submissionId),
        });

        // Check if the submission exists
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Send a response with the submission document
        res.json(submission);
      } catch (error) {
        console.error("Error retrieving submit data:", error);
        // Send a 500 Internal Server Error response if an error occurs
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection (optional)
        // await client.close();
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

    // get single application
    app.get("/applications/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid application ID" });
        }

        await client.connect();
        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );

        // Find the application by ID
        const application = await applicationCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        res.json(application);
      } catch (error) {
        console.error("Error retrieving application:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection
        // await client.close();
      }
    });

    // Delete a specific application by ID
    app.delete("/applications/:applicationId", async (req, res) => {
      try {
        const { applicationId } = req.params; // Corrected parameter name
        if (!ObjectId.isValid(applicationId)) {
          return res.status(400).json({ error: "Invalid application ID" });
        }

        await client.connect();
        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );

        // Delete the document based on the provided ID
        const result = await applicationCollection.deleteOne({
          _id: new ObjectId(applicationId),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Application not found" });
        }

        res.json({ message: "Application deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Ensure to close the connection
        // await client.close();
      }
    });

    // app.put("/applications/applicationId", async (req, res) => {
    //   const id = req.params.id;
    //   const updateFormData = req.body;
    //   console.log(updateFormData);
    // });
    app.put("/application/:applicationId", async (req, res) => {
      try {
        await client.connect();

        const database = client.db("formBuilder");
        const applicationCollection = database.collection(
          "applicationCollection"
        );

        const applicationId = new ObjectId(req.params.applicationId);
        const formData = req.body;

        console.log("Updating form data for applicationId:", applicationId);
        console.log("New form data:", formData);

        const result = await applicationCollection.findOneAndUpdate(
          { _id: applicationId },
          { $set: formData },
          { returnDocument: "after" }
        );

        console.log("Form updated successfully");
        // console.log("Updated data:", result.value);

        res.json({
          message: "Form updated successfully",
          updatedData: result.value,
        });
      } catch (error) {
        console.error("Error updating form:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Close the MongoDB connection
        // await client.close();
      }
    });

    // delete a form
    app.delete("/submits/:id", async (req, res) => {
      try {
        const { id } = req.params; // Corrected parameter name
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid submission ID" });
        }

        await client.connect();
        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection");

        // Delete the document based on the provided ID
        const result = await submitCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Submission not found" });
        }

        res.json({ message: "Submission deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        // Ensure to close the connection
        // await client.close();
      }
    });

    // update a application
    // app.put("/applications/:applicationId", async (req, res) => {
    //   try {
    //     const { applicationId } = req.params;

    //     if (!ObjectId.isValid(applicationId)) {
    //       return res.status(400).json({ error: "Invalid application ID" });
    //     }

    //     const updatedData = req.body.formData; // Assuming your frontend sends formData

    //     await client.connect();
    //     const database = client.db("formBuilder");
    //     const applicationCollection = database.collection(
    //       "applicationCollection"
    //     );

    //     // Update the document based on the provided ID
    //     const result = await applicationCollection.updateOne(
    //       { _id: new ObjectId(applicationId) },
    //       { $set: { formData: updatedData } }
    //     );

    //     if (result.matchedCount === 0) {
    //       return res.status(404).json({ error: "Application not found" });
    //     }

    //     res.json({ message: "Application updated successfully" });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: "Internal Server Error" });
    //   } finally {
    //     // Close the connection after updating
    //     // await client.close();
    //   }
    // });

    // submit collections
    // app.post("/submits", async (req, res) => {
    //   try {
    //     // Connect to MongoDB
    //     await client.connect();

    //     const database = client.db("formBuilder");
    //     const submitCollection = database.collection("submitCollection");

    //     // Extract form data from the request body
    //     const formData = req.body;

    //     // Generate a new ObjectId for submitCollection
    //     const submissionId = new ObjectId();
    //     const submissionData = { _id: submissionId, ...formData };

    //     // Insert the form data into the MongoDB collection
    //     const result = await submitCollection.insertOne(submissionData);

    //     // Send a response indicating success and the inserted document's ID
    //     res.json({
    //       message: "Form submitted successfully",
    //       submissionId: result.insertedId,
    //     });
    //   } catch (error) {
    //     console.error("Error submitting form:", error);
    //     // Send a 500 Internal Server Error response if an error occurs
    //     res.status(500).json({ error: "Internal Server Error" });
    //   } finally {
    //     // Close the MongoDB connection (optional)
    //     // await client.close();
    //   }
    // });

    // create tamplate submit
    app.post("/submits", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection");

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

    // update submit id (template)
    app.patch("/submits/:id", async (req, res) => {
      try {
        // Connect to MongoDB
        await client.connect();

        const database = client.db("formBuilder");
        const submitCollection = database.collection("submitCollection");

        // Extract form data from the request body
        const formData = req.body;

        // Extract the form ID from the URL parameters
        const formId = req.params.id;

        // Update the form data in the MongoDB collection based on the form ID
        const result = await submitCollection.updateOne(
          { _id: new ObjectId(formId) },
          { $set: formData }
        );

        // Check if the update was successful
        if (result.matchedCount > 0) {
          res.json({
            message: "Form updated successfully",
            formId: formId,
          });
        } else {
          res.status(404).json({ error: "Form not found" });
        }
      } catch (error) {
        console.error("Error updating form:", error);
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
