const prisma = require("../prisma/client");
const { logUserAction } = require("../utils/actionlogs");
const {tokenGenerator} = require("../utils/tokenGenerator")
const {transporter} = require("../utils/transporter")
require("dotenv").config()
const {redis} = require("../config/redis")

exports.guestSubmitCareersForm = async (req, res) => {
  const { name, email, phone,education, background} = req.body;
  try {
    const entry = await prisma.careerGuidanceProgram.create({
      data: { name, email, phone,education, background },
    });
    await logUserAction(null, `Careers form submitted for ${email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }  
};

exports.guestSubmitStudyAbroadForm = async (req, res) => {
  const { name, email, residingCountry,countryofInterest, education,background,phone } = req.body;
  try {
    const entry = await prisma.studyAbroadProgram.create({
      data: { name, email, residingCountry,countryofInterest, education,background,phone },
    });
    await logUserAction(null, `Study abroad form submitted for ${email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};

exports.guestSubmitPlacementGuranteeForm = async (req, res) => {
  const { name, email} = req.body;
  try {
    const entry = await prisma.ambassadorForm.create({
      data: { name, email },
    });
    await logUserAction(null, `Placement gurantee Form submitted for ${email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};


exports.submitCareersForm = async (req, res) => {
  const userId = req.user.id
  const currUser = await prisma.user.findFirst({
    where : {id : userId}
  })
  if(!currUser){
    return res.statusCode(400).json({"message" : "No User Found"})
  }

  const { course, city, careerInterest } = req.body;
  try {
    const entry = await prisma.careersForm.create({
      data: { name : currUser.name, email:currUser.email, course, city, careerInterest },
    });
    await logUserAction(null, `Careers form submitted for ${email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};

exports.submitStudyAbroadForm = async (req, res) => {
  const userId = req.user.id;
  const currUser = await prisma.user.findFirst({
    where: { id: userId }
  });

  if (!currUser) {
    return res.status(400).json({ message: "No User Found" });
  }

  const { countryOfInterest, academicBackground } = req.body;
  try {
    const entry = await prisma.studyAbroadForm.create({
      data: {
        name: currUser.name,
        email: currUser.email,
        countryOfInterest,
        academicBackground
      }
    });
    await logUserAction(null, `Study abroad form submitted for ${currUser.email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};

exports.submitPlacementGuranteeForm = async (req, res) => {
  const userId = req.user.id;
  const currUser = await prisma.user.findFirst({
    where: { id: userId }
  });

  if (!currUser) {
    return res.status(400).json({ message: "No User Found" });
  }
  try {
    const entry = await prisma.placementguaranteeprogram.create({
      data: {
        name: currUser.name,
        email: currUser.email
      }
    });
    await logUserAction(null, `PlacementGurantee Form submitted for ${currUser.email}`);
    res.status(201).json({ message: "Submitted successfully", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};


// const { sendEmail } = require('../utils/email'); // Adjust path to your email utility
// const crypto = require('crypto');

exports.subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  try {
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: { email },
    });

    // Generate token for unsubscribe link
    const token = tokenGenerator(64);

    // Save token temporarily in Redis (15 minutes)
    await redis.set(`newsletter:${email}`, token, "EX", 15 * 60);

    // Generate unsubscribe form HTML
    const unsubscribeForm = `
      <form action="${process.env.BASE_URL}/api/forms/newsletter-unsubscribe" method="POST">
        <input type="hidden" name="email" value="${email}" />
        <input type="hidden" name="token" value="${token}" />
        <button type="submit" style="
          background-color: #f44336;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        ">
          Unsubscribe
        </button>
      </form>
    `;

    // Log action
    await logUserAction(null, `Newsletter subscription for ${email}`, email);

    // Send welcome email
    await transporter.sendEmail({
      to: email,
      subject: "Welcome to our Newsletter!",
      html: `
        <h3>Thanks for subscribing!</h3>
        <p>You’ve successfully subscribed to our newsletter.</p>
        <p>If you ever change your mind, click below to unsubscribe:</p>
        ${unsubscribeForm}
      `,
    });

    res.status(201).json({ message: "Subscribed successfully", subscription });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed" });
  }
};


exports.unSubscribeNewsletter = async (req, res) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).json({ error: "Missing email or token" });
  }

  try {
    // Validate token from Redis
    const storedToken = await redis.get(`newsletter:${email}`);
    if (!storedToken || storedToken !== token) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Delete subscription from database
    const subscription = await prisma.newsletterSubscription.delete({
      where: { email },
    });

    // Remove token from Redis
    await redis.del(`newsletter:${email}`);

    // Log the action
    await logUserAction(null, `Newsletter unsubscribed by ${email}`, email);

    // Send unsubscription confirmation email
    await sendEmail({
      to: email,
      subject: "You've unsubscribed from AgrowingZ Newsletter",
      html: `
        <h3>Unsubscribed Successfully</h3>
        <p>Hi,</p>
        <p>You've been successfully removed from the AgrowingZ newsletter list.</p>
        <p>If this was a mistake, you can resubscribe any time on our website.</p>
        <p>Thanks,<br/>The AgrowingZ Team</p>
      `,
    });

    res.status(200).json({ message: "Unsubscribed successfully", subscription });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unsubscription failed" });
  }
};


