# 🛒 E-Commerce Website (Full Stack)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

A modern, full-stack E-Commerce web application built with the MERN stack (MongoDB, Express.js, React, Node.js). 

## 🌟 Features

- **User Authentication**: Secure signup and login with JWT and bcrypt.
- **Product Management**: View, search, and manage products.
- **Shopping Cart**: Add, update, and remove items from the cart.
- **Secure Checkout**: Payment integration with Razorpay.
- **Email Notifications**: Powered by Resend for email verification and password resets.
- **Image Uploads**: Cloudinary integration for user avatars and product images.
- **Role-Based Access**: Distinguishes between standard customers and sellers.

## 🚀 Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- GSAP & Spline for animations
- Axios for API requests
- React Router DOM

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication
- Cloudinary & Multer for file uploads
- Razorpay for payments
- Resend for transactional emails

## 📂 Project Structure

This repository is a monorepo containing both the frontend and backend:

- [`/backend`](./backend/): The Node.js/Express API.
- [`/frontend`](./frontend/): The React web application.

## 🛠️ Getting Started

### Prerequisites
- Node.js installed on your machine
- MongoDB account/URI
- Cloudinary, Razorpay, and Resend API keys

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/basantbansal/Ecommerce_website.git
   cd Ecommerce_website
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `backend` directory based on `.env.sample` and add your API keys.*
   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```
   *Create a `.env` file in the `frontend` directory if needed (for API URLs).*
   ```bash
   npm start
   ```

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).
