const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

    const decodedUser = await prisma.user.findFirst({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        isPendingUser: true,
        role: true,
        createdAt: true,
        ambassador: true,
      },
      include: {
        ambassador: true,
      },
    });

    if (!decodedUser) {
      res.clearCookie("token");
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = decodedUser;
    next();

  } catch (err) {
    res.clearCookie("token");

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: Token has expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = authenticate;
