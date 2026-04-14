# Arbitration Platform

A comprehensive digital platform for managing arbitration cases with full compliance features.

## Features

### Core Functionality
- **Case Management**: Create, track, and manage arbitration cases
- **Document Management**: Upload, store, and manage case documents
- **E-Signature Integration**: Full Qualified Electronic Signature (QES) support
- **Compliance Monitoring**: Automated conflict of interest detection
- **Audit Trail**: Complete logging and tracking of all activities
- **Video Conferencing**: Jitsi integration for virtual hearings

### Technical Features
- **AI-Powered Conflict Detection**: NLP-based conflict of interest scanning
- **WORM Storage**: Write-Once-Read-Many document storage for compliance
- **Multi-Jurisdiction Support**: LCIA, SIAC, UNCITRAL, Kenya Arbitration Act compliance
- **International Standards**: NY Convention compliance
- **Data Protection**: Full encryption and PII compliance

## Architecture

### Backend (Node.js)
- REST API with comprehensive endpoints
- PostgreSQL database integration
- Cloudflare R2 object storage
- Real-time conflict detection
- Automated compliance reporting

### Frontend (React.js)
- Material-UI based responsive interface
- Real-time dashboard and analytics
- Case and document management
- Settings and user management

## Deployment

### Prerequisites
- Node.js 14+
- PostgreSQL database
- Cloudflare R2 account
- Jitsi server access

### Environment Variables
```bash
# Database Configuration
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=arbitration_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_R2_BUCKET=arbitration-docs

# API Configuration
REACT_APP_API_URL=https://your-api-url.com
```

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/arbitration-platform.git
cd arbitration-platform
```

2. **Install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

3. **Configure environment variables**

4. **Start the application:**
```bash
# Start backend
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm start
```

## Compliance Features

### International Standards
- ✅ NY Convention Article IV compliance
- ✅ Electronic signature standards (eIDAS 2.0, Kenya ICT Act)
- ✅ Data protection compliance (Kenya DPA 2019)
- ✅ Institutional rule compliance (LCIA, SIAC, UNCITRAL)

### Security Features
- ✅ Qualified Electronic Signatures (QES)
- ✅ Certificate Authority integration (eIDAS, ICS Limited, eSign Africa)
- ✅ End-to-end encryption
- ✅ Audit trail and WORM storage
- ✅ PII protection and data minimization

## API Endpoints

### Cases
- `GET /api/cases` - List all cases
- `POST /api/cases` - Create new case
- `GET /api/cases/{id}` - Get specific case
- `PUT /api/cases/{id}` - Update case
- `DELETE /api/cases/{id}` - Delete case

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/{id}` - Get document
- `DELETE /api/documents/{id}` - Delete document

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/cases` - Case analytics
- `GET /api/analytics/compliance` - Compliance reports

## Deployment Options

### Render Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy automatically on push to main branch

### Vercel Deployment
1. Connect Vercel to your GitHub repository
2. Import project in Vercel dashboard
3. Set environment variables
4. Vercel will automatically deploy on push

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details