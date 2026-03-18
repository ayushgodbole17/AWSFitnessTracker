# GD Fitness Tracker

A full-stack fitness tracking web application built with React and a serverless AWS backend. The project was built to explore and integrate multiple AWS services into a production-style application.

Live at: [CloudFront distribution]

---

## Features

**Authentication**
- User registration with email verification via AWS Cognito
- Secure sign-in and sign-out with access token storage
- Password validation enforcing strength requirements

**Workout Logging**
- Create, edit, and delete workouts
- Log exercises by muscle group with sets, reps, weight, and weight type
- Support for assisted machine exercises (weight stored as negative to distinguish from loaded exercises)
- In-progress workout state persisted to localStorage so data is not lost on page refresh

**Workout History**
- View all past workouts sorted by date
- Expandable entries to inspect individual exercises
- Inline edit and delete actions

**Analytics**
- Per-exercise progression charts using Chart.js (dual-axis: total volume and max weight over time)
- Percentage change metrics comparing latest session to the previous session and to the first recorded session
- Handles assisted-to-weighted transitions in progression calculations
- AI-powered workout summary via the Analyze with AI button

**AI Chatbot**
- Fixed chat widget accessible from any tab
- Sends workout history alongside each message for context-aware responses
- Fitness topic filtering on the backend

---

## Architecture

```
Browser (React SPA)
    |
    |-- Auth ---------> AWS Cognito
    |
    |-- API calls ----> AWS API Gateway --> AWS Lambda (Node.js)
                                                |
                                                |-- Workouts --> AWS DynamoDB
                                                |-- Chatbot  --> OpenAI GPT-3.5
```

**Frontend** is built with React, bundled, and deployed to an S3 bucket served through a CloudFront distribution.

**Backend** is fully serverless. Each route (save, update, delete, get workouts, chatbot) is an independent Lambda function behind API Gateway.

**Monitoring** is handled through CloudWatch logs attached to each Lambda.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Chart.js, Axios |
| Auth | AWS Cognito |
| API | AWS API Gateway |
| Compute | AWS Lambda (Node.js) |
| Database | AWS DynamoDB |
| Storage | AWS S3 |
| CDN / Hosting | AWS CloudFront |
| Monitoring | AWS CloudWatch |
| AI | OpenAI GPT-3.5 API |

---

## Planned

- Username-based login (currently email only)
- Workout recommendation engine using ML
- Custom domain via Route 53
