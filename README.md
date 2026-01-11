1.	PROBLEM IDENTIFICATION

1.1	Background
In traditional web applications, hosting and managing infrastructure often require significant effort in maintaining on-premise servers, manual database management, and limited scalability. Most college or enterprise-level task management systems rely on fixed hardware or local hosting solutions that are not optimized for availability, scalability, or monitoring.
With the growing need for real-time task tracking and remote accessibility, deploying such systems on the cloud offers:
•	High availability across regions
•	Automatic scalability
•	Reduced operational costs
•	Easier monitoring and security management
However, students and small organizations often struggle to understand how multiple AWS services — EC2, DynamoDB, S3, IAM, and CloudWatch — can work together to host a complete, scalable web solution.
This project, therefore, addresses that educational and technical gap.

1.2	Problem Context and Objectives
Objective	Description
Frontend Hosting	Develop and host a responsive web interface (React + Vite) on an AWS EC2 instance using Apache web server.
Backend API Development	Build a Node.js and Express-based backend hosted on the same EC2 instance to handle REST API requests and interact with DynamoDB.
Cloud Database Integration	Integrate AWS DynamoDB to store task data (ID, title, description, status, timestamps).
Security and Access Control	Use IAM roles to ensure least-privilege access for EC2 to DynamoDB and S3.
Monitoring and Logging	Implement AWS CloudWatch for log tracking, health monitoring, and performance analysis.
Automation and High Availability	Use PM2 to keep the backend running continuously, even after restarts.
	
1.3	Problem Scope
This project focuses on developing a fully functional web-based task management system hosted entirely on the AWS cloud. The solution simulates real-world cloud deployment and DevOps practices while demonstrating the use of multiple AWS services together.
The project scope includes:
•	Creating a modern web interface where users can add, update, delete, and mark tasks as complete.
•	Backend development using Node.js and Express with AWS SDK to handle CRUD operations in DynamoDB.
•	Secure integration through IAM Roles (instead of static credentials).
•	File storage (S3) setup for future file upload extensions.
•	Monitoring and alert setup using CloudWatch Logs and CloudTrail.
•	Complete end-to-end deployment and demonstration on AWS EC2.

2.	 Services from AWS
2.1	Amazon EC2 (Elastic Compute Cloud)
Purpose in this project
EC2 provides the compute instance that hosts:
•	the frontend static site (built React files served by Apache/HTTPD on port 80),
•	the backend Node.js/Express API (listening on port 3001, managed by PM2), and
•	command-line tools (AWS CLI, npm, git) used to deploy & operate the app.
EC2 is the central compute node where the application stack runs.
Exact configuration used / recommended
•	AMI: Amazon Linux 2023 (or Amazon Linux 2) — lightweight, well supported.
•	Instance type: t3.micro (free tier eligible) — enough for a small project/demo.
•	Storage: 8–30 GB General Purpose SSD (gp3) is fine for this project.
•	Network: Public IPv4 address assigned (so site is reachable).
•	Security group: Custom rules:
o	SSH (TCP 22) — restrict to your IP (e.g., X.X.X.X/32)
o	HTTP (TCP 80) — 0.0.0.0/0 for website access
o	Custom TCP (TCP 3001) — 0.0.0.0/0 or restrict to your IP for backend testing
•	IAM role (instance profile): taskflow-ec2-role with policies for DynamoDB, S3, CloudWatch (detailed under IAM).
•	Key pair: PEM file used to SSH from your machine.
 

Security Groups act as virtual firewalls controlling inbound/outbound traffic to the EC2 instance.
Settings used
•	Inbound rules:
o	SSH — Port 22 — Source = Your IP (e.g., x.x.x.x/32) (important for security)
o	HTTP — Port 80 — Source = 0.0.0.0/0 (to expose frontend)
o	Custom TCP — Port 3001 — Source = 0.0.0.0/0 or your IP (for backend testing)
•	Outbound: allow all (default) so EC2 can reach AWS APIs (DynamoDB, S3)
  

