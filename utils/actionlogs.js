const prisma = require("../prisma/client");

exports.logUserAction = async (userId, action,email="") => {
  try {
    await prisma.userActionLog.create({
      data: {
        userId,
        action,
        email
      },
    });
  } catch (error) {
    console.error("Error logging user action:", error);
  }
};




