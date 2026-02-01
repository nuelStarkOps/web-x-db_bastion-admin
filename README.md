# AWS Bastion Host Demo: Secure Authentication with S3, Lambda & Private Database

This project demonstrates a **secure AWS architecture** using a **Bastion Host** pattern for database administration. It showcases a complete authentication system where:

- **Frontend** (Login/Signup pages) is hosted on **S3 + CloudFront**
- **Backend** (Authentication logic) runs on **AWS Lambda**
- **Database** (MySQL/MariaDB) lives on an **EC2 instance in a private subnet**
- **Bastion Host** (EC2 in public subnet) provides secure admin access to the private database

---

## 🏗️ Architecture Overview

```mermaid
flowchart TB
    subgraph Internet
        User[👤 User]
    end
    
    subgraph AWS Cloud
        subgraph Public["Public Subnet"]
            CF[CloudFront]
            S3[S3 Bucket<br/>Frontend]
            Bastion[🖥️ Bastion EC2<br/>Jump Host]
        end
        
        subgraph Private["Private Subnet"]
            DB[🗄️ DB EC2<br/>MariaDB]
        end
        
        Lambda[⚡ Lambda<br/>Login/Signup]
        APIGW[🔌 API Gateway]
        IGW[🌐 Internet Gateway]
        NAT[📡 NAT Gateway]
    end
    
    User --> CF --> S3
    User --> APIGW --> Lambda
    Lambda --> DB
    User --> IGW --> Bastion
    Bastion --> DB
    DB --> NAT --> IGW
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **VPC** | Isolated network environment | us-east-1 |
| **Public Subnet** | Hosts bastion EC2 & NAT Gateway | Internet-facing |
| **Private Subnet** | Hosts database EC2 | No direct internet access |
| **Bastion EC2** | Jump host for SSH tunneling to DB | Public subnet |
| **DB EC2** | MariaDB server with user credentials | Private subnet |
| **Lambda Functions** | Signup & Login API handlers | VPC-attached |
| **API Gateway** | REST API for frontend | HTTP API |
| **S3 + CloudFront** | Static website hosting | Global CDN |

---

## 📁 Project Structure

```
web-x-db_bastion-admin/
├── frontend/                    # Static website files
│   ├── index.html              # Login page
│   ├── signup.html             # Registration page
│   ├── welcome.html            # Post-login page
│   ├── style.css               # Styling
│   └── auth.js                 # API calls (login/signup)
│
├── backend/                     # Lambda function code
│   ├── db.js                   # MySQL connection pool
│   ├── login.js                # Login handler (JWT generation)
│   ├── signup.js               # Signup handler (bcrypt hashing)
│   ├── utils.js                # Response helper
│   └── package.json            # Dependencies
│
└── bastion-demo-screenshots/    # Setup documentation images
    ├── phase-1/                # VPC, Subnets, Gateways, Bastion EC2
    ├── phase-2/                # DB EC2, SSH tunneling, MariaDB setup
    ├── phase-3_lambda/         # Lambda functions configuration
    ├── phase-4-api-gw/         # API Gateway setup
    └── phase-5-s3+cloudfront/  # S3 website hosting
