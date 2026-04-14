#!/bin/bash

# Azure deployment script for Arbitration Platform

# Login to Azure (if not already logged in)
echo "Logging into Azure..."
az login

# Set your subscription
echo "Setting subscription..."
az account set --subscription "your-subscription-id"

# Create resource group
echo "Creating resource group..."
az group create --name arbitration-platform-rg --location "East US"

# Create App Service plan
echo "Creating App Service plan..."
az appservice plan create \
  --name arbitration-plan \
  --resource-group arbitration-platform-rg \
  --sku B1 \
  --is-linux

# Create Web App
echo "Creating Web App..."
az webapp create \
  --resource-group arbitration-platform-rg \
  --plan arbitration-plan \
  --name arbitration-platform-app \
  --runtime "NODE|16-lts"

# Configure environment variables
echo "Configuring environment variables..."
az webapp config appsettings set \
  --resource-group arbitration-platform-rg \
  --name arbitration-platform-app \
  --settings \
    POSTGRES_HOST="your-postgres-host" \
    POSTGRES_PORT="5432" \
    POSTGRES_DB="arbitration_db" \
    POSTGRES_USER="postgres" \
    POSTGRES_PASSWORD="your_password" \
    CLOUDFLARE_ACCOUNT_ID="your_account_id" \
    CLOUDFLARE_API_KEY="your_api_key" \
    CLOUDFLARE_R2_BUCKET="arbitration-docs"

# Deploy code to Azure App Service
echo "Deploying code..."
az webapp deployment source config-local-git \
  --resource-group arbitration-platform-rg \
  --name arbitration-platform-app

echo "Deployment completed successfully!"