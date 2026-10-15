# E-Commerce Website Backend

A Node.js and Express-based backend for an e-commerce platform. This project demonstrates building a scalable REST API with authentication, database management, file uploads, and modern development practices.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Authentication**: Secure authentication using JWT and bcrypt password hashing
- **Database Management**: MongoDB with Mongoose ODM
- **File Uploads**: Image upload and management with Cloudinary integration
- **Pagination**: Efficient data pagination using mongoose-aggregate-paginate
- **CORS Support**: Cross-Origin Resource Sharing for frontend communication
- **Session Management**: Cookie-based session handling
- **Security**: Password encryption, JWT tokens, and environment variable management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose 9.2.1
- **Authentication**: 
  - JWT (jsonwebtoken) 9.0.3
  - bcrypt 6.0.0
- **File Handling**:
  - Multer 2.0.2 (file uploads)
  - Cloudinary 2.9.0 (cloud storage)
- **HTTP Client**: Axios 1.14.0
- **Middleware**:
  - CORS 2.8.6
  - Cookie Parser 1.4.7
- **Development Tools**:
  - Nodemon 3.1.14 (auto-reload)
  - Prettier 3.8.1 (code formatting)
- **Language**: JavaScript (ES Modules)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud - MongoDB Atlas)
- Cloudinary account (for image storage)

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/basantbansal/Ecommerce_website_backend.git
   cd Ecommerce_website_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🔧 Environment Setup

Create a `.env` file in the `backend/` directory based on `.env.sample`.

### 1. Mandatory Startup Configuration
The backend **will not start** without a reachable MongoDB instance:
- `MONGODB_URI`: Connection string (e.g., `mongodb://localhost:27017` or MongoDB Atlas URI).
- `PORT`: Port for the API server (default: `8000`).
- `NODE_ENV`: Set to `development` or `production`.

### 2. Core Authentication & Security
Required for user registration, login, and protected routes:
- `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`: Random secret strings for JWT signing.
- `ACCESS_TOKEN_EXPIRY` (e.g. `1d`) / `REFRESH_TOKEN_EXPIRY` (e.g. `7d`).
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key for bot verification on login/register.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID (only needed for Google login).

### 3. Optional Integrations
Only needed when the corresponding feature is used:
- **Cloudinary** (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`): User avatars and product images.
- **Razorpay** (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`): Checkout and payment orders.
- **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`): Email verification and password resets. In development, email errors are logged non-blockingly to the console.
- **AI Agent** (`ANTHROPIC_AUTH_TOKEN`, `GOOGLE_API_KEY`): Connects to local OmniRoute assistant.

## ▶️ Running the Application

From the monorepo root:
```bash
npm --prefix backend run dev    # Development mode with Nodemon
npm --prefix backend start      # Production start (node src/index.js)
```

Or from within the `backend/` folder:
```bash
npm run dev
npm start
```

## 📁 Project Structure

```
Ecommerce_website_backend/
├── src/
│   ├── index.js           # Entry point - initializes DB and server
│   ├── app.js             # Express app configuration
│   ├── db/                # Database connection
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── models/            # Mongoose schemas
│   ├── middlewares/       # Custom middleware
│   └── utils/             # Utility functions
├── .env                   # Environment variables
├── package.json           # Project metadata and dependencies
└── README.md              # This file
```

## 📚 Dependencies

### Production Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **cloudinary**: Cloud image storage
- **multer**: File upload handling
- **axios**: HTTP client
- **cors**: Cross-origin resource sharing
- **cookie-parser**: Cookie parsing middleware
- **dotenv**: Environment variable management
- **mongoose-aggregate-paginate-v2**: Pagination support

### Development Dependencies
- **nodemon**: Auto-reload development server
- **prettier**: Code formatter

## 🔌 API Endpoints

*(Add your specific endpoints here)*

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

*Note: Adjust these endpoints based on your actual API implementation.*

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License. See the `package.json` file for more details.

---

**Happy Coding! 🚀**

For issues or questions, please open an issue on the [GitHub repository](https://github.com/basantbansal/Ecommerce_website_backend).
