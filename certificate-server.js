const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5002;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Path to the JSON files
const DATA_DIR = path.join(__dirname, 'data');
const CERTIFICATES_FILE = path.join(DATA_DIR, 'certificatesdetailsread.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
}

// Helper function to ensure a JSON file exists with initial structure
function ensureJsonFileExists(filePath, initialData) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
        console.log(`Created JSON file: ${filePath}`);
    }
}

// Ensure certificate and student files exist
ensureJsonFileExists(CERTIFICATES_FILE, { certificates: [] });
ensureJsonFileExists(STUDENTS_FILE, { students: [] });

// Helper function to read a JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

// Helper function to write to a JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        return false;
    }
}

// Routes

// Get all certificates
app.get('/certificatesdetailsread.json', (req, res) => {
    const data = readJsonFile(CERTIFICATES_FILE);
    if (data) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ error: "Failed to read certificates data" });
    }
});

// Add a certificate
app.post('/add-certificate', (req, res) => {
    const { certificates, saveToPath } = req.body;
    
    if (!certificates || !Array.isArray(certificates)) {
        return res.status(400).json({ success: false, message: "Invalid certificate data format" });
    }
    
    // Determine the file path based on the saveToPath parameter
    const filePath = saveToPath ? path.join(DATA_DIR, saveToPath) : CERTIFICATES_FILE;
    
    // Write the updated certificates array to the file
    const success = writeJsonFile(filePath, { certificates });
    
    if (success) {
        res.status(201).json({ success: true, message: "Certificate added successfully!" });
    } else {
        res.status(500).json({ success: false, message: "Failed to save certificate data" });
    }
});

// Delete a certificate
app.delete('/delete-certificate', (req, res) => {
    const { certificates, saveToPath, certificateNumber } = req.body;
    
    if (!certificates || !Array.isArray(certificates)) {
        return res.status(400).json({ success: false, message: "Invalid certificate data format" });
    }
    
    // Determine the file path based on the saveToPath parameter
    const filePath = saveToPath ? path.join(DATA_DIR, saveToPath) : CERTIFICATES_FILE;
    
    // Write the updated certificates array to the file
    const success = writeJsonFile(filePath, { certificates });
    
    if (success) {
        console.log(`Certificate ${certificateNumber} deleted successfully`);
        res.status(200).json({ success: true, message: "Certificate deleted successfully!" });
    } else {
        res.status(500).json({ success: false, message: "Failed to update certificate data" });
    }
});

// Get all student IDs
app.get('/generatedstudentidofregisteredstudentatstudenterastudentid', (req, res) => {
    const data = readJsonFile(STUDENTS_FILE);
    if (data) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ error: "Failed to read student data" });
    }
});

// Add a student ID
app.post('/add-student', (req, res) => {
    const { studentId } = req.body;
    
    if (!studentId) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }
    
    // Read existing student IDs
    const data = readJsonFile(STUDENTS_FILE) || { students: [] };
    
    // Check if the student ID already exists
    if (data.students.includes(studentId)) {
        return res.status(409).json({ success: false, message: "Student ID already exists" });
    }
    
    // Add the new student ID
    data.students.push(studentId);
    
    // Write the updated data back to the file
    const success = writeJsonFile(STUDENTS_FILE, data);
    
    if (success) {
        res.status(201).json({ success: true, message: "Student ID added successfully!" });
    } else {
        res.status(500).json({ success: false, message: "Failed to save student data" });
    }
});

// Delete a student ID
app.delete('/delete-student', (req, res) => {
    const { studentId } = req.body;
    
    if (!studentId) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }
    
    // Read existing student IDs
    const data = readJsonFile(STUDENTS_FILE);
    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to read student data" });
    }
    
    // Filter out the student ID to delete
    const updatedStudents = data.students.filter(id => id !== studentId);
    
    // If no student was removed, it wasn't found
    if (updatedStudents.length === data.students.length) {
        return res.status(404).json({ success: false, message: "Student ID not found" });
    }
    
    // Write the updated data back to the file
    data.students = updatedStudents;
    const success = writeJsonFile(STUDENTS_FILE, data);
    
    if (success) {
        res.status(200).json({ success: true, message: "Student ID deleted successfully!" });
    } else {
        res.status(500).json({ success: false, message: "Failed to update student data" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Certificate server is running on port ${PORT}`);
});