const Bus = require("../models/bus");
const User = require("../models/user");

exports.createBus = async (req, res) => {
  const { name, capacity, volunteers, busNumber, color } = req.body;

  if (!name || !capacity || !volunteers || !busNumber || !color) {
    return res.status(400).send({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const bus = new Bus({ name, capacity, volunteers, busNumber, color });
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate(
      "allocatedParticipants",
      "personalInformation.fullName"
    );
    res.status(200).json({ buses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.allocateParticipant = async (req, res) => {
  const { busId, userId, accompanyingPersonInfo } = req.body;
  // console.log(req.body)
  // console.log(accompanyingPersonInfo)

  try {
    const bus = await Bus.findById(busId);
    const user = await User.findById(userId);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const participantAlreadyAllocated = bus.allocatedParticipants.some(
      (id) => id.toString() === userId
    );

    if (participantAlreadyAllocated) {
      return res.status(400).json({ message: "Participant already allocated" });
    }

    if ((bus.allocatedParticipants.length + bus.allocatedParticipantsAccompany.length) >= bus.capacity) {
      return res.status(400).json({ message: "Maximum capacity of Wagon reached" });
    }

    bus.allocatedParticipants.push(userId);

    if (
      accompanyingPersonInfo &&
      (accompanyingPersonInfo.firstName !== "NA" ||
        accompanyingPersonInfo.middleName !== "NA" ||
        accompanyingPersonInfo.lastName !== "NA")
    ) {
      bus.allocatedParticipantsAccompany.push({
        user: userId,
        accompanyingPersonInfo: {
          firstName: accompanyingPersonInfo.firstName || "NA",
          middleName: accompanyingPersonInfo.middleName || "NA",
          lastName: accompanyingPersonInfo.lastName || "NA",
        },
      });
    }

    await bus.save();

    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deallocateParticipant = async (req, res) => {
  const { busId, userId } = req.body;

  try {
    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    bus.allocatedParticipants = bus.allocatedParticipants.filter(
      (id) => id.toString() !== userId
    );

    bus.allocatedParticipantsAccompany = bus.allocatedParticipantsAccompany.filter(
      (entry) => entry.user.toString() !== userId
    );

    await bus.save();

    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBus = async (req, res) => {
  const { busId } = req.params;

  try {
    const bus = await Bus.findByIdAndDelete(busId);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }


    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};