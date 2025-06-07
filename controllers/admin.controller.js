const prisma = require("../prisma/client");

exports.getAllLogs = async (req, res) => {
  if(!req.user || req.user.role || req.user.role !== "admin"){
    return res.statusCode(403).json({"messgae" : "Unauthorized Access"})
  }
  const logs = await prisma.userActionLog.findMany({ include: { user: true } });
  res.json(logs);
};

exports.getAllUsers = async (req, res) => {
  if(req.user.role !== "admin"){
    return res.statusCode(403).json({"messgae" : "Unauthorized Access"})
  }
  const users = await prisma.user.findMany({ include: { actions: true, bookings: true } });
  res.json(users);
};

exports.getAllAmbassadors = async(req,res) => {
  if(req.user.role !== "admin"){
    return res.statusCode(403).json({"messgae" : "Unauthorized Access"})
  }
  const ambassadors = await prisma.ambassadors.findMany({
  where: {
    status: "Approved", 
  },
  include: {
    user: true,
  },
});  
res.json(ambassadors)
}

exports.getAllAmbassadorRequests = async(req,res) => {
  if(req.user.role !== "admin"){
    return res.statusCode(403).json({"messgae" : "Unauthorized Access"})
  }
  const ambassadors = await prisma.user.findMany({where: {
    status: "Inhold", 
  },});
  res.json(ambassadors)
}

exports.ApproveAmbassadorRequest = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized Access" });
    }

    const result = await prisma.ambassador.updateMany({
      where: {
        status: "Inhold",
      },
      data: {
        status: "Approved",
      },
    });

    res.json({ message: "Ambassadors approved", count: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to approve ambassadors" });
  }
};


exports.RejectAmbassadorRequest = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized Access" });
    }

    const result = await prisma.ambassador.updateMany({
      where: {
        status: "Inhold",
      },
      data: {
        status: "Rejected",
      },
    });

    res.json({ message: "Ambassadors Rejected", count: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to Reject ambassadors" });
  }
};

