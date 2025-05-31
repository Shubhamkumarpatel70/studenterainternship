const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require('fs').promises;
const path = require('path');

// Create the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

console.log(path.join(__dirname))

// Serve the generated student ID JSON file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// JSON file paths
const studentsJsonFilePath = 'lundi sutri kuch bhi/generatedstudentidofregisteredstudentatstudenterastudentid.json';
const certificatesJsonFilePath = 'lundi sutri kuch bhi/userrandomstudenteracheckcertificates.json';
const studentStatusJsonFilePath = 'lundi sutri kuch bhi/checkprogressofinternshipofusersinternshipprogress.json';
const studentCertificatesFile = 'lundi sutri kuch bhi/progressreportuserofinternshipscompletedinternship.json';
const studentProjectsJsonFilePath = 'lundi sutri kuch bhi/userselffetchtheirprojectsofapplieddomainuserprojects.json';

// In-memory data store
let certificates = [];

// Utility function to read JSON file
const readJsonFile = async (filePath, defaultValue = []) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`${filePath} not found, initializing empty data.`);
      return defaultValue;
    }
    throw new Error(`Error reading ${filePath}: ${err.message}`);
  }
};

// Utility function to write JSON file
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error(`Error writing to ${filePath}: ${err.message}`);
  }
};

