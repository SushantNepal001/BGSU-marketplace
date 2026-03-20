# 🦅 Falcon Marketplace - Backend API Documentation

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## 📌 Project Overview

**Falcon Marketplace** is a BGSU-exclusive student marketplace built with Node.js, Express, and MongoDB. Students can buy and sell items through a clean REST API with validation for BGSU email addresses.

### Features

✅ RESTful API for listings management  
✅ BGSU email validation (@bgsu.edu)  
✅ Category-based filtering (Books, Furniture, Electronics, Housing, Misc)  
✅ Secure error handling  
✅ CORS enabled for frontend integration  
✅ Mongoose schema validation  
✅ Indexed queries for performance

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Security**: Helmet.js, CORS
- **Environment**: dotenv
- **Dev Tools**: Nodemon

---

## 🚀 Setup Instructions

### 1. Clone or Navigate to Project

```bash
cd server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
MONGO_URI=mongodb://localhost:27017/falcon-marketplace
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Windows with MongoDB installed
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 5. Run the Server

**Development** (with auto-reload):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

The server will start on `http://localhost:5000`

---

## 💾 Database Schema

### Listing Model

```javascript
{
  _id: ObjectId,
  title: String (required, 3-100 chars),
  description: String (max 1000 chars),
  price: Number (required, minimum 0),
  category: String (enum: Books, Furniture, Electronics, Housing, Misc),
  imageUrl: String (optional),
  userEmail: String (required, must match @bgsu.edu),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-updated)
}
```

**Indexes**:

- `userEmail` - Fast filtering by user
- `category` - Fast category filtering
- `createdAt` (descending) - Newest first sorting

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Health Check

```http
GET /health
```

**Response**:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

### GET All Listings

```http
GET /api/listings
```

**Query Parameters**:

- `category` (optional): Filter by category
- `userEmail` (optional): Filter by seller email
- `sort` (optional, default: `-createdAt`): Sorting field

**Example**:

```http
GET /api/listings?category=Electronics&sort=-price
GET /api/listings?userEmail=student@bgsu.edu
```

**Response**:

```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439011",
      "title": "Used Calculus Textbook",
      "description": "Great condition, barely used",
      "price": 45,
      "category": "Books",
      "imageUrl": null,
      "userEmail": "student@bgsu.edu",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ]
}
```

---

### GET Single Listing

```http
GET /api/listings/:id
```

**Example**:

```http
GET /api/listings/607f1f77bcf86cd799439011
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439011",
    "title": "Used Calculus Textbook",
    "description": "Great condition, barely used",
    "price": 45,
    "category": "Books",
    "imageUrl": null,
    "userEmail": "student@bgsu.edu",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

---

### CREATE New Listing

```http
POST /api/listings
Content-Type: application/json
```

**Required Fields**:

- `title` (String, 3-100 characters)
- `price` (Number, minimum 0)
- `category` (String, must be one of: Books, Furniture, Electronics, Housing, Misc)
- `userEmail` (String, must end with @bgsu.edu)

**Optional Fields**:

- `description` (String, max 1000 characters)
- `imageUrl` (String)

**Request Body**:

```json
{
  "title": "WiFi Router",
  "description": "TP-Link Archer A7, great condition",
  "price": 35,
  "category": "Electronics",
  "imageUrl": "https://example.com/router.jpg",
  "userEmail": "john.doe@bgsu.edu"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "title": "WiFi Router",
    "description": "TP-Link Archer A7, great condition",
    "price": 35,
    "category": "Electronics",
    "imageUrl": "https://example.com/router.jpg",
    "userEmail": "john.doe@bgsu.edu",
    "createdAt": "2024-01-15T10:35:20.456Z",
    "updatedAt": "2024-01-15T10:35:20.456Z"
  }
}
```

---

### UPDATE a Listing

```http
PUT /api/listings/:id
Content-Type: application/json
```

**Optional Fields** (any of these):

- `title`
- `description`
- `price`
- `category`
- `imageUrl`

**Request Body**:

```json
{
  "price": 30,
  "description": "Slight wear on the antenna, still works great"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "title": "WiFi Router",
    "description": "Slight wear on the antenna, still works great",
    "price": 30,
    "category": "Electronics",
    "imageUrl": "https://example.com/router.jpg",
    "userEmail": "john.doe@bgsu.edu",
    "createdAt": "2024-01-15T10:35:20.456Z",
    "updatedAt": "2024-01-15T10:40:15.789Z"
  }
}
```

---

### DELETE a Listing

```http
DELETE /api/listings/:id
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Listing deleted successfully",
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "title": "WiFi Router",
    "description": "Slight wear on the antenna, still works great",
    "price": 30,
    "category": "Electronics",
    "imageUrl": "https://example.com/router.jpg",
    "userEmail": "john.doe@bgsu.edu",
    "createdAt": "2024-01-15T10:35:20.456Z",
    "updatedAt": "2024-01-15T10:40:15.789Z"
  }
}
```

---

## ⚠️ Error Handling

All errors follow a consistent JSON response format:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Email must be a valid BGSU email address (ending with @bgsu.edu)"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Listing not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

### Common Error Scenarios

| Status | Scenario                 | Message                                                      |
| ------ | ------------------------ | ------------------------------------------------------------ |
| 400    | Missing required fields  | `Missing required fields: title, price, category, userEmail` |
| 400    | Invalid email format     | `Email must be a valid BGSU email address (@bgsu.edu)`       |
| 400    | MongoDB validation error | Returns array of validation messages                         |
| 404    | Listing not found        | `Listing not found`                                          |
| 500    | Server error             | `Internal Server Error`                                      |

---

## 📝 Usage Examples

### Using cURL

**Get all listings**:

```bash
curl http://localhost:5000/api/listings
```

**Get listings by category**:

```bash
curl "http://localhost:5000/api/listings?category=Electronics"
```

**Create a listing**:

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Desk Lamp",
    "description": "LED desk lamp, never used",
    "price": 25,
    "category": "Furniture",
    "userEmail": "jane@bgsu.edu"
  }'
```

