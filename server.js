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

console.log(path.join(__dirname));

// File paths
const studentsJsonFilePath = 'lundi sutri kuch bhi/generatedstudentidofregisteredstudentatstudenterastudentid.json';
const certificatesJsonFilePath = 'lundi sutri kuch bhi/certificatesdetailsread.json';
const studentStatusJsonFilePath = 'lundi sutri kuch bhi/checkprogressofinternshipofusersinternshipprogress.json';
const studentCertificatesFile = 'lundi sutri kuch bhi/progressreportuserofinternshipscompletedinternship.json';
const studentProjectsJsonFilePath = 'lundi sutri kuch bhi/userselffetchtheirprojectsofapplieddomainuserprojects.json';
const internshipDomainsFilePath = 'lundi sutri kuch bhi/internshipdomains.json';
const certificateDetailsFilePath = 'lundi sutri kuch bhi/certificatesdetailsread.json';

// Utility functions
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

const writeJsonFile = async (filePath, data) => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error(`Error writing to ${filePath}: ${err.message}`);
  }
};

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ------------------- Student ID APIs -------------------

// Get all student IDs
app.get('/generatedstudentidofregisteredstudentatstudenterastudentid', async (req, res) => {
  try {
    const studentsData = await readJsonFile(studentsJsonFilePath, { validStudentIds: [] });
    res.json({ students: studentsData.validStudentIds });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error reading students file." });
  }
});

// Add a student ID
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

// Delete a student ID
app.delete('/delete-student', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  try {
    let studentsData = await readJsonFile(studentsJsonFilePath, { validStudentIds: [] });
    const updatedStudentIds = studentsData.validStudentIds.filter(id => id !== studentId);

    if (updatedStudentIds.length === studentsData.validStudentIds.length) {
      return res.status(404).json({ success: false, message: "Student ID not found" });
    }

    studentsData.validStudentIds = updatedStudentIds;
    await writeJsonFile(studentsJsonFilePath, studentsData);

    res.json({ success: true, message: `Student ID ${studentId} deleted successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting student ID." });
  }
});

// ------------------- Certificate APIs -------------------

// Add a certificate (studentId + certificateNumber)
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

// Delete a certificate (studentId + certificateNumber)
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

// Get all student certificates
app.get('/progressreportuserofinternshipscompletedinternship', async (req, res) => {
  try {
    const certificates = await readJsonFile(studentCertificatesFile, []);
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading certificate data' });
  }
});

// ------------------- Certificate Details APIs -------------------

// Add certificate details
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
    
    if (!studentId || !certificateNumber || !name || !course || !duration || !college || !issuedDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: studentId, certificateNumber, name, course, duration, college, issuedDate' 
      });
    }
    
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    const existingCertificate = certificateDetails.find(cert => cert.certificateNumber === certificateNumber);
    if (existingCertificate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate with this number already exists' 
      });
    }
    
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
    
    certificateDetails.push(newCertificateDetail);
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

// Get all certificate details
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

// Get certificate details by certificate number
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

// Get certificate details by student ID
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

// Update certificate details
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
    
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    const certificateIndex = certificateDetails.findIndex(cert => cert.certificateNumber === certificateNumber);
    if (certificateIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }
    if (studentId) certificateDetails[certificateIndex].studentId = studentId;
    if (name) certificateDetails[certificateIndex].name = name;
    if (course) certificateDetails[certificateIndex].course = course;
    if (duration) certificateDetails[certificateIndex].duration = duration;
    if (college) certificateDetails[certificateIndex].college = college;
    if (issuedDate) certificateDetails[certificateIndex].issuedDate = issuedDate;
    certificateDetails[certificateIndex].updatedAt = new Date().toISOString();
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

// Delete certificate details
app.delete('/api/certificate-details/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const certificateDetails = await readJsonFile(certificateDetailsFilePath, []);
    const updatedCertificateDetails = certificateDetails.filter(cert => cert.certificateNumber !== certificateNumber);
    if (updatedCertificateDetails.length === certificateDetails.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }
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

// ------------------- Internship Domain APIs (unchanged) -------------------

// ...existing internship domain endpoints remain here...

app.get('/api/internship-domains', async (req, res) => {
  try {
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    res.json(domains);
  } catch (error) {
    console.error('Error fetching internship domains:', error);
    res.status(500).json({ success: false, message: 'Error fetching internship domains' });
  }
});

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

app.post('/api/internship-domains', async (req, res) => {
  try {
    const { internshipDomain, pdfFile } = req.body;
    if (!internshipDomain) {
      return res.status(400).json({ success: false, message: 'Internship domain name is required' });
    }
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    if (domains.some(d => d.internshipDomain === internshipDomain)) {
      return res.status(400).json({ success: false, message: 'Internship domain already exists' });
    }
    const newDomain = {
      internshipDomain,
      studentIds: [],
      pdfFile: pdfFile || `tasks/projects/${internshipDomain}.pdf`
    };
    domains.push(newDomain);
    await writeJsonFile(internshipDomainsFilePath, domains);
    res.status(201).json({ success: true, message: 'Internship domain added successfully', domain: newDomain });
  } catch (error) {
    console.error('Error adding internship domain:', error);
    res.status(500).json({ success: false, message: 'Error adding internship domain' });
  }
});

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
    if (newDomainName && newDomainName !== domainName) {
      if (domains.some(d => d.internshipDomain === newDomainName)) {
        return res.status(400).json({ success: false, message: 'New domain name already exists' });
      }
      domains[domainIndex].internshipDomain = newDomainName;
    }
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
    if (domain.studentIds.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already enrolled in this domain' });
    }
    domain.studentIds.push(studentId);
    await writeJsonFile(internshipDomainsFilePath, domains);
    res.json({ success: true, message: 'Student added to internship domain successfully' });
  } catch (error) {
    console.error('Error adding student to internship domain:', error);
    res.status(500).json({ success: false, message: 'Error adding student to internship domain' });
  }
});

app.delete('/api/internship-domains/:domainName/students/:studentId', async (req, res) => {
  try {
    const { domainName, studentId } = req.params;
    const domains = await readJsonFile(internshipDomainsFilePath, []);
    const domain = domains.find(d => d.internshipDomain === domainName);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Internship domain not found' });
    }
    if (!domain.studentIds.includes(studentId)) {
      return res.status(404).json({ success: false, message: 'Student not found in this domain' });
    }
    domain.studentIds = domain.studentIds.filter(id => id !== studentId);
    await writeJsonFile(internshipDomainsFilePath, domains);
    res.json({ success: true, message: 'Student removed from internship domain successfully' });
  } catch (error) {
    console.error('Error removing student from internship domain:', error);
    res.status(500).json({ success: false, message: 'Error removing student from internship domain' });
  }
});

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

// ------------------- Student Status API -------------------

app.post('/update-student-status', async (req, res) => {
  const { studentId, status } = req.body;
  if (!studentId || !status) {
    return res.status(400).json({ message: "Missing studentId or status" });
  }
  try {
    let progressData = await readJsonFile(studentStatusJsonFilePath, []);
    let student = progressData.find(s => s.studentId === studentId);
    if (student) {
      student.status = status;
    } else {
      progressData.push({ studentId, status });
    }
    await writeJsonFile(studentStatusJsonFilePath, progressData);
    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});

// ------------------- 404 Handler -------------------

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ------------------- Start Server -------------------

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});