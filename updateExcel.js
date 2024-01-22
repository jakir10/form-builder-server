// const { MongoClient } = require("mongodb");
// const ExcelJS = require("exceljs");

// async function updateExcel() {
//   const client = new MongoClient("mongodb://localhost:27017", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   try {
//     await client.connect();

//     const database = client.db("formBuilder");
//     const applicationCollection = database.collection("applicationCollection");

//     // Fetch all documents from the application collection
//     const allApplications = await applicationCollection.find({}).toArray();

//     // Create a new Excel workbook and add a worksheet
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Applications");

//     // Add headers to the worksheet
//     worksheet.addRow(["Insurance Name", "Headings", "Table Data"]);

//     // Add data from the database to the worksheet
//     allApplications.forEach((application) => {
//       const rowData = [
//         application.insuranceName,
//         application.headings.join(", "),
//         JSON.stringify(application.tableData),
//       ];
//       worksheet.addRow(rowData);
//     });

//     // Save the workbook to a file
//     // await workbook.xlsx.writeFile("path/to/your/excel/file.xlsx");
//     await workbook.xlsx.writeFile("C:UsersDELLDesktopRedux\\file.xlsx");

//     console.log("Excel file updated successfully");
//   } catch (error) {
//     console.error("Error updating Excel file:", error);
//   } finally {
//     await client.close();
//   }
// }

// // Run the updateExcel function
// updateExcel();
