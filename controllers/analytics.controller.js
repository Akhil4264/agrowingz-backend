const prisma = require("../prisma/client");

exports.recordPageVisit = async (req, res) => {
  const { pageUrl, userId } = req.body;
  try {
    const visit = await prisma.pageVisit.create({
      data: {
        pageUrl,
        userId,
      },
    });
    res.status(201).json({ message: "Page visit recorded", visit });
  } catch (err) {
    console.error("Failed to record page visit", err);
    res.status(500).json({ error: "Could not record page visit" });
  }
};