```

---

## 🚀 Deployment Guide

### Phase 1: Network Infrastructure

#### Step 1.1 - Create VPC

Create a custom VPC to isolate your resources.

![Create VPC](bastion-demo-screenshots/phase-1/1.vpc_&_subnets/1-create_vpc.png)

#### Step 1.2 - Create Subnets

Create **two subnets**: one public (for bastion) and one private (for database).

**Private Subnet** (no direct internet access):
![Private Subnet](bastion-demo-screenshots/phase-1/1.vpc_&_subnets/2-private_subnet.png)

**Public Subnet** (internet-accessible via IGW):
![Public Subnet](bastion-demo-screenshots/phase-1/1.vpc_&_subnets/3-public_subnet.png)

#### Step 1.3 - Create Internet Gateway (IGW)

The IGW allows resources in the public subnet to communicate with the internet.

![Create IGW](bastion-demo-screenshots/phase-1/2.igw_&_ngw/4-igw.png)

**Attach IGW to VPC:**
![Attach IGW](bastion-demo-screenshots/phase-1/2.igw_&_ngw/5-attach_igw_to_vpc.png)

#### Step 1.4 - Create NAT Gateway (NGW)

The NAT Gateway allows private subnet resources to make outbound connections (e.g., for package updates) without exposing them to inbound traffic.

![Create NAT Gateway](bastion-demo-screenshots/phase-1/2.igw_&_ngw/6-ngw.png)

#### Step 1.5 - Configure Route Tables

**Private Route Table** - Routes traffic through NAT Gateway:
![Private RTB](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.1-private/7-private_rtb_ngw.png)

Add NAT Gateway route:
![Add NGW Route](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.1-private/8-add_ngw_route.png)

Associate with private subnet:
![Private Subnet Association](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.1-private/9-add_private_subnet_association.png)

**Public Route Table** - Routes traffic through Internet Gateway:
![Public RTB](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.2-public/10-public_rtb_ngw.png)

Add IGW route:
![Add IGW Route](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.2-public/11-add_igw_route.png)

Associate with public subnet:
![Public Subnet Association](bastion-demo-screenshots/phase-1/3-rtbs_&_subnet_associations/3.2-public/12-add_public_subnet_association.png)

#### Step 1.6 - Launch Bastion EC2

Create the bastion host in the **public subnet**.

![Create Bastion EC2](bastion-demo-screenshots/phase-1/4-bastion_ec2/13-create-EC2-bastion.png)

Create a key pair for SSH access:
![Key Pair](bastion-demo-screenshots/phase-1/4-bastion_ec2/13-keypair.png)

Configure network settings (public subnet, auto-assign public IP):
![Bastion Network Settings](bastion-demo-screenshots/phase-1/4-bastion_ec2/14-bastion_network_settings.png)

Configure security group to allow SSH (port 22) from your IP:
![Bastion Security Group](bastion-demo-screenshots/phase-1/4-bastion_ec2/15-bastion-SG_inbound_rule.png)

Verify instance is running and note the public IP:
![Bastion IP](bastion-demo-screenshots/phase-1/4-bastion_ec2/20-status_check-&-bastion-ip.png)

---

### Phase 2: Database Server Setup

#### Step 2.1 - Launch DB EC2 (Private Subnet)

Create the database server in the **private subnet** (no public IP).

![Create DB EC2](bastion-demo-screenshots/phase-2/5.db-ec2/16-create-EC2-DB_server.png)

Create a separate key pair:
![DB Key Pair](bastion-demo-screenshots/phase-2/5.db-ec2/17-keypair.png)

Network settings (private subnet, no public IP):
![DB Network Settings](bastion-demo-screenshots/phase-2/5.db-ec2/18-db_network_settings.png)

Security group - allow SSH from bastion's security group and MySQL from Lambda:
![DB Security Group](bastion-demo-screenshots/phase-2/5.db-ec2/19-DB-SG_inbound_rule.png)

Note the private IP address:
![DB Private IP](bastion-demo-screenshots/phase-2/5.db-ec2/21-DB-priv_ip.png)

#### Step 2.2 - SSH Tunneling via Bastion

To access the private DB EC2, you must tunnel through the bastion host.

Add SSH key identities:
![Add SSH Keys](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/22-add_ssh_key_identities.png)

Set proper key permissions:
```bash
chmod 400 ~/.ssh/bastion-key.pem
chmod 400 ~/.ssh/db-key.pem
```
![Key Permissions](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/23-ssh_key_permissions.png)

SSH into the bastion host:
```bash
ssh -i ~/.ssh/bastion-key.pem ec2-user@<BASTION_PUBLIC_IP>
```
![SSH Bastion](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/24-ssh_into_bastion.png)

Enable SSH agent forwarding:
![SSH Passthrough](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/24.2-add_ssh_for_passthrough.png)

From the bastion, SSH into the private DB EC2:
```bash
ssh ec2-user@<DB_PRIVATE_IP>
```
![SSH into DB](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/25-ssh_into_db_ec2.png)

Verify connectivity with ping test:
![Ping Test](bastion-demo-screenshots/phase-2/6.ssh_passthrough_x_pint_test/26-ping_test_db_ec2.png)

#### Step 2.3 - Install MariaDB

Install the MySQL client:
![Install MariaDB](bastion-demo-screenshots/phase-2/7.mariadb_setup/27-install_mariadb_mysql.png)

> **Note**: You may see an error if only the client is installed:
> ![Start Fail](bastion-demo-screenshots/phase-2/7.mariadb_setup/28-fail_to_start_mariadb.png)

Install MariaDB server:
```bash
sudo yum install mariadb-server -y
```
![Install Server](bastion-demo-screenshots/phase-2/7.mariadb_setup/29-install_mariadb_server.png)

Start and enable the service:
```bash
sudo systemctl start mariadb
sudo systemctl enable mariadb
```
![Start MariaDB](bastion-demo-screenshots/phase-2/7.mariadb_setup/30-start_&_enable_mariadb-server.png)

Run the secure installation script:
```bash
sudo mysql_secure_installation
```
![Secure Installation](bastion-demo-screenshots/phase-2/7.mariadb_setup/31-seecure_installation.png)

Access MySQL safely:
```bash
sudo mysql
```
![MySQL Access](bastion-demo-screenshots/phase-2/7.mariadb_setup/32-sudo_mysql_recommended_safe.png)

#### Step 2.4 - Create Database & User

Create the database and users table:

```sql
CREATE DATABASE auth_db;
USE auth_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

