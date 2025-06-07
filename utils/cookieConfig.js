const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "Lax", // or "Strict" depending on frontend/backend deployment
}

module.exports = cookieConfig