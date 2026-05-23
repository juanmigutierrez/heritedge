# HeritEdge — AWS Demo Deployment Guide

This guide documents the full procedure to deploy HeritEdge as a live demo on AWS using the free tier. It covers containerizing the API, hosting the frontend on S3 + CloudFront, and running both the API and Chroma vector database on a single EC2 instance.

---

## Placeholders

Before starting, collect these values and keep them handy. You will substitute them throughout the guide.

| Placeholder | What it is | Where to find it |
|---|---|---|
| `<AWS_ACCOUNT_ID>` | 12-digit AWS account number | AWS Console → top-right corner → your account name |
| `<AWS_REGION>` | Region you deploy into | AWS Console → top-right corner (e.g. `eu-north-1`) |
| `<EC2_PUBLIC_IP>` | Public IP of your EC2 instance — use the Elastic IP allocated in Step 2.3 | EC2 → Instances → your instance → Public IPv4 address |
| `<EC2_PUBLIC_DNS>` | Public DNS of your EC2 instance | EC2 → Instances → your instance → Public IPv4 DNS |
| `<CLOUDFRONT_DOMAIN>` | CloudFront distribution domain | CloudFront → your distribution → Distribution domain name |
| `<CLOUDFRONT_DISTRIBUTION_ID>` | CloudFront distribution ID | CloudFront → your distribution → ID column |
| `<GITHUB_TOKEN>` | GitHub personal access token | Used as the LLM API key — from your `.env` file |

---

## Prerequisites

Install and configure all of these before starting.

### Local machine

- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop). Must be running when you build and push images.
- **AWS CLI** — [aws.amazon.com/cli](https://aws.amazon.com/cli). After installing, configure it:
  ```cmd
  aws configure
  ```
  Enter your AWS Access Key ID, Secret Access Key, default region (e.g. `eu-north-1`), and output format (`json`). You can create access keys in the AWS Console under **IAM → Users → your user → Security credentials**.
- **Node.js 20** — [nodejs.org](https://nodejs.org). Required to build the frontend.
- **SSH client** — available by default in Windows Terminal / PowerShell.

### AWS account

- An AWS account. The free tier covers everything in this guide as long as your account is within its 12-month free tier window.
- Sufficient IAM permissions to create EC2 instances, ECR repositories, S3 buckets, CloudFront distributions, and IAM roles.

---

## Architecture

```
Browser
  │
  └── CloudFront (<CLOUDFRONT_DOMAIN>)
        ├── /* → S3 bucket (React/Vite frontend, static files)
        └── /api/* → EC2:<EC2_PUBLIC_DNS>:3001 (Express API)

EC2 t3.micro (free tier)
  └── Docker user-defined network "heritedge"
        ├── heritedge-api container  (port 3001, pulled from ECR)
        └── chroma container         (reached by the API as http://chroma:8000)
```

Everything runs over HTTPS via CloudFront, which is required for WebXR camera and gyroscope access.

---

## Step 1 — Build and push the API Docker image

All commands in this step run on your **local machine**.

### 1.1 Build the image

```cmd
cd <project-root>\Website\apps\api
docker build --platform linux/amd64 -t heritedge-api .
```

The `--platform linux/amd64` flag forces the image to match the EC2 `t3.micro` architecture (x86-64). It is required if you build on an Apple Silicon Mac and harmless on Windows/Intel.

The Dockerfile uses a multi-stage build: TypeScript is compiled in a builder stage, and only the compiled `dist/` and production `node_modules` are copied to the runtime image. `sharp` is reinstalled from scratch in the runtime stage because it links native binaries at install time.

### 1.2 Create the ECR repository

```cmd
aws ecr create-repository --repository-name heritedge-api --region <AWS_REGION>
```

### 1.3 Authenticate Docker to ECR

```cmd
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
```

### 1.4 Tag and push the image

```cmd
docker tag heritedge-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
```

---

## Step 2 — Launch an EC2 instance

All actions in this step are in the **AWS Console**.

### 2.1 Launch the instance

- Go to **EC2 → Launch instance**
- **Name:** `heritedge-demo`
- **AMI:** Amazon Linux 2023 (default)
- **Instance type:** `t3.micro` (free tier eligible)
- **Key pair:** click **Create new key pair** → name it `heritedge-key` → type RSA → format `.pem` → download it and store it somewhere safe (you cannot download it again)
- **Network settings → Edit → Inbound rules:** add two rules:

  | Type | Port | Source |
  |---|---|---|
  | SSH | 22 | My IP |
  | Custom TCP | 3001 | Anywhere (0.0.0.0/0) — tighten later, see note |

- **Storage:** leave default (8 GB gp3)
- Click **Launch instance**

> **Security note:** `0.0.0.0/0` on port 3001 lets anyone reach the API directly over plain HTTP, bypassing CloudFront. It is fine while you are setting up and testing. Once the demo works, harden it: go to **EC2 → Security Groups → your group → Inbound rules → Edit**, and change the source of the port 3001 rule to the AWS-managed prefix list **`com.amazonaws.global.cloudfront.origin-facing`** (choose **Custom** as the source type and search for it by name). Only CloudFront will then be able to reach the API.

### 2.2 Attach an IAM role for ECR access

The instance needs permission to pull images from ECR. Create a role for it:

1. Go to **IAM → Roles → Create role**
2. Trusted entity: **AWS service → EC2**
3. Permissions: attach **`AmazonEC2ContainerRegistryReadOnly`**
4. Name: `heritedge-ec2-role` → **Create role**

Attach it to the instance:

1. Go to **EC2 → Instances** → **check the checkbox** next to `heritedge-demo`
2. **Actions → Security → Modify IAM role**
3. Select `heritedge-ec2-role` → **Update IAM role**

Verify it worked by SSHing in (see next step) and running:
```bash
aws sts get-caller-identity
```
It should return your account info, not an error.

### 2.3 Allocate an Elastic IP

By default, an instance's public IP and public DNS change every time it is stopped and started — which would silently break the CloudFront origin you configure in Step 5. Pin them with an Elastic IP:

1. Go to **EC2 → Elastic IPs → Allocate Elastic IP address** → **Allocate**
2. Select the new address → **Actions → Associate Elastic IP address**
3. Choose the `heritedge-demo` instance → **Associate**

An Elastic IP adds no extra cost while it is associated with a running instance. Use this address — and the matching public DNS — for `<EC2_PUBLIC_IP>` and `<EC2_PUBLIC_DNS>` everywhere below.

---

## Step 3 — Set up the EC2 instance

All commands in this step run on the **EC2 instance via SSH**.

### 3.1 SSH into the instance

From your local machine (Windows CMD or PowerShell):
```cmd
ssh -i "C:\path\to\heritedge-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

### 3.2 Install Docker

```bash
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
```

Then log out and back in so the group membership takes effect:
```bash
exit
```
```cmd
ssh -i "C:\path\to\heritedge-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

Verify Docker works:
```bash
docker ps
```
Should return an empty list with no permission errors.

### 3.3 Add a swap file

A `t3.micro` has only 1 GB of RAM, shared by the API and Chroma containers. Add a 2 GB swap file so the instance does not run out of memory under load:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Confirm it is active:
```bash
free -h
```
The `Swap` row should show roughly `2.0Gi`.

### 3.4 Create the Docker network

Both containers must share a user-defined Docker network so the API can reach Chroma by container name. On the default bridge network, `localhost` inside the API container points at the API container itself — not Chroma — so retrieval would silently fail.

```bash
docker network create heritedge
```

### 3.5 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region <AWS_REGION> | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
```

### 3.6 Start Chroma

```bash
docker run -d --name chroma \
  --network heritedge \
  --restart unless-stopped \
  -v chroma-data:/chroma/chroma \
  -p 8000:8000 \
  chromadb/chroma
```

`--network heritedge` puts Chroma on the shared network so the API can reach it as `http://chroma:8000`. `--restart unless-stopped` makes Chroma come back automatically after an instance reboot — the API has the same flag, and without it the API would restart while Chroma stayed down, silently breaking retrieval. The `-v chroma-data:/chroma/chroma` flag persists vector data in a named Docker volume so it survives container restarts.

### 3.7 Start the API

```bash
docker run -d --name heritedge-api \
  --network heritedge \
  --restart unless-stopped \
  -p 3001:3001 \
  -e GITHUB_TOKEN=<GITHUB_TOKEN> \
  -e CHROMA_URL=http://chroma:8000 \
  -e WEB_ORIGIN=https://<CLOUDFRONT_DOMAIN> \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
```

> **Note:** `WEB_ORIGIN` must be set to the CloudFront HTTPS domain. This controls the CORS `Access-Control-Allow-Origin` header. You will get the CloudFront domain in Step 5 — if you need to start the API before then, use a temporary placeholder and restart the container after.

Verify both containers are running:
```bash
docker ps
```
You should see `heritedge-api` and `chroma` both with status `Up`.

---

## Step 4 — Host the frontend on S3

All commands in this step run on your **local machine**.

### 4.1 Build the frontend

Run these as two separate commands to avoid a trailing-space bug that encodes the URL as `/api%20/`:

```cmd
set VITE_API_URL=https://<CLOUDFRONT_DOMAIN>/api
npm run build --prefix Website
```

> **Important:** `VITE_API_URL` must end with `/api` (no trailing slash). The frontend appends `/chat`, `/transcribe`, etc. directly to this base URL. The `/api` prefix is required because CloudFront routes `/api/*` to the EC2 origin and `/*` to S3.

### 4.2 Create the S3 bucket

```cmd
aws s3 mb s3://heritedge-demo --region <AWS_REGION>
```

Disable public access block (required for static website hosting):
- Go to **S3 → heritedge-demo → Permissions → Block public access**
- Click **Edit** → uncheck all four options → **Save**

Add a bucket policy to allow public reads. Save this to a file first (CMD doesn't handle inline JSON well):

Create a file called `bucket-policy.json` with this content:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::heritedge-demo/*"
  }]
}
```

Then apply it:
```cmd
aws s3api put-bucket-policy --bucket heritedge-demo --policy file://bucket-policy.json
```

### 4.3 Enable static website hosting

```cmd
aws s3 website s3://heritedge-demo --index-document index.html --error-document index.html
```

### 4.4 Upload the built frontend

```cmd
aws s3 sync Website/dist s3://heritedge-demo --delete
```

---

## Step 5 — Create the CloudFront distribution

All actions in this step are in the **AWS Console**.

### 5.1 Create the distribution

- Go to **CloudFront → Create distribution**
- **Name:** `heritedge-demo`
- **Type:** Web
- **Domain:** leave blank

**Origin settings:**
- **Type:** S3
- **S3 origin:** select `heritedge-demo` from the dropdown
- **Origin Access:** None (the bucket is already public)
- **Cache settings:** leave as default

**Security:**
- Select **Do not enable security protections** (WAF costs extra, not needed for a demo)

Click **Create distribution**. It will take 5–10 minutes to deploy. Wait until the status shows **Enabled**.

### 5.2 Set the default root object

- Click on your distribution → **General tab → Settings → Edit**
- Set **Default root object** to `index.html`
- Save

### 5.3 Add the EC2 API origin

- Go to **Origins tab → Create origin**
- **Origin domain:** `<EC2_PUBLIC_DNS>` (e.g. `ec2-13-53-116-92.eu-north-1.compute.amazonaws.com`)

  > Use the public DNS hostname, not the IP address — CloudFront does not accept raw IP addresses as origin domains.

- **Protocol:** HTTP only
- **Port:** 3001
- Save

### 5.4 Add a behavior for API requests

- Go to **Behaviors tab → Create behavior**
- **Path pattern:** `/api/*`
- **Origin:** select the EC2 origin created in 5.3
- **Allowed HTTP methods:** `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
- **Cache policy:** `CachingDisabled` (API responses must not be cached)
- **Origin request policy:** `AllViewerExceptHostHeader` (AWS-managed)
- Save

> **Important:** The origin request policy is required, not optional. Without it, CloudFront forwards almost no viewer headers to the EC2 origin — including `Content-Type`. The API's `express.json()` parser only reads a request body when `Content-Type: application/json` is present, so `POST /api/chat` would arrive with an empty body and return `400 "Message is required"`. The `/transcribe` and `/verify-photo` uploads break the same way, because their `multipart/form-data` boundary header is dropped. `AllViewerExceptHostHeader` forwards every viewer header while still letting CloudFront send the EC2 origin's own hostname as the `Host` header.

### 5.5 Configure error pages for client-side routing

React Router handles navigation client-side. Without this, refreshing any route other than `/` returns a 403 from S3.

- Go to **Error pages tab → Create custom error response**
  - HTTP error code: **403** → Response page path: `/index.html` → HTTP response code: **200** → Save
- Create another:
  - HTTP error code: **404** → Response page path: `/index.html` → HTTP response code: **200** → Save

---

## Step 6 — Rebuild and re-upload the frontend with the real CloudFront domain

Now that you have `<CLOUDFRONT_DOMAIN>`, rebuild the frontend with the correct URL and re-upload:

```cmd
set VITE_API_URL=https://<CLOUDFRONT_DOMAIN>/api
npm run build --prefix Website
aws s3 sync Website/dist s3://heritedge-demo --delete
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> --paths "/*"
```

The invalidation clears the CloudFront cache so the new build is served immediately. Wait ~2 minutes for it to complete:

```cmd
aws cloudfront list-invalidations --distribution-id <CLOUDFRONT_DISTRIBUTION_ID>
```

When `Status` shows `Completed`, the new build is live.

---

## Step 7 — Ingest the knowledge base

This step loads the Piazza del Duomo facts into Chroma so the `/chat` RAG endpoint works. Run it on the **EC2 instance via SSH**.

### 7.1 Copy the knowledge base file to EC2

From your **local machine**:
```cmd
scp -i "C:\path\to\heritedge-key.pem" "<project-root>\Website\src\content\knowledge-base.json" ec2-user@<EC2_PUBLIC_IP>:/home/ec2-user/knowledge-base.json
```

### 7.2 Run ingestion

On the **EC2 instance**:
```bash
docker run --rm \
  --network heritedge \
  -v /home/ec2-user/knowledge-base.json:/src/content/knowledge-base.json \
  -e GITHUB_TOKEN=<GITHUB_TOKEN> \
  -e CHROMA_URL=http://chroma:8000 \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest \
  node dist/scripts/ingest-kb.js
```

The ingestion container joins the same `heritedge` network as the running Chroma container, so `http://chroma:8000` resolves correctly.

Successful output looks like:
```
🚀 Starting knowledge base ingestion...
✓ Chroma URL: http://chroma:8000
✓ Embedding model: OpenAI text-embedding-3-small
📖 Loaded knowledge base v...
⏳ Creating embeddings...
✓ Created X embeddings
✓ Upsert complete
🎉 Knowledge base successfully ingested into Chroma!
```

The ingestion script is idempotent — safe to run multiple times. Re-run it whenever `knowledge-base.json` changes.

> **Note on the mount path:** The ingestion script resolves the knowledge base path to `/src/content/knowledge-base.json` inside the container (not `/app/src/content/`). The `-v` flag above mounts to that exact path.

---

## Step 8 — Verify the deployment

First, smoke-test the API path on its own:

```cmd
curl https://<CLOUDFRONT_DOMAIN>/api/health
```
This should return `{"ok":true}`. If it fails, the problem is in the API / CloudFront wiring (Steps 2–5), not the frontend.

Then open `https://<CLOUDFRONT_DOMAIN>` in a browser.

To confirm the full stack is working:
1. Open browser dev tools → **Network tab**
2. Send a message in the chat
3. Confirm the request goes to `https://<CLOUDFRONT_DOMAIN>/api/chat` (not `localhost`)
4. Confirm the response is a 200 with an answer
5. Confirm the answer cites knowledge-base sources. If answers come back but with no sources, the API cannot reach Chroma — recheck `CHROMA_URL` and the `heritedge` network in Step 3, and that ingestion (Step 7) succeeded.

---

## Updating the deployment

### When API code changes

On your **local machine**:
```cmd
cd <project-root>\Website\apps\api
docker build --platform linux/amd64 -t heritedge-api .
docker tag heritedge-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
```

On the **EC2 instance**:
```bash
docker pull <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
docker stop heritedge-api && docker rm heritedge-api
docker run -d --name heritedge-api \
  --network heritedge \
  --restart unless-stopped \
  -p 3001:3001 \
  -e GITHUB_TOKEN=<GITHUB_TOKEN> \
  -e CHROMA_URL=http://chroma:8000 \
  -e WEB_ORIGIN=https://<CLOUDFRONT_DOMAIN> \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/heritedge-api:latest
```

### When frontend code changes

On your **local machine**:
```cmd
set VITE_API_URL=https://<CLOUDFRONT_DOMAIN>/api
npm run build --prefix Website
aws s3 sync Website/dist s3://heritedge-demo --delete
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> --paths "/*"
```

---

## Cost summary (free tier)

| Service | Free allowance | Usage |
|---|---|---|
| EC2 t3.micro | 750 hrs/month for 12 months | One always-on instance |
| EBS (8 GB) | 30 GB/month for 12 months | Instance root volume + Docker volumes |
| ECR | 50 GB storage/month (always free) | ~200 MB image |
| S3 | 5 GB storage, 20K GET requests/month for 12 months | Frontend static assets |
| CloudFront | 1 TB transfer + 10M requests/month (always free) | Frontend + API proxy |
| Elastic IP | No extra charge while associated with a running instance | One address pinned to the instance |
| ALB | 750 hrs/month for 12 months | Not used — CloudFront proxies to EC2 directly |

**Total cost: $0** within the 12-month free tier window.

---

## Security note

The `GITHUB_TOKEN` used as the LLM API key is passed as a plain environment variable in these instructions for simplicity. For any deployment beyond a short-lived demo, rotate the token after use and consider storing secrets in AWS Secrets Manager instead.