**Update a listing**:

```bash
curl -X PUT http://localhost:5000/api/listings/607f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 20
  }'
```

**Delete a listing**:

```bash
curl -X DELETE http://localhost:5000/api/listings/607f1f77bcf86cd799439011
```

### Using Fetch (JavaScript/React)

**Get all listings**:

```javascript
fetch("http://localhost:5000/api/listings")
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

**Create a listing**:

```javascript
const newListing = {
  title: "College Backpack",
  description: "North Face backpack, like new",
  price: 60,
  category: "Misc",
  userEmail: "student@bgsu.edu",
};

fetch("http://localhost:5000/api/listings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newListing),
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

---

## 🔐 Security Features

✅ **Helmet.js**: Protects against common HTTP header vulnerabilities  
✅ **CORS**: Configured to accept requests from authorized frontend  
✅ **Email Validation**: All emails must end with @bgsu.edu  
✅ **Input Sanitization**: Mongoose schema validation  
✅ **Error Masking**: Production errors don't expose sensitive info

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                    # MongoDB connection
├── models/
│   └── Listing.js               # Mongoose schema
├── middleware/
│   ├── errorHandler.js          # Error handling
│   └── validateEmail.js         # BGSU email validation
├── routes/
│   └── listings.js              # API endpoints
├── server.js                    # Main server file
├── package.json                 # Dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

---

## 🚦 Getting Started Checklist

- [ ] Install Node.js (v14+)
- [ ] Install MongoDB
- [ ] Clone/navigate to project
- [ ] Run `npm install`
- [ ] Create `.env` file from `.env.example`
- [ ] Start MongoDB service
- [ ] Run `npm run dev`
- [ ] Test health check: `http://localhost:5000/health`
- [ ] Create first listing using POST endpoint
- [ ] Test client frontend integration

---

## 💡 Tips & Best Practices

1. **Always validate email** - Only @bgsu.edu addresses are allowed
2. **Handle prices carefully** - Only positive numbers, max 999,999
3. **Category enforcement** - Use exact enum values
4. **Timestamps** - createdAt is set automatically, don't send it
5. **Error handling** - Always check the `success` field in responses
6. **Database indexing** - Queries are optimized with proper indexes

---

## 🐛 Troubleshooting

**MongoDB Connection Error**:

- Ensure MongoDB is running
- Check MONGO_URI in .env is correct
- Try: `mongodb://localhost:27017/falcon-marketplace`

**Port Already in Use**:

- Change PORT in .env to another value (e.g., 5001)
- Or kill the process using port 5000

**CORS Error**:

- Update CLIENT_URL in .env to match your frontend URL
- Ensure frontend is running on specified port

---

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Built with ❤️ for the BGSU Community**