// API to store certificates in memory
app.post("/api/certificates", async (req, res) => {
  try {
    const { certId, userName, issueDate, validity, studentId } = req.body;
    const newCertificate = { certId, userName, issueDate, validity, studentId };
    certificates.push(newCertificate);
    res.status(201).json({ message: "Certificate stored successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ...existing code...

// API to update student status
app.post('/update-student-status', async (req, res) => {
  const { studentId, status } = req.body;

  if (!studentId || !status) {
    return res.status(400).json({ message: "Missing studentId or status" });
  }

  try {
    // Read current progress data
    let progressData = await readJsonFile(studentStatusJsonFilePath, []);
    // Find the student entry
    let student = progressData.find(s => s.studentId === studentId);

    if (student) {
      student.status = status;
    } else {
      // If not found, add new entry
      progressData.push({ studentId, status });
    }

    await writeJsonFile(studentStatusJsonFilePath, progressData);

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});

// ...existing code...

// API to delete a certificate
app.delete('/delete-certificate', async (req, res) => {
  const { studentId, certificateNumber } = req.body;

  if (!studentId || !certificateNumber) {
    return res.status(400).json({ success: false, message: 'Missing studentId or certificateNumber' });
  }

  try {
    const certificates = await readJsonFile(studentCertificatesFile, []);
    const updatedCertificates = certificates.filter(cert => !(cert.studentId === studentId && cert.certificateNumber === certificateNumber));

    if (updatedCertificates.length === certificates.length) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    await writeJsonFile(studentCertificatesFile, updatedCertificates);
    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting certificate' });
  }
});

// API to verify certificates in memory
app.get("/api/certificates/:certId", async (req, res) => {
  try {
    const { certId } = req.params;
    const certificate = certificates.find(cert => cert.certId === certId);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found!" });
    }
    res.status(200).json(certificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to fetch student IDs from students.json
app.get('/generatedstudentidofregisteredstudentatstudenterastudentid', async (req, res) => {
  try {
    const studentsData = await readJsonFile(studentsJsonFilePath, { validStudentIds: [] });
    res.json({ students: studentsData.validStudentIds });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error reading students file." });
  }
});

// API to fetch all student certificates
app.get('/progressreportuserofinternshipscompletedinternship', async (req, res) => {
  try {
    const certificates = await readJsonFile(studentCertificatesFile, []);
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading certificate data' });
  }
});

// API to add student ID
app.post('/add-student', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId || !/^[a-zA-Z0-9]+$/.test(studentId)) {
    return res.status(400).json({ message: "Invalid Student ID. Only alphanumeric IDs allowed." });
  }

  try {
    const studentsData = await readJsonFile(studentsJsonFilePath, { validStudentIds: [] });
    if (!studentsData.validStudentIds.includes(studentId)) {
      studentsData.validStudentIds.push(studentId);
      await writeJsonFile(studentsJsonFilePath, studentsData);
      return res.json({ message: `Student ID ${studentId} added successfully!` });
    }
    res.json({ message: `Student ID ${studentId} already exists.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias for /add-certificate to support legacy/external clients
app.post('/add-certificate', async (req, res) => {
  const { studentId, certificateNumber } = req.body;

  if (!studentId || !certificateNumber) {
    return res.status(400).json({ success: false, message: 'Missing studentId or certificateNumber' });
  }

  try {
    let certificates = await readJsonFile(studentCertificatesFile, []);
    const existingCertificate = certificates.find(cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber);
    if (existingCertificate) {
      return res.status(400).json({ success: false, message: 'Certificate number already exists for this student' });
    }

    certificates.push({ studentId, certificateNumber });
    await writeJsonFile(studentCertificatesFile, certificates);

    res.json({ success: true, message: 'Certificate saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving certificate' });
  }
});


// API to delete student ID
app.delete('/delete-student', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  try {
    let studentsData = await readJsonFile(studentsJsonFilePath, { validStudentIds: [] });

    // Filter out the student ID
    const updatedStudentIds = studentsData.validStudentIds.filter(id => id !== studentId);

    if (updatedStudentIds.length === studentsData.validStudentIds.length) {
      return res.status(404).json({ success: false, message: "Student ID not found" });
    }

    // Write updated list back to the file
    studentsData.validStudentIds = updatedStudentIds;
    await writeJsonFile(studentsJsonFilePath, studentsData);

    res.json({ success: true, message: `Student ID ${studentId} deleted successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting student ID." });
  }
});

// API to save generated certificate numbers
app.post('/save-certificate', async (req, res) => {
  const { studentId, certificateNumber } = req.body;

  if (!studentId || !certificateNumber) {
    return res.status(400).json({ success: false, message: 'Missing studentId or certificateNumber' });
  }

  try {
    let certificates = await readJsonFile(studentCertificatesFile, []);
    
    // Check for existing certificate to prevent duplicates
    const existingCertificate = certificates.find(cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber);
    if (existingCertificate) {
      return res.status(400).json({ success: false, message: 'Certificate number already exists for this student' });
    }

    certificates.push({ studentId, certificateNumber });
    await writeJsonFile(studentCertificatesFile, certificates);

    res.json({ success: true, message: 'Certificate saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving certificate' });
  }
});

// API to fetch all student certificates
app.get('/progressreportuserofinternshipscompletedinternship', async (req, res) => {
  try {
    const certificates = await readJsonFile(studentCertificatesFile, []);
    // Ensure certificates have the required properties like certificateNumber
    res.json(certificates); // Return certificates directly as JSON
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading certificate data' });
  }
});


// Route to handle adding a student ID to a specific internship domain
app.post('/addStudent', async (req, res) => {
  const { studentId, course } = req.body;

  if (!studentId || !course) {
    return res.status(400).json({ success: false, message: 'Error: Missing studentId or course' });
  }

  try {
    let studentProjects = await readJsonFile(studentProjectsJsonFilePath, []);
    const domain = studentProjects.find(item => item.internshipDomain === course);

    if (domain) {
      if (!domain.studentIds.includes(studentId)) {
        domain.studentIds.push(studentId);
        await writeJsonFile(studentProjectsJsonFilePath, studentProjects);
        return res.json({ success: true, message: 'Student ID added successfully' });
      }
      return res.status(400).json({ success: false, message: 'Error: Student ID already exists in this domain' });
    }

    return res.status(400).json({ success: false, message: 'Error: Course not found' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, message: 'Error processing request' });
  }
});

// Error handling for undefined routes (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
