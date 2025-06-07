const prisma = require("../prisma/client");
const { logUserAction } = require("../utils/actionlogs");

exports.bookProgramSlot = async (req, res) => {
  const { userId, programId, slotTime } = req.body;

  try {
    const booking = await prisma.programBooking.create({
      data: {
        userId,
        programId,
        slotTime: new Date(slotTime),
      },
    });

    await logUserAction(userId, `Booked slot for program ${programId} with booking ID ${booking.id}`);

    res.status(201).json({ message: "Slot booked successfully", booking });
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Failed to book slot" });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        bookings: true,
      },
    });

    res.json(programs);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};