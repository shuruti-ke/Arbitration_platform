# Oracle Cloud Deployment Guide

## Oracle Cloud Free Tier Resources

### Always Free Resources Included:
- 2 Oracle Autonomous Database instances (1 for each environment)
- 2 Oracle Linux VM instances (1 for API, 1 for frontend)
- Load balancer for high availability
- Object Storage for document management

## Deployment Architecture

### Backend (Oracle Cloud VM)
- **Platform**: Node.js API on Oracle Linux Compute
- **Database**: Oracle Autonomous Database
- **Storage**: Oracle Object Storage
- **Load Balancer**: Oracle Cloud Load Balancer

### Frontend (Oracle Cloud VM)
- **Platform**: React.js Application
- **Hosting**: Oracle Linux Compute
- **CDN**: Oracle Cloud Object Storage Static Hosting

## Oracle Cloud Setup

### 1. Oracle Cloud Account Setup
1. Create Oracle Cloud account (Free Tier)
2. Navigate to Oracle Cloud Console
3. Create Compute Instance for backend
4. Create Autonomous Database service
5. Set up Object Storage bucket

### 2. Database Configuration (Oracle Autonomous Database)
```bash
# Environment Variables for Oracle Cloud
ORACLE_CONNECTION_STRING=your_oracle_connection_string
ORACLE_USER=your_oracle_user
ORACLE_PASSWORD=your_oracle_password
ORACLE_WALLET_PATH=/path/to/wallet
```

### 3. Object Storage Configuration
```bash
# Oracle Object Storage
ORACLE_OBJECT_STORAGE_NAMESPACE=your_namespace
ORACLE_OBJECT_STORAGE_BUCKET=arbitration-docs
ORACLE_OBJECT_STORAGE_REGION=us-ashburn-1
```

## Deployment Steps for Oracle Cloud

### 1. Oracle Cloud Infrastructure Setup
1. **Create Oracle Cloud Account**
   - Go to oracle.com/cloud
   - Sign up for Free Tier account

2. **Set up Compartment**
   ```bash
   # Create compartment for arbitration platform
   oci iam compartment create \
     --compartment-id ocid1.tenancy.oc1..example \
     --description "Arbitration Platform Compartment" \
     --name "arbitration-platform"
   ```

3. **Create Virtual Cloud Network (VCN)**
   ```bash
   # Create VCN for the platform
   oci network vcn create \
     --compartment-id ocid1.compartment.oc1..example \
     --cidr-block "10.0.0.0/16" \
     --display-name "arbitration-platform-vcn"
   ```

### 2. Database Setup (Autonomous Database)
1. **Create Autonomous Database**
   - Use Oracle Cloud Console
   - Select Always Free tier
   - Configure database parameters:
     ```sql
     -- Database configuration
     Database Name: arbitration_db
     Workload Type: Transaction Processing
     ```

2. **Database Connection Setup**
   ```bash
   # Connection string for Oracle Autonomous Database
   CONNECTION_STRING="(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.us-ashburn-1.oraclecloud.com))(connect_data=(server=ON_DEMAND)))"
   ```

### 3. Compute Instance Setup
1. **Create Compute Instance for Backend**
   ```bash
   # Launch instance with Oracle Linux
   oci compute instance launch \
     --availability-domain "AD-1" \
     --compartment-id ocid1.compartment.oc1..example \
     --shape "VM.Standard.E2.1.Micro" \
     --display-name "arbitration-backend"
   ```

2. **Create Compute Instance for Frontend**
   ```bash
   # Launch instance with Oracle Linux
   oci compute instance launch \
     --availability-domain "AD-1" \
     --compartment-id ocid1.compartment.oc1..example \
     --shape "VM.Standard.E2.1.Micro" \
     --display-name "arbitration-frontend"
   ```

### 4. Object Storage Setup
1. **Create Object Storage Bucket**
   ```bash
   # Create bucket for document storage
   oci os bucket create \
     --compartment-id ocid1.compartment.oc1..example \
     --name "arbitration-docs" \
     --public-access-type "NoPublicAccess"
   ```

## Environment Variables for Oracle Cloud

