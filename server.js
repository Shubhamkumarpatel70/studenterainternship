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
const certificatesJsonFilePath = 'lundi sutri kuch bhi/certificatesdetailsread.json';
const studentStatusJsonFilePath = 'lundi sutri kuch bhi/checkprogressofinternshipofusersinternshipprogress.json';
const studentCertificatesFile = 'lundi sutri kuch bhi/progressreportuserofinternshipscompletedinternship.json';
const studentProjectsJsonFilePath = 'lundi sutri kuch bhi/userselffetchtheirprojectsofapplieddomainuserprojects.json';
const internshipDomainsFilePath = 'lundi sutri kuch bhi/internshipdomains.json';
const certificateDetailsFilePath = 'lundi sutri kuch bhi/certificatesdetailsread.json';

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
    // Ensure the directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true }).catch(() => {});
    
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
    
    // Also remove from certificate details file if it exists there
    try {
      const certificateDetails = await readJsonFile(certificateDetailsFilePath, { certificates: [] });
      const updatedDetails = {
        certificates: certificateDetails.certificates.filter(
          cert => !(cert.studentId === studentId && cert.certificateNumber === certificateNumber)
        )
      };
      await writeJsonFile(certificateDetailsFilePath, updatedDetails);
    } catch (detailsError) {
      console.error('Error updating certificate details file:', detailsError);
    }
    
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

// API to save full certificate details to certificatesdetailsread.json
app.post('/api/save-certificate-details', async (req, res) => {
  const { data, filePath } = req.body;

  if (!data || !filePath) {
    return res.status(400).json({ success: false, message: 'Missing data or filePath' });
  }

  try {
    // Ensure the directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true }).catch(() => {});
    
    // Write the data to the file
    await writeJsonFile(filePath, data);
    
    res.json({ success: true, message: 'Certificate details saved successfully' });
  } catch (error) {
    console.error('Error saving certificate details:', error);
    res.status(500).json({ success: false, message: 'Error saving certificate details' });
  }
});

// API to update the certificates JSON file
app.post('/update-certificates-json', async (req, res) => {
  const { data, filePath } = req.body;

  if (!data || !data.certificates) {
    return res.status(400).json({ success: false, message: 'Missing or invalid data' });
  }

  try {
    // Use the certificateDetailsFilePath from your server configuration
    // or the provided filePath as a fallback
    const targetPath = certificateDetailsFilePath || filePath || 'lundi sutri kuch bhi/certificatesdetailsread.json';
    
    // Ensure the directory exists
    const dirPath = path.dirname(targetPath);
    await fs.mkdir(dirPath, { recursive: true }).catch(() => {});
    
    // Write the data to the file
    await writeJsonFile(targetPath, data);
    
    res.json({ success: true, message: 'Certificate details saved successfully' });
  } catch (error) {
    console.error('Error saving certificate details:', error);
    res.status(500).json({ success: false, message: 'Error saving certificate details' });
  }
});

// NEW ENDPOINT: Primary endpoint for saving certificates
app.post('/save-certificate', async (req, res) => {
  const { studentId, certificateNumber, name, course, duration, college, issuedDate } = req.body;

  if (!studentId || !certificateNumber) {
    return res.status(400).json({ success: false, message: 'Missing studentId or certificateNumber' });
  }

  try {
    console.log('Saving certificate:', { studentId, certificateNumber, name, course, duration, college, issuedDate });
    
    // 1. Save to the basic certificates file
    let certificates = await readJsonFile(studentCertificatesFile, []);
    const existingCertIndex = certificates.findIndex(
      cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber
    );
    
    const certificateEntry = { 
      studentId, 
      certificateNumber,
      timestamp: new Date().toISOString()
    };
    
    if (existingCertIndex >= 0) {
      certificates[existingCertIndex] = certificateEntry;
    } else {
      certificates.push(certificateEntry);
    }
    
    await writeJsonFile(studentCertificatesFile, certificates);
    
    // 2. If additional details are provided, also save to the detailed certificate file
    if (name || course || duration || college || issuedDate) {
      try {
        const certificateDetails = await readJsonFile(certificateDetailsFilePath, { certificates: [] });
        
        const detailedCertificate = {
          studentId,
          certificateNumber,
          name: name || '',
          course: course || '',
          duration: duration || '',
          college: college || '',
          issuedDate: issuedDate || '',
          timestamp: new Date().toISOString()
        };
        
        const existingDetailIndex = certificateDetails.certificates.findIndex(
          cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber
        );
        
        if (existingDetailIndex >= 0) {
          certificateDetails.certificates[existingDetailIndex] = detailedCertificate;
        } else {
          certificateDetails.certificates.push(detailedCertificate);
        }
        
        await writeJsonFile(certificateDetailsFilePath, certificateDetails);
      } catch (detailsError) {
        console.error('Error saving detailed certificate:', detailsError);
        // Continue even if detailed save fails
      }
    }

    res.json({ success: true, message: 'Certificate saved successfully' });
  } catch (error) {
    console.error('Error saving certificate:', error);
    res.status(500).json({ success: false, message: 'Error saving certificate' });
  }
});

// UPDATED: Alias for /save-certificate to support legacy/external clients
app.post('/add-certificate', async (req, res) => {
  const { studentId, certificateNumber, name, course, duration, college, issuedDate } = req.body;

  if (!studentId || !certificateNumber) {
    return res.status(400).json({ success: false, message: 'Missing studentId or certificateNumber' });
  }

  try {
    console.log('Adding certificate:', { studentId, certificateNumber, name, course, duration, college, issuedDate });
    
    // 1. Save to the basic certificates file
    let certificates = await readJsonFile(studentCertificatesFile, []);
    const existingCertIndex = certificates.findIndex(
      cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber
    );
    
    // If certificate already exists, return success instead of error
    // This makes the endpoint more forgiving for retries
    if (existingCertIndex >= 0) {
      console.log('Certificate already exists, updating');
    }
    
    const certificateEntry = { 
      studentId, 
      certificateNumber,
      timestamp: new Date().toISOString()
    };
    
    if (existingCertIndex >= 0) {
      certificates[existingCertIndex] = certificateEntry;
    } else {
      certificates.push(certificateEntry);
    }
    
    await writeJsonFile(studentCertificatesFile, certificates);
    
    // 2. If additional details are provided, also save to the detailed certificate file
    if (name || course || duration || college || issuedDate) {
      try {
        const certificateDetails = await readJsonFile(certificateDetailsFilePath, { certificates: [] });
        
        const detailedCertificate = {
          studentId,
          certificateNumber,
          name: name || '',
          course: course || '',
          duration: duration || '',
          college: college || '',
          issuedDate: issuedDate || '',
          timestamp: new Date().toISOString()
        };
        
        const existingDetailIndex = certificateDetails.certificates.findIndex(
          cert => cert.studentId === studentId && cert.certificateNumber === certificateNumber
        );
        
        if (existingDetailIndex >= 0) {
          certificateDetails.certificates[existingDetailIndex] = detailedCertificate;
        } else {
          certificateDetails.certificates.push(detailedCertificate);
        }
        
        await writeJsonFile(certificateDetailsFilePath, certificateDetails);
      } catch (detailsError) {
        console.error('Error saving detailed certificate:', detailsError);
        // Continue even if detailed save fails
      }
    }

    res.json({ success: true, message: 'Certificate saved successfully' });
  } catch (error) {
    console.error('Error saving certificate:', error);
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

    res.json({ success: true, message: "Student ID deleted successfully" });
  } catch (error) {
    console.error('Error deleting student ID:', error);
    res.status(500).json({ success: false, message: "Error deleting student ID" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});