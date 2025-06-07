require("dotenv").config()

const cookieConfig = {
    domain : process.env.COOKIE_DOMAIN,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "Lax" : "true",
}

module.exports = cookieConfig