### Backend Environment Variables
```bash
# Oracle Database Configuration
ORACLE_CONNECTION_STRING=your_oracle_connection_string
ORACLE_USER=your_oracle_user
ORACLE_PASSWORD=your_oracle_password
ORACLE_WALLET_PATH=/path/to/oracle/wallet

# Object Storage Configuration
ORACLE_OBJECT_STORAGE_NAMESPACE=your_namespace
ORACLE_OBJECT_STORAGE_BUCKET=arbitration-docs
ORACLE_OBJECT_STORAGE_REGION=us-ashburn-1

# Jitsi Configuration
JITSI_SERVER=https://meet.jit.si
```

### Frontend Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=https://your-oracle-instance.region.oraclecloud.com
REACT_APP_JITSI_SERVER=https://meet.jit.si
```

## Oracle Cloud Deployment Process

### 1. Backend Deployment to Oracle Cloud

1. **Create Compute Instance**
   ```bash
   # Deploy Node.js backend to Oracle Linux VM
   oci compute instance launch \
     --availability-domain "AD-1" \
     --compartment-id ocid1.compartment.oc1..example \
     --shape "VM.Standard.E2.1.Micro" \
     --display-name "arbitration-backend" \
     --image-id ocid1.image.oc1..example \
     --subnet-id ocid1.subnet.oc1..example
   ```

2. **Deploy to Oracle Cloud Instance**
   ```bash
   # SSH into the instance
   ssh opc@your-instance-ip
   
   # Install Node.js
   sudo yum update -y
   sudo yum install -y oracle-nodejs-release
   sudo yum install -y nodejs
   
   # Clone and deploy application
   git clone https://github.com/your-username/arbitration-platform.git
   cd arbitration-platform
   npm install
   npm start
   ```

### 2. Database Deployment to Oracle Autonomous Database

1. **Create Autonomous Database**
   ```bash
   # Create Oracle Autonomous Transaction Processing Database
   oci db autonomous-database create \
     --compartment-id ocid1.compartment.oc1..example \
     --db-name "arbitration_db" \
     --cpu-core-count 1 \
     --data-storage-size-in-tbs 1 \
     --admin-password "your_admin_password" \
     --wallet-file-name "arbitration_wallet.zip"
   ```

2. **Database Connection Setup**
   ```bash
   # Download and configure Oracle Wallet
   wget https://objectstorage.us-ashburn-1.oraclecloud.com/your-wallet-url
   unzip arbitration_wallet.zip -d /opt/oracle/wallet
   ```

### 3. Object Storage Integration

1. **Upload Documents to Object Storage**
   ```bash
   # Upload to Oracle Object Storage
   oci os object put \
     --namespace-name your_namespace \
     --bucket-name arbitration-docs \
     --name document.pdf \
     --file /path/to/document.pdf
   ```

### 4. Load Balancer Configuration

1. **Create Load Balancer**
   ```bash
   # Create Oracle Cloud Load Balancer
   oci lb load-balancer create \
     --compartment-id ocid1.compartment.oc1..example \
     --display-name "arbitration-lb" \
     --shape-name "100Mbps"
   ```

## Oracle Cloud Specific Features

### Always Free Resources Utilization
- **2 Oracle Autonomous Databases**: For development and production
- **2 Compute Instances**: Micro instances for backend and frontend
- **Object Storage**: For document storage and static assets
- **Load Balancer**: For high availability

### Oracle Cloud Deployment Benefits
- **Cost Effective**: Free tier resources included
- **Scalable**: Easy to upgrade to paid resources
- **Secure**: Built-in security features
- **Reliable**: 99.9% SLA for Always Free resources

## Monitoring and Management

### Oracle Cloud Monitoring
1. **Dashboard Monitoring**
   - Resource utilization
   - API performance metrics
   - Database performance
   - Storage usage

2. **Alerts and Notifications**
   - CPU usage alerts
   - Database connection alerts
   - Storage capacity alerts
   - Security alerts

### Oracle Cloud Security
1. **Identity and Access Management**
   - User authentication
   - Role-based access control
   - API key management

2. **Network Security**
   - Virtual Cloud Network security
   - Firewall rules
   - Private endpoints

## Oracle Cloud Deployment Summary

### Resources Used
- **Compute**: 2 Always Free VM instances
- **Database**: 2 Always Free Autonomous Databases
- **Storage**: Oracle Object Storage
- **Networking**: Load balancer and VCN

### Cost Estimation
- **Free Tier**: $0/month
- **Paid Resources**: Only if exceeding free limits
- **Scalability**: Easy upgrade path to paid resources

This deployment approach leverages Oracle Cloud's Always Free tier to provide a complete, production-ready arbitration platform at no cost.