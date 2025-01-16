const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../middleware/sendEmail");
const fs = require("fs");
const handlebars = require("handlebars");
const LiveStream = require("../models/liveStream");
const Volunteer = require("../models/volunteer");
const upload = require("../middleware/multipledocs");
const nodeMail = require('nodemailer');


function generateRandomPassword(length = 6) {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Admin registration controller
// Debugging example in adminRegister function
const adminRegister = async (req, res) => {
    const { emailAddress, userPassword } = req.body;

    try {
        console.log("Registering Admin:", emailAddress, userPassword);

        // Check if admin with this email already exists
        const existingAdmin = await User.findOne({ email: emailAddress, isAdmin: true });
        console.log("Existing Admin:", existingAdmin);

        if (existingAdmin) {
            return res
                .status(400)
                .json({ error: "Admin with this email already exists." });
        }

        // Hash password and create new admin
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        console.log("Hashed Password:", hashedPassword);

        const admin = new User({
            email: emailAddress,
            password: hashedPassword,
            isAdmin: true,
        });

        await admin.save();
        console.log("Admin Registered Successfully");
        res.status(201).json({ message: "Admin registered successfully." });
    } catch (error) {
        console.error("Error during admin registration:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Admin resets the user's password
const adminResetPassword = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Generate a random password
        const randomPassword = generateRandomPassword();

        // Hash the password
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Save both the plain text and the hashed password
        user.personalInformation.userPassword = hashedPassword;
        user.personalInformation.plainTextPassword = randomPassword;

        await user.save();

        // Send email to the user with the new password
        const source = fs.readFileSync("password_reset.html", "utf-8").toString();
        const template = handlebars.compile(source);
        const replacements = {
            firstName: user.personalInformation.fullName.firstName,
            lastName: user.personalInformation.fullName.lastName,
            password: randomPassword,
        };

        const htmlToSend = template(replacements);

        await sendEmail({
            subject: "Your Password Has Been Reset",
            html: htmlToSend,
            to: user.personalInformation.emailAddress,
        });

        res
            .status(200)
            .json({ success: true, message: "Password reset successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const adminLogin = async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;

    try {
        // Find the admin by email
        const admin = await User.findOne({ email: email, isAdmin: true });
        if (!admin) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid credentials." });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id, isAdmin: admin.isAdmin },
            process.env.JWT_SECRET, { expiresIn: "7 days" }
        );

        // Admin login successful
        res.status(200).json({
            token: token,
            admin: {
                id: admin._id,
                email: admin.email,
                isAdmin: admin.isAdmin,
            },
            success: true,
            message: "Admin login successful.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const transporter = nodeMail.createTransport({
    service: "gmail",
    auth: {
        user: "energytransition.summit2025@gmail.com",
        pass: "agbd hkzd ntoj dhcg"
    }
});

const adminVerifyUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Assuming admin verification is successful and status is changed to "accepted"
        user.adminVerification.status = "accepted"; // Change the status to "accepted"
        user.isVerifiedByAdmin = true;
        await user.save();

        // Send the password only if the user is verified by admin and status is "accepted"
        // Check if the user is verified by admin and status is "accepted"
        if (
            user.isVerifiedByAdmin &&
            user.adminVerification.status === "accepted"
        ) {
    
            await user.save();

            const source = fs.readFileSync("mailtemplate.html", "utf-8").toString();
            const template = handlebars.compile(source);
            const replacements = {
                firstName: user.personalInformation.fullName.firstName,
                lastName: user.personalInformation.fullName.lastName,
                userUniqueID: userId
            };

            const htmlToSend = template(replacements);
            const mailOptions = {
                from: "UranusTechNepal",
                to: user.personalInformation.emailAddress,
                subject: "Welcome to the Energy Transition for Resilient and Low Carbon Economy Summit 2025",
                html: htmlToSend,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    throw error;
                } else {
                    console.log("Email sent successfully:", info.response);
                }
            });
            res.status(200).json({ success: true, message: "User verified successfully." });

        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
}

//Caching the email template in Memory

// let maileTemplateForNational = fs.readFileSync("mailtemplate.html", "utf-8").toString()
// const emailtemplate1 = handlebars.compile(maileTemplateForNational);
// let maileTemplateForInterNational = fs.readFileSync("mailtemplate_intl.html", "utf-8").toString()
// const emailtemplate2 = handlebars.compile(maileTemplateForInterNational);
// const adminVerifyUser = async (req, res) => {

//     try {
//         const { userId } = req.params;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User Not found"
//             });
//         }

//         user.adminVerification.status = "accepted";
//         user.isVerifiedByAdmin = true;

//         const randomPassword = generateRandomPassword();
//         const hashedPassword = await bcrypt.hash(randomPassword, 10);

//         user.personalInformation.userPassword = hashedPassword;

//         await user.save();

//         // Prepare email template replacements
//         const replacements = {
//             firstName: user.personalInformation.fullName.firstName,
//             middleName: user.personalInformation.fullName.middleName,
//             lastName: user.personalInformation.fullName.lastName,
//             fullName: `${user.personalInformation.fullName.firstName} ${user.personalInformation.fullName.middleName} ${user.personalInformation.fullName.lastName}`,
//             password: randomPassword,
//         };

//         //Check user according to nationality 
//         const checkNationality = user.personalInformation.nationality;
//         const emailTemplate = checkNationality === "Nepal" ? emailtemplate1(replacements) : emailtemplate2(replacements);

//         //Generating Email HTML Template
//         const htmlToSend = emailTemplate;
//         res.status(200).json({ success: true, message: "User verified successfully." });

//         sendEmail({
//             subject: "Registration Approved - International Youth Camp 2025 Chitwan, Nepal",
//             html: htmlToSend,
//             to: user.personalInformation.emailAddress,
//         }).catch(emailError => {
//             console.error(`Failed to send email: ${emailError.message}`);

//         })

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Internal server error." });

//     }

// }

// admin edit user
const adminEditUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Find the user by ID and update
        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
        }).select("-password -__v");

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res
            .status(200)
            .json({ success: true, message: "User updated successfully.", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

//delete user

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user by ID and delete
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res
            .status(200)
            .json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const generateInvoiceNumber = () => {
    return (
        "ACSICNEP-" +
        Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, "0")
    );
};
const updateConferenceKitStatus = async (req, res) => {
    const { userId } = req.params;
    const { received } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.conferenceKitReceived = received;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Conference kit status updated." });
    } catch (error) {
        console.log("Error updating conference kit status:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Admin posts live stream URL
const postLiveStreamUrl = async (req, res) => {
    try {
        const { url } = req.body;

        // Validate the URL to allow both youtube.com and youtu.be
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!url || !youtubeRegex.test(url)) {
            return res
                .status(400)
                .json({ success: false, error: "Please provide a valid YouTube URL." });
        }

        // Save the URL
        const liveStream = new LiveStream({ url });
        await liveStream.save();

        res.status(201).json({
            success: true,
            message: "Live stream URL successfully saved.",
            liveStream,
        });
    } catch (error) {
        console.error("Error posting live stream URL:", error);

        res.status(500).json({
            success: false,
            error: "An unexpected error occurred while saving the live stream URL.",
        });
    }
};

// Get the live stream URL
const getLiveStreamUrl = async (req, res) => {
    try {
        const liveStream = await LiveStream.findOne()
            .sort({ createdAt: -1 })
            .limit(1); // Get the latest link

        if (!liveStream) {
            return res.status(404).json({
                success: false,
                error: "No live stream URL found.",
            });
        }

        res.status(200).json({
            success: true,
            liveStream,
        });
    } catch (error) {
        console.error("Error getting live stream URL:", error);

        res.status(500).json({
            success: false,
            error: "An unexpected error occurred while fetching the live stream URL.",
        });
    }
};

// Fetch all users with email and institution
const adminGetCheckInList = async (req, res) => {
    try {
        const users = await User.find({}, 'personalInformation.emailAddress personalInformation.nameOfInstitution arrivalCheckIn');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Mark check-in
const adminCheckInUser = async (req, res) => {
    const { userId } = req.params;
    const { participantCheckIn, accompanyCheckIn } = req.body;

    try {
        console.log("Checking in user:", userId);
        console.log("Request body:", req.body);

        // Fetch the user from the database
        const user = await User.findById(userId);

        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure arrivalCheckIn is initialized
        if (!user.personalInformation.arrivalCheckIn) {
            user.personalInformation.arrivalCheckIn = {
                participantCheckIn: {},
                accompanyCheckIn: {}
            };
        }

        // Handle participant check-in
        if (participantCheckIn) {
            user.personalInformation.arrivalCheckIn.participantCheckIn.checkedIn = true;
            user.personalInformation.arrivalCheckIn.participantCheckIn.date = new Date();
            user.markModified("personalInformation.arrivalCheckIn.participantCheckIn");
        }

        // Handle accompanying person check-in, but only if user has an accompanying person
        if (accompanyCheckIn) {
            if (user.accompanyingPerson && user.accompanyingPerson.hasAccompanyingPerson) {
                user.personalInformation.arrivalCheckIn.accompanyCheckIn.checkedIn = true;
                user.personalInformation.arrivalCheckIn.accompanyCheckIn.date = new Date();
                user.markModified("personalInformation.arrivalCheckIn.accompanyCheckIn");
            } else {
                // Skip the accompanying check-in if the user has no accompanying person, but continue with the participant check-in
                console.log(`User ${userId} does not have an accompanying person, skipping accompany check-in.`);
            }
        }

        // Save the updated user data
        await user.save();
        console.log("Check-in updated successfully for user:", userId);

        res.status(200).json({ success: true, message: 'Check-in updated' });
    } catch (error) {
        console.error("Error updating check-in:", error);
        res.status(500).json({ error: 'Error updating check-in' });
    }
};

// Caching the email template in memory
let templateSource = fs.readFileSync("volunteertemplate.html", "utf-8").toString();
const emailTemplateForVol = handlebars.compile(templateSource);

const createVolunteer = async (req, res) => {
    try {
        // Start uploading the file asynchronously
        upload(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).send({
                        success: false,
                        message: "File/Photo's size is too large. Maximum allowed size is 5 MB.",
                    });
                }
                return res.status(400).send({
                    success: false,
                    message: "Error uploading image.",
                    error: err.message,
                });
            }

            const { fullName, address, email, contact } = req.body;
            console.log(req.body)

            if (!fullName || !address || !email || !contact) {
                return res.status(400).json({
                    success: false,
                    message: "All Fields are required."
                });
            }

            const volunteerImage = req.files?.volunteerimage ? req.files.volunteerimage[0].path : null;

            const emailExist = await Volunteer.findOne({ email: email });
            if (emailExist) {
                return res.status(400).json({
                    success: false,
                    message: "Email Already Exists"
                });
            }

            const randomPassword = generateRandomPassword();
            const [hashedPassword] = await Promise.all([
                bcrypt.hash(randomPassword, 10),
            ]);

            const newUser = new Volunteer({
                fullName,
                address,
                contact,
                email,
                password: hashedPassword,
                volunteerimage: volunteerImage,
                isVolunteer: true
            });

            await newUser.save();
            console.log(newUser.email)

            const htmlToSend = emailTemplateForVol({
                email: newUser.email,
                password: randomPassword,
            });

            // Send the email asynchronously after responding to the user
            res.status(200).json({
                success: true,
                message: "Volunteer Registered. You will receive a confirmation email soon."
            });

            // Handle email sending asynchronously
            sendEmail({
                subject: "Volunteer Registration Success - Crown The Vision Nepal . Chitwan",
                html: htmlToSend,
                to: newUser.email,
            }).catch(emailError => {
                console.error(`Failed to send email: ${emailError.message}`);
            });

        });
    } catch (error) {
        console.log(`Error while creating Volunteer: ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
};



const getAllVolunteer = async (req, res) => {
    try {
        const allVolunteer = await Volunteer.find();
        if (!allVolunteer || allVolunteer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Volunteer Users Found"
            });
        }
        return res.status(200).json({
            success: true,
            allVolunteer,
            message: "All Volunteers Fetched Successfully",
        });

    } catch (error) {
        console.log(`Error while getting all Volunteers: ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
};


const deleteVolunteerById = async (req, res) => {
    try {
        const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
        if (!volunteer) {
            return res.status(400).json({
                success: false,
                message: "Provider Volunteer ID Not Found in DB"
            })
        }

        return res.status(200).json({
            success: true,
            volunteer,
            message: "Volunteer Deleted Successfully"
        })
    } catch (error) {
        console.log(`Error while deleting Volunteer By ID : ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
}


const updateVolunteerById = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).send({
                        success: false,
                        message: "File/Photo's size is too large. Maximum allowed size is 5 MB.",
                    });
                }
                return res.status(400).send({
                    success: false,
                    message: "Error uploading image.",
                    error: err.message,
                });
            }

            const { fullName, address, email, contact } = req.body;

            const volunteer = await Volunteer.findById(req.params.id);
            if (!volunteer) {
                return res.status(404).json({
                    success: false,
                    message: "Volunteer not found"
                });
            }

            volunteer.fullName = fullName || volunteer.fullName;
            volunteer.address = address || volunteer.address;
            volunteer.email = email || volunteer.email;
            volunteer.contact = contact || volunteer.contact;
            volunteer.volunteerimage = req.files?.volunteerimage ? req.files.volunteerimage[0].path : volunteer.volunteerimage;

            await volunteer.save();

            return res.status(200).json({
                success: true,
                volunteer,
                message: "Volunteer updated successfully",
            });

        });
    } catch (error) {
        console.log(`Error while updating Volunteer By ID : ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    adminRegister,
    adminLogin,
    adminVerifyUser,
    deleteUser,
    adminEditUser,
    adminResetPassword,
    updateConferenceKitStatus,
    getLiveStreamUrl,
    postLiveStreamUrl,
    adminCheckInUser,
    adminGetCheckInList,
    createVolunteer,
    getAllVolunteer,
    deleteVolunteerById,
    updateVolunteerById
};