2.2	Amazon S3 (Simple Storage Service)
Purpose
S3 is used for object storage — in this project:
•	Optionally host static assets (images) uploaded by users, or
•	Store backups/exports of task data if required, or
•	Host static frontends (not used here because we served via Apache; but you can optionally host the site on S3 + CloudFront).
Recommended bucket config
•	Bucket name: taskflow-storage01 (must be globally unique)
•	Region: same as your EC2 & DynamoDB (ap-south-1) to reduce latency & data transfer costs
•	Block public access: Keep block public access ON by default to avoid accidental public exposure. Only disable if you deliberately host a public static site.
•	Object ownership: Set to Bucket owner preferred to ensure the bucket owner owns objects uploaded by other AWS accounts.
•	Versioning: Optional for backups (enable for production)
•	Encryption: Enable default encryption (SSE-S3) — screenshot the encryption toggle.
•	Lifecycle rules: Optional to move old backups to cheaper storage (Glacier) — mention in report.
     







2.3	Amazon DynamoDB
Purpose in this project
DynamoDB stores tasks as NoSQL items. Each item contains:
•	id (primary key, string UUID)
•	title (string)
•	description (string, optional)
•	status (string: "active" or "completed")
•	createdAt (ISO timestamp)
•	updatedAt (optional timestamp)
DynamoDB offers fast, scalable, managed NoSQL storage without server administration.
Table configuration used
•	Table name: taskflow-data
•	Primary key (Partition key): id (String)
•	Sort key: none needed for this design
•	Provisioned capacity: On-demand (Recommended for small projects; avoids capacity planning)
•	Secondary indexes: Not necessary for basic use (
•	Encryption: AWS-managed encryption at rest (default)
•	Point-in-time recovery (PITR): Optional (enable for production)
    
  
Step-by-step console config & CLI commands
1.	Console:
o	DynamoDB → Create table → Table name taskflow-data, Partition key id (String) → Capacity mode: On-demand → Create. 
2.	Add sample items (console):
o	DynamoDB → Tables → taskflow-data → Explore items → Create item (enter JSON fields) 

2.4	AWS Identity and Access Management (IAM)
Purpose
IAM secures access. You must create roles and policies so EC2 can call DynamoDB, S3, and CloudWatch without embedding keys.
Roles & policies to create
1.	Instance role (instance profile) — taskflow-ec2-role
o	Attach managed policies:
	AmazonDynamoDBFullAccess (for demo) — in production use a restricted custom policy.
	AmazonS3FullAccess (for demo S3 access)
	CloudWatchAgentServerPolicy (to allow the CloudWatch agent to write logs/metrics)
	AmazonSSMManagedInstanceCore (optional — allows Systems Manager, easier remote management)
o	Trust relationship: ec2.amazonaws.com (default when creating role for EC2).
 
Step-by-step console actions & screenshots
1.	IAM → Roles → Create role → Choose EC2 → Attach policies → Name taskflow-ec2-role → Create.
2.	Attach role to EC2 instance (if not selected at launch): EC2 → Instance → Actions → Security → Modify IAM Role → Choose taskflow-ec2-role.
3.	Capture the role details page: permissions, trust relationship.
    
2.5	CloudWatch
Purpose
CloudWatch collects logs (backend logs, system logs) and metrics. It’s used to:
•	Monitor backend health, errors, and performance
•	Create alarms (e.g., CPU, memory, or error thresholds)
•	Store PM2 logs via CloudWatch agent (optional)
What to configure
•	CloudWatch Logs group for taskflow-backend
•	CloudWatch agent installed on EC2 to forward system logs (if desired)
•	Log stream for backend logs or use PM2 to write to files and CloudWatch agent to forward those files
•	Alarms: Create a CloudWatch alarm for high CPU or for specific log pattern (ERROR)
Commands & steps
1.	Install CloudWatch agent on EC2:
2.	 Configure PM2 logs to a known file location (pm2 default logs in ~/.pm2/logs) and add that path to CloudWatch agent config.
3.	 Console: CloudWatch → Logs → Create log group taskflow-backend-logs, then verify log streams appear after agent runs.
4.	Create an alarm: CloudWatch → Alarms → Create alarm (CPUUtilization > 7% over 5 minutes).

3.	Workflow
3.1	Actors/ Components

•	Browser (User UI) — single page app (React + Vite) served over HTTP (port 80) from Apache on EC2.
•	Apache (EC2) — serves static files (index.html, JS bundle, CSS). Static files are built into dist/.
•	Backend (EC2, Node/Express) — REST API listening on port 3001, managed by PM2. It has these endpoints:
o	GET /api/tasks — returns all tasks (DynamoDB Scan).
o	POST /api/tasks — create task (DynamoDB PutItem).
o	PUT /api/tasks/:id — update title/description (DynamoDB UpdateItem).
o	PUT /api/tasks/:id/status — update status (DynamoDB UpdateItem).
o	DELETE /api/tasks/:id — delete task (DynamoDB DeleteItem) — optional.
•	DynamoDB — Table taskflow-data with partition key id (String). Stores task objects.
•	S3 — taskflow-storage01 (optional) for file assets; backend can upload/use it.
•	CloudWatch — collects backend logs and EC2 metrics; dashboards and alarms configured for monitoring.
•	EC2 Instance Role — taskflow-ec2-role attached to instance, grants DynamoDB, S3, CloudWatch permissions (no credential leakage).
•	Security Group — allows inbound SSH (22) from your IP, HTTP (80) open, API port 3001 open (0.0.0.0/0 or restricted).

3.2	Workflow Steps
Step 0 — Pre-conditions and config
•	EC2 instance launched with public IP (or Elastic IP). Apache installed and serving from /var/www/html.
•	App repo cloned to /home/ec2-user/taskflow.
•	Backend in /home/ec2-user/taskflow/backend/server.js, PM2 managing it (pm2 start server.js --name taskflow-backend).
•	server.js must listen app.listen(3001, '0.0.0.0', ...) to accept external requests.
•	Security group inbound rules: 80, 3001 open. SSH restricted.
•	EC2 role taskflow-ec2-role attached with appropriate policies.
•	CloudWatch agent installed (optional) and configured to ship PM2 logs.
________________________________________
Step 1 — User loads website
1.	User opens http://<PUBLIC_IP>/ (or domain).
2.	Apache serves index.html and static assets (/dist files). Browser downloads JS and runs SPA.
________________________________________
Step 2 — User clicks "New Task" → Frontend POST
3.	SPA creates a newTask object:
{
  "id": "uuid-v4",          
  "title": "Buy milk",
  "description": "2 liters",
  "status": "active",
  "createdAt": "2025-11-05T12:34:56Z"
}
4.	SPA sends POST http://<PUBLIC_IP>:3001/api/tasks with Content-Type: application/json and the JSON body.
Important small details:
•	The frontend should do client-side validation: title non-empty, id unique (UUID), description length check. This avoids invalid requests.
•	UI should optimistically show a loading indicator and disable save button until response.
________________________________________
Step 3 — Backend receives request & validates
5.	Node/Express receives request. Middleware stack:
•	cors() must be enabled so browser can make cross-port requests (port 80 → 3001). Use app.use(cors()) or restrict to origin http://<PUBLIC_IP>.
•	express.json() (or body-parser.json()) parses JSON.
6.	Validation logic:
if (!body.id || !body.title) return res.status(400);
7.	Generate server-side timestamps as well (ensure createdAt consistent).
Security / error handling:
•	Reject invalid/malicious payloads (return 400).
•	Sanitize inputs (strip weird control chars), though DynamoDB is safe for strings—still sanitize if you plan to render HTML.
________________________________________
Step 4 — Backend writes to DynamoDB
8.	Use AWS SDK DocumentClient:
await dynamoDB.put({ TableName: 'taskflow-data', Item: newTask }).promise();
9.	On success:
           return 201 (or 200) and body { message: 'Task added successfully', item:               
           newTask }.
10.	On error: catch and console.error(err); res.status(500).json({ error: 'Failed to add task' }).
IAM: EC2 instance role must have dynamodb:PutItem permission on the table ARN. If permission denied, AccessDeniedException appears; log shows it.
________________________________________
Step 5 — Backend logs and monitoring
11.	Backend writes a log entry (stdout/stderr) — PM2 captures logs at ~/.pm2/logs/. The CloudWatch agent reads those files and forwards to CloudWatch Log Group taskflow-backend-logs.
12.	CloudWatch Metrics: EC2 metrics (CPUUtilization, NetworkIn/Out) are visible in CloudWatch automatically.
Monitoring best practice: create a CloudWatch Alarm on CPU or a metric filter     counting ERROR occurrences, sending an SNS email to you.
________________________________________
Step 6 — Frontend updates UI
13.	Once backend responds with success, frontend:
•	shows success toast,
•	optionally appends the new task to UI array (setTasks([...tasks, newTask])) or calls GET /api/tasks again to refresh from DB.
UI UX note: If you optimistically append newTask before server confirmation, add rollback on failure. E.g., show temporary spinner and revert if POST fails.
________________________________________
Step 7 — Further operations (PUT status, DELETE)
•	For status toggle:
o	Frontend calls PUT /api/tasks/:id/status with {status: "completed"}.
o	Backend does UpdateItem with UpdateExpression to set status.
•	For edit:
o	PUT /api/tasks/:id to update title, description.
•	For delete:
o	DELETE /api/tasks/:id to remove.
All flows follow same pattern: validate → update DynamoDB → log → respond.

3.3	Error cases & handling
1.  Network unreachable (frontend → backend)
•	Symptom: frontend toast “Failed to save task”; DevTools shows net::ERR_CONNECTION_REFUSED.
•	Fix: ensure BE listens 0.0.0.0:3001, security group allows port 3001, and backend running.
•	Test: from local machine: curl -v http://<PUBLIC_IP>:3001/.
2.  CORS blocked
•	Symptom: browser console shows CORS error and request shows OPTIONS preflight failing.
•	Fix: add cors() at backend. Configure allowed origin if stricter security required.
•	Test: open DevTools Network → find OPTIONS preflight and check response headers Access-Control-Allow-Origin.

3.  IAM AccessDenied
•	Symptom: backend log shows AccessDeniedException: User is not authorized to perform: dynamodb:PutItem.
•	Fix: attach dynamodb:PutItem (or AmazonDynamoDBFullAccess for demo) to taskflow-ec2-role.
•	Test: run curl from EC2 (localhost) — AccessDenied persists if role missing.
4.  Invalid payload
•	Symptom: backend returns 400, UI shows validation error.
•	Fix: add client-side checks and server-side checks.
5.  DynamoDB throttling (rare for demo)
•	Symptom: Provisioned throughput exceeded.
•	Fix: Use on-demand billing or add retry with exponential backoff in backend (AWS SDK retry settings).
6.  Race conditions on UI
•	Symptom: double-clicking Save creates duplicates.
•	Fix: disable save button until request completes.

4.	Application Development
4.1	Frontend Development
Technology Stack
•	Framework: React.js (with Vite build tool for faster performance)
•	Language: TypeScript (provides static type safety)
•	Styling: TailwindCSS (modern responsive design)
•	UI Components: shadcn/ui and lucide-react icons
•	Package Manager: npm (Node package manager)

Purpose
The frontend acts as the user interface for interacting with the backend API.
It allows users to:
•	Create, view, update, and delete tasks.
•	Filter tasks based on their status (Active, Completed, All).
•	Provide instant visual feedback using toast notifications.
Key Features Implemented
•	Dynamic UI updates without page reloads (Single Page Application - SPA).
•	REST API integration using fetch() for CRUD operations.
•	Task state management using React hooks (useState, useEffect).
•	Input validation and responsive design for accessibility.
•	Toast notifications for success/failure messages.
                 
4.2	Backend Development
Technology Stack
•	Runtime: Node.js (v18+)
•	Framework: Express.js
•	Database SDK: AWS SDK for JavaScript (v2)
•	Process Manager: PM2 (for production uptime)
•	Logging: CloudWatch integration via PM2 logs
•	CORS Middleware: Enabled to allow frontend-to-backend requests

Purpose
The backend acts as a RESTful API service between the frontend and DynamoDB.
 It:
•	Validates incoming data
•	Executes CRUD operations on DynamoDB
•	Logs actions for monitoring
•	Returns standardized JSON responses

4.3	AWS Service Integration
AWS Service	Role in Project
EC2	Host for both frontend and backend.
DynamoDB	Database for persistent task storage.
S3	Object storage for static assets or file backups.
IAM	Manages roles and permissions securely.
CloudWatch	Monitors logs, metrics, and instance health.