![Create Database](bastion-demo-screenshots/phase-2/8.create_DB_x_user/33-create_DB_x_user.png)

Create a user for Lambda to connect:

```sql
CREATE USER 'app_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON auth_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

![Create User](bastion-demo-screenshots/phase-2/8.create_DB_x_user/34-create_user_in_auth_.png)

---

### Phase 3: Lambda Functions

#### Step 3.1 - Create Security Group for Lambda

Create a security group for Lambda to access the database:
![Lambda SG](bastion-demo-screenshots/phase-3_lambda/35-sg_for_Lambda.png)

Update the DB security group to allow MySQL access from Lambda SG:
![DB SG Update](bastion-demo-screenshots/phase-3_lambda/36-mysql_access_to_db-SG_edit.png)

#### Step 3.2 - Prepare Lambda Deployment Package

Install npm packages locally:
```bash
cd backend
npm install
```
![Install NPM](bastion-demo-screenshots/phase-3_lambda/37-install_npm_packages.png)

Zip the backend folder (including node_modules):
```bash
zip -r backend.zip .
```
![Zip Backend](bastion-demo-screenshots/phase-3_lambda/38-zip_backened_recursively.png)

#### Step 3.3 - Create Lambda Function

Create a Lambda function (e.g., `signup-handler`):
![Create Lambda](bastion-demo-screenshots/phase-3_lambda/39-creeate_signup_lambda.png)

Configure VPC connection:
![Lambda VPC](bastion-demo-screenshots/phase-3_lambda/40-add_lambda_vpc.png)

> **Note**: If VPC attachment fails, check IAM permissions:
> ![VPC Fail](bastion-demo-screenshots/phase-3_lambda/40-5-vpc_creation_fail.png)

Create an IAM role with proper permissions:
![Lambda Role](bastion-demo-screenshots/phase-3_lambda/41-create_role_for_lambda.png)

Add the ENI (Elastic Network Interface) policy for VPC access:
![ENI Policy](bastion-demo-screenshots/phase-3_lambda/42-add_lambdaENI_policy.png)

Verify Lambda is attached to VPC:
![Lambda in VPC](bastion-demo-screenshots/phase-3_lambda/43-lambda_attached_to_vpc.png)

#### Step 3.4 - Configure Environment Variables

Add database connection details as environment variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `<DB_EC2_PRIVATE_IP>` |
| `DB_USER` | `app_user` |
| `DB_PASSWORD` | `your-secure-password` |
| `DB_NAME` | `auth_db` |
| `JWT_SECRET` | `your-jwt-secret` |

![Environment Variables](bastion-demo-screenshots/phase-3_lambda/44-add_lambda_env_variables.png)

#### Step 3.5 - Upload Code & Test

Upload the backend.zip file:
![Upload Code](bastion-demo-screenshots/phase-3_lambda/45-upload_backend_zip.png)

Create a test event:
![Test Event](bastion-demo-screenshots/phase-3_lambda/46-create_test_event.png)

Test the Lambda function:
![Test Success](bastion-demo-screenshots/phase-3_lambda/47-test_successful.png)

Verify users appear in the database:
![DB Users](bastion-demo-screenshots/phase-3_lambda/48-users_visible_in_db.png)

---

### Phase 4: API Gateway

#### Step 4.1 - Create HTTP API

Create an HTTP API in API Gateway:
![Create API 1](bastion-demo-screenshots/phase-4-api-gw/49-create_API_1.png)

![Create API 2](bastion-demo-screenshots/phase-4-api-gw/50-create_API_2.png)

Review the API configuration:
![Review API](bastion-demo-screenshots/phase-4-api-gw/51-review_api_config.png)

#### Step 4.2 - Configure CORS

Enable CORS for browser access:
![Configure CORS](bastion-demo-screenshots/phase-4-api-gw/52-configure_CORS.png)

Set the integration target:
![CORS Target](bastion-demo-screenshots/phase-4-api-gw/53-1-API_gatewayCORs_integration_target.png)

#### Step 4.3 - Test the API

Test with curl:
```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```
![Curl Test](bastion-demo-screenshots/phase-4-api-gw/53-curl_test_API.png)

---

### Phase 5: S3 + CloudFront Hosting

#### Step 5.1 - Enable Static Website Hosting

Enable static website hosting on S3:
![Enable Web S3](bastion-demo-screenshots/phase-5-s3+cloudfront/54-enable_web_S3.png)

Create the S3 bucket:
![Create S3](bastion-demo-screenshots/phase-5-s3+cloudfront/55-create_S3.png)

#### Step 5.2 - Configure Bucket Policy

Add a bucket policy to allow public read access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

![Bucket Policy](bastion-demo-screenshots/phase-5-s3+cloudfront/56-bucket_policy.png)

#### Step 5.3 - Test the Application

**Signup successful:**
![Signup Success](bastion-demo-screenshots/phase-5-s3+cloudfront/57-signup_successful.png)

**Login successful:**
![Login Success](bastion-demo-screenshots/phase-5-s3+cloudfront/58-login_successful.png)

**Users stored with JWT encryption:**
![JWT Encryption](bastion-demo-screenshots/phase-5-s3+cloudfront/59-new_users_jwtencryption.png)

---

## 🔐 Security Features

- **Network Isolation**: Database is in a private subnet with no public IP
- **Bastion Host Pattern**: Only way to access DB is through the bastion
- **Security Groups**: Fine-grained access control
  - Bastion: SSH from your IP only
  - DB: SSH from bastion SG, MySQL from Lambda SG
- **Password Hashing**: bcrypt with salt rounds of 10
- **JWT Authentication**: 1-hour expiring tokens
- **CORS Configuration**: API Gateway configured for cross-origin requests

---

## 🧹 Cleanup

When you're done testing, you can delete users via the bastion/DB connection:

![Delete User](bastion-demo-screenshots/phase-5-s3+cloudfront/60-delete_user_testuser.png)

![User Deleted](bastion-demo-screenshots/phase-5-s3+cloudfront/61-user_deleted.png)

To fully clean up AWS resources:
1. Delete Lambda functions
2. Delete API Gateway
3. Empty and delete S3 bucket
4. Terminate EC2 instances (bastion & DB)
5. Delete NAT Gateway (stops billing)
6. Release Elastic IPs
7. Delete security groups
8. Delete subnets and route tables
9. Detach and delete Internet Gateway
10. Delete VPC

---

## 📚 Code Overview

### Frontend (`frontend/auth.js`)

```javascript
const API_URL = "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod";

