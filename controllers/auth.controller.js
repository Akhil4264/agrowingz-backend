const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {transporter} = require("../utils/transporter");
// const { prisma } = require("../prisma/client");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth.middleware");
const { generateOtp, tokenGenerator } = require("../utils/tokenGenerator");
const redisClient = require("../config/redis");
const prisma = new PrismaClient()
const {logUserAction} = require("../utils/actionlogs")
const {cookieConfig} = require("../utils/cookieConfig")

exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    let user = await prisma.user.findFirst({
      where: {
        email,
        role : role
      },
    });
    if (!user) {
      return res.status(400).json({ message: "Verify the Email to Register" });
    }
    if (user && user.isVerified && !user.isPendingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (user && !user.isVerified) {
      return res.status(400).json({ message: "Verify the Email to Register" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        name,
        isPendingUser: false,
        role: role,
      },
    });

    if(role === "ambassador"){
      await prisma.ambassador.create({
        data : {userId : user.id,email:email,college : req.body.college,motivation:req.body.motivation,status:"Inhold"}
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: role,
        timestamp: Date.now(),
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, cookieConfig);
    logUserAction(user.id, "register",user.email);

    res.status(200).json({ message: "Registration completed successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendOTP = async (req, res) => {
  const { email, role } = req.body;
  let currUser = await prisma.user.findFirst({
    where: { email },
  });

  if (currUser && currUser.isVerified && !currUser.isPendingUser) {
    return res.status(404).json({ error: "User already Registered" });
  }

  const otp = generateOtp(6);

  await redisClient.set(`verify:${email}_${role}`, otp, "EX", 15 * 60);

  await transporter.sendMail({
    to: email,
    subject: "Your One-Time Password (OTP) for AgrowingZ",
    html: `
    <p>Dear user,</p>
    <p>Your OTP for email verification is:</p>
    <h2>${otp}</h2>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,
  });

  if (!currUser) {
    currUser = await prisma.user.create({
      data: {
        email,
        role,
        isVerified: false,
        isPendingUser: true,
      },
    });
  } else {
    currUser = await prisma.user.update({
      where: { id: currUser.id },
      data: {
        createdAt: new Date(),
        role,
        isVerified: false,
        isPendingUser: true,
      },
    });
  }

  await logUserAction(currUser.id, "Verification Email sent",currUser.email);

  res.status(200).json({ message: `Email sent successfully to: ${email}` });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email,role, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).send("Missing email or otp");
    }
    const storedOTP = await redisClient.get(`verify:${email}_${role}`);

    if (!storedOTP) {
      return res.status(400).send("OTP Expired");
    }

    if (storedOTP !== otp) {
      return res.status(400).send("Invalid OTP");
    }

    redis.del(`verify:${email}_${role}`)
    .then(result => {
      if (result === 1) {
        console.log("Key deleted successfully");
      } else {
        console.log("Key does not exist");
      }
    })
  .catch(err => {
    console.error("Error deleting key:", err);
  });

    user = await prisma.user.update({
      where: { email },
      data: { isVerified: true, isPendingUser: true },
    });

    await logUserAction(user.id, "Verified Email");
    res.send("Email verified");
  } catch (err) {
    console.log(err)
    res.status(400).send(err);
  }
};

exports.login = async (req, res) => {
  const { email, password,role } = req.body;
  const user = await prisma.user.findUnique({
    where: { email,role, isVerified: true, isPendingUser: false },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (!user.isVerified || user.isPendingUser)
    return res.status(403).json({ error: "Email not verified" });

  const token = jwt.sign(
    {
      id: user.id,
      role: role,
      timestamp: Date.now(),
    },
    process.env.JWT_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  await logUserAction(user.id, "logged in",email);
  res.cookie("token",token,cookieConfig)
  res.status(200).json({ message: "Logged In successfully." });
};

exports.logout = async (req, res) => {
  const user = await prisma.user.findFirst({
    where : {id : req.user.id}
  })
  await logUserAction(req.user.id, "logged out",user.email);
  res.cookie.clear();
  res.json({ message: "Logged out" });
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email, isVerified: true, isPendingUser: false },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = tokenGenerator(64);
  await redisClient.set(`verify:${email}`, token, "EX", 15 * 60);

  await transporter.sendMail({
    to: email,
    subject: "Password Reset",
    html: `<a href="${process.env.BASE_URL}/api/auth/reset-password?token=${token}&email=${email}">Reset Password</a>`,
  });
  await logUserAction(user.id, "requested password reset",email);
  res.json({ message: "Password reset link sent" });
};

exports.verifyResetPassReq = async (req, res) => {
  try {
    const {email,token} = req.query
    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isVerified || user.isPendingUser) {
      return res.status(404).json({ error: "User not found or not eligible" });
    }

    const storedToken = await redisClient.get(`verify:${email}`);

    if (!storedToken) {
      return res.status(400).send("Token expired");
    }

    if (storedToken !== token) {
      return res.status(400).send("Invalid token");
    }

    res.render("resetPass.view.ejs",{email});
  } catch (err) {
    console.error("Error in verifyResetPassReq:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const {email,oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email,isPendingUser:false,isVerified:true},
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res
        .status(400)
        .json({ error: "New password must be different from old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await logUserAction(user.id, "Reset Password",email);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
