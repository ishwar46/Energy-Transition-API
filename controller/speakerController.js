const Speaker = require("../models/speaker");
const upload = require("../middleware/uploads");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { sendEmail } = require("../middleware/sendEmail");
const handlebars = require("handlebars");


function generateRandomPassword(length = 6) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    console.log(password)
    return password;
}

// Caching the email template in memory
let templateSource = fs.readFileSync("speakertemplate.html", "utf-8").toString();
const emailTemplate = handlebars.compile(templateSource);

// const createSpeaker = async (req, res) => {
//     try {
//         console.log(req.body, req.file);
//         upload(req, res, async (err) => {
//             if (err) {
//                 return res.status(400).send({
//                     success: false,
//                     message: "Error uploading image.",
//                     error: err.message,
//                 });
//             }

//             const { fullName, institution, designation, email, biography, session, sessionTime, session2, sessionTime2 } = req.body;
//             if (!fullName || !institution || !designation || !biography || !session || !sessionTime) {
//                 return res.status(400).send({
//                     success: false,
//                     message: "All fields are required.",
//                 });
//             }

//             // Check if the email already exists
//             const existingSpeaker = await Speaker.findOne({ email });
//             if (existingSpeaker) {
//                 // Delete the uploaded image if the email already exists
//                 if (req.file) {
//                     fs.unlinkSync(req.file.path);
//                 }
//                 return res.status(400).send({
//                     success: false,
//                     message: "A speaker with this email already exists. Image not saved.",
//                 });
//             }

//             // Hash the static password
//             const randomPassword = generateRandomPassword();
//             const hashedPassword = await bcrypt.hash(randomPassword, 8);

//             const newSpeaker = new Speaker({
//                 fullName,
//                 institution,
//                 designation,
//                 email,
//                 password: hashedPassword,
//                 image: req.file ? req.file.path : null,
//                 session,
//                 sessionTime,
//                 session2,
//                 sessionTime2,
//                 biography,
//                 isSpeaker: true,
//             });
//             await newSpeaker.save();

//             const htmlToSend = emailTemplate({
//                 email: newSpeaker.email,
//                 password: randomPassword,
//             });

//             // Send the email asynchronously after responding to the user
//             res.status(200).json({
//                 success: true,
//                 message: "Volunteer Registered. You will receive a confirmation email soon."
//             });

//             sendEmail({
//                 subject: "Volunteer Registration Success - 36th ACSIC Conference Kathmandu, Nepal",
//                 html: htmlToSend,
//                 to: newSpeaker.email,
//             }).catch(emailError => {
//                 console.error(`Failed to send email: ${emailError.message}`);
//             });

//             return res.status(200).send({
//                 success: true,
//                 message: "Speaker registered successfully",
//                 speaker: newSpeaker,
//             });

//         });
//     } catch (error) {
//         console.error("Error creating speaker:", error);
//         res.status(500).send({
//             success: false,
//             message: "An error occurred while processing your request.",
//         });
//     }
// };