// Login - sends credentials, stores JWT token
async function login(event) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "welcome.html";
  }
}

// Signup - creates new user account
async function signup(event) {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    body: JSON.stringify({ username, password, email })
  });
}
```

### Backend Lambda (`backend/signup.js`)

```javascript
const bcrypt = require("bcryptjs");
const { getDB } = require("./db");

exports.handler = async (event) => {
  const { username, email, password } = JSON.parse(event.body);
  
  // Hash password
  const hashed = await bcrypt.hash(password, 10);
  
  // Store in database
  await db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashed]
  );
};
```

### Backend Lambda (`backend/login.js`)

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  const { username, password } = JSON.parse(event.body);
  
  // Fetch user from DB
  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
  
  // Verify password
  const match = await bcrypt.compare(password, user.password);
  
  // Generate JWT
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};
```

---

## 🎯 Key Takeaways

1. **Bastion hosts** provide secure access to private resources
2. **Private subnets** with NAT gateways allow outbound-only internet access
3. **Lambda in VPC** can access private resources securely
4. **Security groups** act as virtual firewalls at the instance level
5. **API Gateway + Lambda** provides a serverless backend architecture
6. **S3 + CloudFront** offers cost-effective static site hosting

---

## 📄 License

This project is for demonstration purposes.
