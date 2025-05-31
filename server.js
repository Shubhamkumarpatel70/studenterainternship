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

// ============= INTERNSHIP DOMAINS ENDPOINTS =============

// API to get all internship domains
app.get('/api/internship-domains', async (req, res) => {
  try {
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    res.json(domains);
  } catch (error) {
    console.error('Error fetching internship domains:', error);
    res.status(500).json({ success: false, message: 'Error fetching internship domains' });
  }
});

// API to get a specific internship domain by name
app.get('/api/internship-domains/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domain = domains.find(d => d.internshipDomain === domainName);
    
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    res.json(domain);
  } catch (error) {
    console.error('Error fetching internship domain:', error);
    res.status(500).json({ success: false, message: 'Error fetching internship domain' });
  }
});

// API to add a new internship domain
app.post('/api/internship-domains', async (req, res) => {
  try {
    const { internshipDomain, pdfFile } = req.body;
    
    if (!internshipDomain) {
      return res.status(400).json({ success: false, message: 'Internship domain name is required' });
    }
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    
    // Check if domain already exists
    if (domains.some(d => d.internshipDomain === internshipDomain)) {
      return res.status(400).json({ success: false, message: 'Internship domain already exists' });
    }
    
    // Create new domain with empty studentIds array
    const newDomain = {
      internshipDomain,
      studentIds: [],
      pdfFile: pdfFile || `tasks/projects/${internshipDomain}.pdf` // Default PDF path if not provided
    };
    
    domains.push(newDomain);
    await writeJsonFile(internshipDomainsFilePath, domains);
    
    res.status(201).json({ success: true, message: 'Internship domain added successfully', domain: newDomain });
  } catch (error) {
    console.error('Error adding internship domain:', error);
    res.status(500).json({ success: false, message: 'Error adding internship domain' });
  }
});

// API to update an existing internship domain
app.put('/api/internship-domains/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    const { newDomainName, pdfFile } = req.body;
    
    if (!newDomainName && !pdfFile) {
      return res.status(400).json({ success: false, message: 'At least one field to update is required' });
    }
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domainIndex = domains.findIndex(d => d.internshipDomain === domainName);
    
    if (domainIndex === -1) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    // If new domain name is provided and it's different from the current one
    if (newDomainName && newDomainName !== domainName) {
      // Check if the new name already exists
      if (domains.some(d => d.internshipDomain === newDomainName)) {
        return res.status(400).json({ success: false, message: 'New domain name already exists' });
      }
      domains[domainIndex].internshipDomain = newDomainName;
    }
    
    // Update PDF file if provided
    if (pdfFile) {
      domains[domainIndex].pdfFile = pdfFile;
    }
    
    await writeJsonFile(internshipDomainsFilePath, domains);
    
    res.json({ success: true, message: 'Internship domain updated successfully', domain: domains[domainIndex] });
  } catch (error) {
    console.error('Error updating internship domain:', error);
    res.status(500).json({ success: false, message: 'Error updating internship domain' });
  }
});

// API to delete an internship domain
app.delete('/api/internship-domains/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const initialLength = domains.length;
    
    const updatedDomains = domains.filter(d => d.internshipDomain !== domainName);
    
    if (updatedDomains.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    await writeJsonFile(internshipDomainsFilePath, updatedDomains);
    
    res.json({ success: true, message: 'Internship domain deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship domain:', error);
    res.status(500).json({ success: false, message: 'Error deleting internship domain' });
  }
});

// API to add a student to an internship domain
app.post('/api/internship-domains/:domainName/students', async (req, res) => {
  try {
    const { domainName } = req.params;
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domain = domains.find(d => d.internshipDomain === domainName);
    
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    // Check if student is already in the domain
    if (domain.studentIds.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already enrolled in this domain' });
    }
    
    // Add student to the domain
    domain.studentIds.push(studentId);
    await writeJsonFile(internshipDomainsFilePath, domains);
    
    res.json({ success: true, message: 'Student added to internship domain successfully' });
  } catch (error) {
    console.error('Error adding student to internship domain:', error);
    res.status(500).json({ success: false, message: 'Error adding student to internship domain' });
  }
});

// API to remove a student from an internship domain
app.delete('/api/internship-domains/:domainName/students/:studentId', async (req, res) => {
  try {
    const { domainName, studentId } = req.params;
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domain = domains.find(d => d.internshipDomain === domainName);
    
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    // Check if student is in the domain
    if (!domain.studentIds.includes(studentId)) {
      return res.status(404).json({ success: false, message: 'Student not found in this domain' });
    }
    
    // Remove student from the domain
    domain.studentIds = domain.studentIds.filter(id => id !== studentId);
    await writeJsonFile(internshipDomainsFilePath, domains);
    
    res.json({ success: true, message: 'Student removed from internship domain successfully' });
  } catch (error) {
    console.error('Error removing student from internship domain:', error);
    res.status(500).json({ success: false, message: 'Error removing student from internship domain' });
  }
});

