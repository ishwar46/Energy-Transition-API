const Agenda = require("../models/agenda");

const createAgenda = async (req, res) => {
    const {
        nameofInstitution,
        chiefDelegateName,
        chiefDelegatePosition,
        chiefDelegateEmailAddress,
        questions,
    } = req.body;
    // console.log(req.body);
    try {
        const nameOfInstitutionExist = await Agenda.findOne({
            nameofInstitution: nameofInstitution,
        });
        if (nameOfInstitutionExist) {
            return res.status(400).json({
                success: false,
                message: "This institution already exist",
            });
        }
        const newAgenda = new Agenda({
            nameofInstitution: nameofInstitution,
            chiefDelegateName: chiefDelegateName,
            chiefDelegatePosition: chiefDelegatePosition,
            chiefDelegateEmailAddress: chiefDelegateEmailAddress,
            questions: questions,
        });
        await newAgenda.save();
        return res.status(201).json({
            success: true,
            message: "Agenda Created Successfully",
            newAgenda,
        });
    } catch (error) {
        console.log(`Error is creating new Agenda is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const submitAnswer = async (req, res) => {
    const {
        nameofInstitution,
        chiefDelegateName,
        chiefDelegatePosition,
        chiefDelegateEmailAddress,
        answers,
    } = req.body;

    // console.log("Request body:", req.body);

    try {
        // Validate that answers is an array
        if (!Array.isArray(answers)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid answers format" });
        }

        const existingInstitution = await Agenda.findOne({ nameofInstitution });
        if (existingInstitution) {
            return res.status(400).json({
                success: false,
                message: "Institution name is already taken",
            });
        }

        // Create a new agenda document with the submitted answers
        const newAgenda = new Agenda({
            nameofInstitution,
            chiefDelegateName,
            chiefDelegatePosition,
            chiefDelegateEmailAddress,
            questions: answers.map((answer) => ({
                question: answer.question,
                description: answer.description,
                userAnswer: answer.userAnswer,
                options: answer.options,
                disagreeReason: answer.disagreeReason,
                othersReason: answer.othersReason,
            })),
        });

        // Save the new agenda document to the database
        await newAgenda.save();

        return res.status(201).json({
            success: true,
            message: "Agenda answer submitted successfully",
        });
    } catch (error) {
        console.log(`Error in submitAnswer agenda: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const getOneAgenda = async (req, res) => {
    try {
        const firstAgenda = await Agenda.findOne().sort({ _id: 1 });

        if (!firstAgenda) {
            return res.status(404).json({
                success: false,
                message: "No Agenda found",
            });
        }

        // console.log(firstAgenda);
        return res.status(200).json({
            success: true,
            agenda: firstAgenda,
            message: "First Agenda Fetched Successfully",
        });
    } catch (error) {
        console.log(`Error in get first Agenda is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const getAllAgenda = async (req, res) => {
    try {
        const showallAgenda = await Agenda.find().skip(1);
        // console.log(showallAgenda);
        return res.status(200).json({
            success: true,
            showallAgenda,
            message: "All Agenda Fetched Successfully",
        });
    } catch (error) {
        console.log(`Error in get all Agenda is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    createAgenda,
    submitAnswer,
    getAllAgenda,
    getOneAgenda,
};