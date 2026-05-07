# Docker Desktop Deployment Guide for Issue Tracker Webapp

This guide explains what Docker is, how it compares with Vercel, and how to run this project in Docker Desktop on Linux Mint Cinnamon as a beginner.

## 1. What Docker Is

Docker is a tool that packages an application and everything it needs into a container.

A container includes:

- the app code
- the runtime version
- system libraries
- environment configuration
- startup commands

That means the app behaves the same way on your laptop, on another computer, or on a server, as long as Docker can run there.

## 2. Why Use Docker

Docker is useful when you want to:

- run the same app consistently on different machines
- avoid "it works on my machine" problems
- bundle app and dependencies together
- deploy a Next.js app with a database-backed backend in a predictable way
- make local development and production closer to each other

## 3. Pros And Cons

### Pros

- Consistent environment across machines
- Easy to share and reproduce
- Good for self-hosting
- Works well with databases, background jobs, and custom servers
- You control the runtime and deployment style

### Cons

- More setup than Vercel
- You must manage environment variables, ports, and databases yourself
- You also need to manage updates, logs, and restarts
- Disk and memory usage can be heavier than a simple hosted platform
- For beginners, container concepts can feel confusing at first

## 4. Docker Desktop Vs Vercel

Docker Desktop and Vercel solve different problems.

### Docker Desktop

- Runs containers on your own machine
- Useful for local testing and self-hosting
- Gives you full control over the runtime
- You are responsible for setup and maintenance

### Vercel

- A managed hosting platform
- Very easy for Next.js apps
- Handles deploys, scaling, and much of the infrastructure for you
- Less control over the runtime environment

### Which Is Better?

It depends on your goal:

- Choose Vercel if you want the easiest deployment and do not want to manage infrastructure.
- Choose Docker if you want more control, want to self-host, or want an environment you can run anywhere.
- For a beginner, Vercel is usually simpler.
- For learning and long-term flexibility, Docker is often better.

## 5. What You Need Before Starting

Before deploying this app in Docker Desktop, make sure you have:

- Linux Mint Cinnamon installed
- Administrator access on your machine
- Internet access
- The project files cloned on your computer
- A PostgreSQL database available
- Environment variables ready in a `.env` file

This project uses:

- Next.js 15
- Prisma 7
- PostgreSQL
- Better Auth

So you will need a database connection string and auth secrets.

## 6. Important Notes For This Project

This repository does not currently include a Dockerfile or Docker Compose file.

That means Docker cannot build the app yet until you add a container definition.

The steps below show both:

- how to install Docker Desktop on Linux Mint Cinnamon
- how to create a Dockerfile for this app
- how to build and run the app in Docker Desktop

## 7. Step-By-Step Guide On Linux Mint Cinnamon

### Step 1: Update Your System

Open Terminal and run:

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Docker Desktop Prerequisites

Docker Desktop on Linux usually needs support for virtualization and the Docker engine underneath.

Install common dependencies:

```bash
sudo apt install -y ca-certificates curl gnupg
```

### Step 3: Install Docker Engine

On Linux, Docker Desktop often works best when Docker Engine is already installed.

Follow Docker's Linux installation instructions for your distro, or install Docker Engine from the official Docker repository.

A common setup flow is:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

Then add the Docker apt repository that matches Ubuntu-based Linux Mint packages.

If you are not sure, Linux Mint Cinnamon usually follows Ubuntu package compatibility.

### Step 4: Install Docker Desktop

Download the `.deb` package from Docker’s official website and install it.

Example:

```bash
sudo apt install ./docker-desktop-<version>-amd64.deb
```

After installation, start Docker Desktop from the app menu.

### Step 5: Verify Docker Is Running

Run:

```bash
docker --version
docker compose version
```

If those commands work, Docker is installed correctly.

### Step 6: Create A Dockerfile For This App

Because this repo does not have one yet, create a file named `Dockerfile` in the project root with this content:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/components ./components
COPY --from=builder /app/app ./app

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Step 7: Create A `.dockerignore`

Create a `.dockerignore` file in the project root:

```dockerignore
node_modules
.next
.git
npm-debug.log
Dockerfile
.dockerignore
.env
```

### Step 8: Prepare Environment Variables

Create a `.env` file with the values your app needs.

Common variables for this project include:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
```

If you use blob storage or other integrations, add those variables too.

Important:

- `BETTER_AUTH_URL` should point to the address where the app is actually opened.
- `BETTER_AUTH_SECRET` must be a strong secret.
- `DATABASE_URL` must point to a reachable PostgreSQL database.

### Step 9: Build The Docker Image

From the project root, run:

```bash
docker build -t issue-tracker-webapp .
```

### Step 10: Run The Container

Start the app:

```bash
docker run --rm -p 3000:3000 --env-file .env issue-tracker-webapp
```

Then open:

```text
http://localhost:3000
```

### Step 11: Run Prisma Database Commands If Needed

If your schema changed, you may need to apply it to the database.

From your local machine or inside a helper container, run:

```bash
npx prisma db push
```

If you want to run this inside Docker, you can create a separate one-off command:

```bash
docker run --rm --env-file .env issue-tracker-webapp npx prisma db push
```

### Step 12: Check The App

After the container starts, verify:

- the homepage loads
- login works
- database features work
- uploads and notifications work if configured

If something fails, check the container logs:

```bash
docker logs <container_id>
```

## 8. Recommended Docker Compose Setup

For beginners, Docker Compose is often easier than plain `docker run` because it can manage the web app and PostgreSQL together.

A simple `docker-compose.yml` could look like this:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: issue_tracker
      POSTGRES_PASSWORD: issue_tracker_password
      POSTGRES_DB: issue_tracker_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

If you use Compose, update `DATABASE_URL` in `.env` to point to the `db` service:

```env
DATABASE_URL=postgresql://issue_tracker:issue_tracker_password@db:5432/issue_tracker_db
```

Then start everything with:

```bash
docker compose up --build
```

## 9. Common Beginner Problems

### Problem: Docker command not found

Fix:

- Install Docker Desktop or Docker Engine
- Log out and log in again
- Check that Docker is running

### Problem: App starts but database errors appear

Fix:

- Check `DATABASE_URL`
- Make sure PostgreSQL is running
- Run Prisma commands after the database is available

### Problem: Better Auth warnings or errors

Fix:

- Set `BETTER_AUTH_URL`
- Set `BETTER_AUTH_SECRET`
- Make sure the app URL matches the real host and port

### Problem: Port 3000 is already in use

Fix:

- Stop the other app using the port
- Or use another port, for example `-p 3001:3000`

## 10. My Practical Recommendation

For this app on Linux Mint Cinnamon:

- Use Docker Desktop if you want the GUI and easier container management.
- Use Docker Compose if you want to run the app and PostgreSQL together.
- Keep Vercel as the simplest cloud deployment option if you do not want to manage servers.

If you are just learning, start by getting the app running locally with Docker Compose first, then move to deployment.

## 11. Short Version

- Docker packages your app into a container.
- Vercel is easier for hosted Next.js deployments.
- Docker is better when you want control and portability.
- This project needs a Dockerfile and a PostgreSQL database.
- Set `DATABASE_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`.
- Build the image with `docker build -t issue-tracker-webapp .`.
- Run it with `docker run --rm -p 3000:3000 --env-file .env issue-tracker-webapp`.
