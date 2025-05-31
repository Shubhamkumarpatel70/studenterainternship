# Certificate Server for Student Era

This is a dedicated server for managing certificates and student IDs for the Student Era platform.

## Features

- Certificate management (add, delete, verify)
- Student ID management (add, delete, verify)
- Internship progress tracking
- Secure data storage in JSON files

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:

   ```
   npm install
   ```

2. Start the certificate server:

   ```
   npm run start:cert
   ```

   For development with auto-restart:

   ```
   npm run dev:cert
   ```

3. The server will run on port 5002 by default (http://localhost:5002)

## API Endpoints

### Certificates

- `GET /certificatesdetailsread.json` - Get all certificates
- `POST /add-certificate` - Add a new certificate
- `DELETE /delete-certificate` - Delete a certificate
- `GET /progressreportuserofinternshipscompletedinternship` - Get all completed internships
- `POST /save-certificate` - Save a certificate to completed internships

### Student IDs

- `GET /generatedstudentidofregisteredstudentatstudenterastudentid` - Get all student IDs
- `POST /add-student` - Add a new student ID
- `DELETE /delete-student` - Delete a student ID

### Internship Progress

- `POST /update-student-status` - Update a student's internship status

## Data Structure

The server stores data in JSON files in the `data` directory:

- `certificatesdetailsread.json` - Certificate details
- `students.json` - Student IDs
- `progressreportuserofinternshipscompletedinternship.json` - Completed internships
- `checkprogressofinternshipofusersinternshipprogress.json` - Internship progress

## Integration with Frontend

Update the API_BASE_URL in your frontend code to point to this server:

```javascript
const API_BASE_URL = "http://localhost:5002";
```

## Security

This server includes:

- CORS protection
- Helmet for security headers
- Input validation
- Error handling

## Troubleshooting

If you encounter issues:

1. Check the server logs for error messages
2. Verify that the data directory exists and is writable
3. Ensure the JSON files have the correct structure
4. Check that the frontend is using the correct API endpoints

## License

This project is licensed under the ISC License.
