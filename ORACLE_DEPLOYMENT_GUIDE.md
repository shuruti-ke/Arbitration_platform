# Oracle Cloud Deployment Configuration

## Environment Variables Setup

### Database Environment Variables:
```
ORACLE_CONNECTION_STRING=your_oracle_connection_string
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_SERVICE=your_oracle_service_name
```

### Object Storage Environment Variables:
```
ORACLE_OBJECT_STORAGE_NAMESPACE=your_namespace
ORACLE_OBJECT_STORAGE_BUCKET=arbitration-docs
ORACLE_OBJECT_STORAGE_REGION=us-ashburn-1
```

## Deployment Process

### 1. **Create Oracle Cloud Compartment**
```bash
# Create a compartment for the arbitration platform
oci iam compartment create \
  --compartment-id ocid1.tenancy.oc1..your-tenancy-id \
  --name "arbitration-platform" \
  --description "Arbitration Platform Compartment"
```

### 2. **Set up Oracle Autonomous Database**
```bash
# Create Oracle Autonomous Database
oci db autonomous-database create \
  --compartment-id ocid1.compartment.oc1..your-compartment-id \
  --db-name "arbitration_db" \
  --cpu-core-count 1 \
  --data-storage-size-in-tbs 1 \
  --admin-password "your_admin_password" \
  --workspace-type "TransactionProcessing" \
  --license-model "LICENSE_INCLUDED"
```

### 3. **Deploy Compute Instance**
```bash
# Create compute instance for the backend
oci compute instance launch \
  --availability-domain "AD-1" \
  --compartment-id ocid1.compartment.oc1..your-compartment-id \
  --shape "VM.Standard.E2.1.Micro" \
  --display-name "arbitration-platform-backend" \
  --image-id "ocid1.image.oc1..your-image-id" \
  --subnet-id "ocid1.subnet.oc1..your-subnet-id"
```

### 4. **Configure GitHub Actions**
```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main, development ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Oracle Cloud
      env:
        ORACLE_CONFIG: ${{ secrets.ORACLE_CONFIG }}
      run: |
        echo "Deploying to Oracle Cloud..."
        # Deployment commands here
```

## Oracle Cloud Free Tier Resources

### Always Free Resources:
- **2 Oracle Autonomous Database instances**
- **2 Oracle Linux VM instances (micro)**
- **Load balancer**
- **Object storage**

### Resource Allocation:
1. **Compute Instance**: 1 VM.Standard.E2.1.Micro (1/1000 OCPU, 1 GB RAM)
2. **Autonomous Database**: Always Free Tier (20 concurrent connections, 20 GB storage)
3. **Object Storage**: 10 GB storage (Always Free)

## Deployment Steps

### 1. **Set up Oracle Cloud Account**
1. Go to https://www.oracle.com/cloud/
2. Create Oracle Cloud Free Tier account
3. Get your credentials and tenancy information

### 2. **Configure Oracle Cloud CLI**
```bash
# Install and configure Oracle Cloud CLI
oci setup config
# Enter your credentials when prompted
```

### 3. **Deploy the Platform**
```bash
# Create required resources
oci db autonomous-database create \
  --compartment-id <your-compartment-id> \
  --db-name "arbitration_db" \
  --admin-password "your_password"

# Create compute instance
oci compute instance launch \
  --compartment-id <your-compartment-id> \
  --shape "VM.Standard.E2.1.Micro" \
  --display-name "arbitration-platform"
```

### 4. **Configure GitHub Auto-deployment**
```bash
# Set up GitHub repository secrets
gh secret set ORACLE_CONFIG < oracle-config.json
```

## Oracle Cloud Deployment Summary

Your arbitration platform will be deployed with:
- **Backend API**: Node.js application on Oracle Linux VM
- **Database**: Oracle Autonomous Database (Always Free)
- **Storage**: Oracle Object Storage for documents
- **Frontend**: Static files hosted on Object Storage

The deployment will be fully automated through GitHub Actions, so every push to your main branch will automatically deploy to Oracle Cloud.