// API to get all students in an internship domain
app.get('/api/internship-domains/:domainName/students', async (req, res) => {
  try {
    const { domainName } = req.params;
    
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domain = domains.find(d => d.internshipDomain === domainName);
    
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    
    res.json({ success: true, domainName, students: domain.studentIds });
  } catch (error) {
    console.error('Error fetching students in internship domain:', error);
    res.status(500).json({ success: false, message: 'Error fetching students in internship domain' });
  }
});

// ============= CERTIFICATE DETAILS ENDPOINTS =============

// API to save certificate details
app.post('/api/certificate-details', async (req, res) => {
  try {
    const { 
      studentId, 
      certificateNumber, 
      name, 
      course, 
      duration, 
      college, 
      issuedDate 
    } = req.body;
    
    // Validate required fields
    if (!studentId || !certificateNumber || !name || !course || !duration || !college || !issuedDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: studentId, certificateNumber, name, course, duration, college, issuedDate' 
      });
    }
    
    // Read existing certificate details
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    
    // Check if certificate with this number already exists
    const existingCertificate = certificateDetails.find(cert => cert.certificateNumber === certificateNumber);
    if (existingCertificate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate with this number already exists' 
      });
    }
    
    // Create new certificate detail object
    const newCertificateDetail = {
      studentId,
      certificateNumber,
      name,
      course,
      duration,
      college,
      issuedDate,
      createdAt: new Date().toISOString()
    };
    
    // Add to the array
    certificateDetails.push(newCertificateDetail);
    
    // Save back to file
    await writeJsonFile(certificateDetailsFilePath, certificateDetails);
    
    res.status(201).json({ 
      success: true, 
      message: 'Certificate details saved successfully', 
      certificate: newCertificateDetail 
    });
  } catch (error) {
    console.error('Error saving certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving certificate details' 
    });
  }
});

// API to get all certificate details
app.get('/api/certificate-details', async (req, res) => {
  try {
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    res.json(certificateDetails);
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching certificate details' 
    });
  }
});

// API to get certificate details by certificate number
app.get('/api/certificate-details/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    
    const certificate = certificateDetails.find(cert => cert.certificateNumber === certificateNumber);
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching certificate details' 
    });
  }
});

// API to get certificate details by student ID
app.get('/api/certificate-details/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    
    const certificates = certificateDetails.filter(cert => cert.studentId === studentId);
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching certificate details' 
    });
  }
});

// API to update certificate details
app.put('/api/certificate-details/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const { 
      studentId, 
      name, 
      course, 
      duration, 
      college, 
      issuedDate 
    } = req.body;
    
    // Read existing certificate details
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    
    // Find the certificate to update
    const certificateIndex = certificateDetails.findIndex(cert => cert.certificateNumber === certificateNumber);
    
    if (certificateIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }
    
    // Update the certificate fields if provided
    if (studentId) certificateDetails[certificateIndex].studentId = studentId;
    if (name) certificateDetails[certificateIndex].name = name;
    if (course) certificateDetails[certificateIndex].course = course;
    if (duration) certificateDetails[certificateIndex].duration = duration;
    if (college) certificateDetails[certificateIndex].college = college;
    if (issuedDate) certificateDetails[certificateIndex].issuedDate = issuedDate;
    
    // Add updated timestamp
    certificateDetails[certificateIndex].updatedAt = new Date().toISOString();
    
    // Save back to file
    await writeJsonFile(certificateDetailsFilePath, certificateDetails);
    
    res.json({ 
      success: true, 
      message: 'Certificate details updated successfully', 
      certificate: certificateDetails[certificateIndex] 
    });
  } catch (error) {
    console.error('Error updating certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating certificate details' 
    });
  }
});

// API to delete certificate details
app.delete('/api/certificate-details/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    
    // Read existing certificate details
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    
    // Filter out the certificate to delete
    const updatedCertificateDetails = certificateDetails.filter(cert => cert.certificateNumber !== certificateNumber);
    
    if (updatedCertificateDetails.length === certificateDetails.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }
    
    // Save back to file
    await writeJsonFile(certificateDetailsFilePath, updatedCertificateDetails);
    
    res.json({ 
      success: true, 
      message: 'Certificate details deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting certificate details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting certificate details' 
    });
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
