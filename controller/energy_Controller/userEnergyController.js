const upload = require("../../middleware/multipledocs");
const User = require("../../models/user")
const bcrypt = require("bcrypt");
const fs = require("fs");
const handlebars = require("handlebars");
const nodeMail = require('nodemailer');


const registerEnergy = async (req, res) => {

    try {
        upload(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        message: "File/Photo's size is too large. Max allowed size is 5 MB.",
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: "Error uploading image. Try again.",
                    error: err.message,
                });
            }

            let userimage = null;
            if (req.files && req.files.userimage && req.files.userimage.length > 0) {
                userimage = req.files.userimage[0].path;
            }

            //Destructuting
            const { nameOfInstitution, title, gender, firstName, middleName, lastName, jobPosition, mobileNumber, emailAddress } = req.body;
            console.log(req.body);

            if (!firstName || !lastName || !emailAddress) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: firstName, lastName, or emailAddress.",
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailAddress)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email address.",
                });
            }
            const existingUser = await User.findOne({
                "personalInformation.emailAddress": emailAddress,
            });

            const sanitizedFirstName = firstName.replace(/\s/g, "");
            const sanitizedMiddleName = middleName ? middleName.replace(/\s/g, "") : "";
            const sanitizedLastName = lastName.replace(/\s/g, "");

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User is already registered with this email address.",
                });
            }

            const defaultPassword = process.env.DEFAULT_PASSWORD || "Secret123";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const newUser = new User({
                personalInformation: {
                    title: title || "",
                    fullName: {
                        firstName: sanitizedFirstName,
                        middleName: sanitizedMiddleName,
                        lastName: sanitizedLastName,
                    },
                    nameOfInstitution,
                    jobPosition,
                    mobileNumber,
                    emailAddress,
                    userPassword: hashedPassword,
                    gender: gender || "male",
                },
                adminVerification: {
                    status: "accepted",
                },
                isVerifiedByAdmin: true,
                profilePicture: {
                    fileName: userimage || false,
                },
            });

            const savedUser = await newUser.save();
            console.log(`User Id is ${savedUser._id}`)

            await sendMail(savedUser._id);

            return res.status(200).json({
                success: true,
                message: "User registered successfully.",
                user: newUser,
            });
        })
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}

const transporter = nodeMail.createTransport({
    service: "gmail",
    auth: {
        user: "uranus09867@gmail.com",
        pass: "kmsd jnau kcns xktm"
    }
});

const sendMail = async (userUniqueID) => {
    try {
        let energyMailTemplate = fs.readFileSync("energy_template.html", "utf-8").toString();
        const emailTemplate = handlebars.compile(energyMailTemplate);

        // Find the user based on the unique ID
        const user = await User.findById(userUniqueID)
        if (!user) throw new Error("User not found.");

        const replacements = {
            firstName: user.personalInformation.fullName.firstName,
            middleName: user.personalInformation.fullName.middleName,
            lastName: user.personalInformation.fullName.lastName,
            fullName: `${user.personalInformation.fullName.firstName} ${user.personalInformation.fullName.middleName} ${user.personalInformation.fullName.lastName}`,
            userUniqueID: userUniqueID
        };

        const htmlToSend = emailTemplate(replacements);

        // Setup email options
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
    } catch (error) {
        console.error("Failed to send email:", error.message);
        throw error;
    }
};


module.exports = {
    registerEnergy
}