const createSpeaker = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: "Error uploading image.",
                    error: err.message,
                });
            }

            const { fullName, institution, designation, email, biography, session, sessionTime, session2, sessionTime2 } = req.body;

            // Check required fields
            if (!fullName || !institution || !designation || !biography || !session || !sessionTime) {
                if (req.file) {
                    fs.unlinkSync(req.file.path); // Cleanup uploaded file if validation fails
                }
                return res.status(400).json({
                    success: false,
                    message: "All fields are required.",
                });
            }

            // Check if the email already exists
            const existingSpeaker = await Speaker.findOne({ email });
            if (existingSpeaker) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: "A speaker with this email already exists. Image not saved.",
                });
            }

            // Generate a random password and hash it
            const randomPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(randomPassword, 8);

            // Create a new speaker
            const newSpeaker = new Speaker({
                fullName,
                institution,
                designation,
                email,
                password: hashedPassword,
                image: req.file ? req.file.path : null,
                session,
                sessionTime,
                session2,
                sessionTime2,
                biography,
                isSpeaker: true,
            });
            await newSpeaker.save();

            const replacements = {
                fullName: newSpeaker.fullName,
                email: newSpeaker.email,
                password: randomPassword,
            };

            const htmlToSend = emailTemplate(replacements);

            res.status(200).json({
                success: true,
                message: "Speaker registered successfully",
                speaker: newSpeaker,
            });

            // Send email asynchronously after responding
            sendEmail({
                subject: "Speaker Registration Success - 36th ACSIC Conference Kathmandu, Nepal",
                html: htmlToSend,
                to: newSpeaker.email,
            }).catch((emailError) => {
                console.error(`Failed to send email: ${emailError.message}`);
            });

        });
    } catch (error) {
        console.error("Error creating speaker:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const loginSpeaker = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: "Email and password are required.",
            });
        }

        const speaker = await Speaker.findOne({ email });
        if (!speaker) {
            return res.status(400).send({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isMatch = await bcrypt.compare(password, speaker.password);
        if (!isMatch) {
            return res.status(400).send({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = jwt.sign({ id: speaker._id, isSpeaker: true },
            process.env.JWT_SECRET, {
            expiresIn: "7 days",
        }
        );

        res.status(200).send({
            success: true,
            message: "Login successful",
            token,
            speaker,
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const getSpeakerById = async (req, res) => {
    try {
        const { id } = req.params;
        const speaker = await Speaker.findById(id);
        if (!speaker) {
            return res
                .status(404)
                .send({ success: false, message: "Speaker not found." });
        }
        res.status(200).send({ success: true, speaker });
    } catch (error) {
        console.error("Error fetching speaker by ID:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const getAllSpeakers = async (req, res) => {
    try {
        const speakers = await Speaker.find();
        res.status(200).send({ success: true, speakers });
    } catch (error) {
        console.error("Error fetching all speakers:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const deleteSpeakerById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSpeaker = await Speaker.findByIdAndDelete(id);
        if (!deletedSpeaker) {
            return res
                .status(404)
                .send({ success: false, message: "Speaker not found." });
        }

        // Remove image file from upload folder if it exists
        if (deletedSpeaker.image) {
            fs.unlinkSync(deletedSpeaker.image);
        }

        res.status(200).send({
            success: true,
            message: "Speaker deleted successfully",
            speaker: deletedSpeaker,
        });
    } catch (error) {
        console.error("Error deleting speaker by ID:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const updateSpeakerById = async (req, res) => {
    try {
        // Assuming `upload` is set up to handle multiple files
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: "Error uploading file.",
                    error: err.message,
                });
            }

            const speakerId = req.params.id;
            const speaker = await Speaker.findById(speakerId);

            if (!speaker) {
                return res.status(404).json({
                    success: false,
                    message: "Speaker not found",
                });
            }

            if (req.file && req.file.image) {
                const oldImagePath = path.resolve(speaker.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
                const speakerImages = req.file.image[0].path.replace(/\\/g, "/");
                speaker.image = speakerImages;
            } else {
                speaker.image = speaker.image || null;
            }

            const { fullName, institution, designation, email, biography, session, sessionTime, session2, sessionTime2 } = req.body;

            speaker.fullName = fullName || speaker.fullName;
            speaker.institution = institution || speaker.institution;
            speaker.designation = designation || speaker.designation;
            speaker.email = email || speaker.email;
            speaker.biography = biography || speaker.biography;
            speaker.session = session || speaker.session;
            speaker.sessionTime = sessionTime || speaker.sessionTime;
            speaker.session2 = session2 || speaker.session2;
            speaker.sessionTime2 = sessionTime2 || speaker.sessionTime2;

            const updatedSpeaker = await speaker.save();

            return res.status(200).json({
                success: true,
                message: "Speaker updated successfully.",
                data: updatedSpeaker,
            });
        });
    } catch (error) {
        console.error("Error updating speaker by ID:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the speaker.",
        });
    }
};


module.exports = {
    createSpeaker,
    getSpeakerById,
    getAllSpeakers,
    deleteSpeakerById,
    updateSpeakerById,
    loginSpeaker,
};