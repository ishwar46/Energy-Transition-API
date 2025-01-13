const User = require("../models/user");
const bcrypt = require("bcrypt");
const upload = require("../middleware/multipledocs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");


const userRegister = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            // 1) Check Multer errors
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

            // 2) Optional profile picture
            let userimage = null;
            if (req.files && req.files.userimage && req.files.userimage.length > 0) {
                userimage = req.files.userimage[0].path;
            }

            // 3) Destructure fields
            const {
                title,
                gender, // now a single string: "male", "female", "others"
                firstName,
                middleName,
                lastName,
                nameOfInstitution,
                jobPosition,
                emailAddress,
                mobileNumber,
            } = req.body;

            // Debug logs
            console.log("DEBUG: req.body:", req.body);

            // 4) Validate required fields
            if (!firstName || !lastName || !emailAddress) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: firstName, lastName, or emailAddress.",
                });
            }

            // 5) Sanitize name fields
            const sanitizedFirstName = firstName.replace(/\s/g, "");
            const sanitizedMiddleName = middleName ? middleName.replace(/\s/g, "") : "";
            const sanitizedLastName = lastName.replace(/\s/g, "");

            // 6) Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailAddress)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email address.",
                });
            }

            // 7) Check if user with this email already exists
            const existingUser = await User.findOne({
                "personalInformation.emailAddress": emailAddress,
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User is already registered with this email address.",
                });
            }

            // 8) Hash default password
            const defaultPassword = process.env.DEFAULT_PASSWORD || "Secret123";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // 9) Create the user doc
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
                profilePicture: {
                    fileName: userimage || false,
                },
            });

            // 10) Save to DB
            await newUser.save();

            return res.status(200).json({
                success: true,
                message: "User registered successfully.",
                user: newUser,
            });
        });
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

const login = async (req, res) => {
    const { firstName, password } = req.body;

    try {
        // Ensure firstName and password are provided
        if (!firstName || !password) {
            return res.status(400).json({
                error: "Both username and password are required.",
            });
        }

        // Find users with the provided first name
        const users = await User.find({
            "personalInformation.fullName.firstName": firstName,
        });

        // Log for debugging
        console.log(users);

        if (users.length === 0) {
            return res.status(401).json({
                error: "Invalid credentials or user not found. Please check your username and try again.",
            });
        }

        // Find the correct user by comparing passwords
        let user = null;
        for (let i = 0; i < users.length; i++) {
            const isPasswordMatch = await bcrypt.compare(
                password,
                users[i].personalInformation.userPassword
            );
            if (isPasswordMatch) {
                user = users[i];
                break;
            }
        }

        if (!user) {
            return res.status(401).json({ error: "Wrong credentials." });
        }

        // Generate JWT token for authentication
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "6h",
        });

        res.status(200).json({ success: true, token, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }); // Exclude users where isAdmin is true

        // Identify duplicates
        const nameCounts = {};
        users.forEach((user) => {
            const fullName = `${user.personalInformation.fullName.firstName} ${user.personalInformation.fullName.middleName || ""
                } ${user.personalInformation.fullName.lastName}`;
            if (nameCounts[fullName]) {
                nameCounts[fullName].count++;
                nameCounts[fullName].users.push(user._id);
            } else {
                nameCounts[fullName] = { count: 1, users: [user._id] };
            }
        });

        const duplicateUserIds = Object.values(nameCounts)
            .filter((name) => name.count > 1)
            .flatMap((name) => name.users);

        res.status(200).json({ success: true, users, duplicateUserIds });
    } catch (error) {
        console.error("Error getting all users:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching users.",
        });
    }
};

// Controller to get a user by ID
const getUsersById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password -__v");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const getUserById = async (req, res) => {
    try {

        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const user = await User.findById(userId).select("-password -__v");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Controller to update a user by ID
const updateUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
        }).select("-password -__v");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

//Change Password
const changePassword = async (req, res) => {
    const { firstName, email, password, newPassword, confirmPassword } = req.body;

    if (!firstName || !email || !password || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Please enter all fields",
        });
    }

    try {
        // Fetch all users with the provided email
        const users = await User.find({
            "personalInformation.emailAddress": email,
        });
        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email",
            });
        }
        // Change password

        // Iterate through each user and check passwords
        let passwordChanged = false;
        for (let user of users) {
            // Check if the first name matches (assuming case insensitive)
            if (
                user.personalInformation.fullName.firstName.toLowerCase() ===
                firstName.toLowerCase()
            ) {
                // Compare passwords
                const isMatched = await bcrypt.compare(
                    password,
                    user.personalInformation.userPassword
                );

                if (isMatched) {
                    // Validate new password length
                    if (newPassword.length < 6 || confirmPassword.length < 6) {
                        return res.status(400).json({
                            success: false,
                            message: "Password must have at least 6 characters",
                        });
                    }

                    // Compare new and confirm passwords
                    if (newPassword !== confirmPassword) {
                        return res.status(400).json({
                            success: false,
                            message: "New and Confirm Password did not match",
                        });
                    }

                    // Hash the new password
                    const hashedPassword = await bcrypt.hash(newPassword, 10);

                    // Update user's password and plainTextPassword
                    user.personalInformation.userPassword = hashedPassword;
                    user.personalInformation.plainTextPassword = newPassword;

                    await user.save();

                    passwordChanged = true;
                    break;
                }
            }
        }

        if (!passwordChanged) {
            return res.status(400).json({
                success: false,
                message: "Invalid Username or Incorrect old Password",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.log(`Error in change password: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const getUserByInstiuition = async (req, res) => {
    try {
        const { institution } = req.query;
        const users = await User.find({
            "personalInformation.nameOfInstitution": institution,
        }).select("-password"); // Exclude password field
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

const markAttendance = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Log the current date being compared
        console.log("Current date:", today);

        const alreadyMarked = user.attendance.some((attendance) => {
            const attendanceDate = new Date(attendance.date.$date || attendance.date);
            attendanceDate.setHours(0, 0, 0, 0);
            console.log(
                "Comparing attendance date:",
                attendanceDate,
                "with today:",
                today
            );
            return attendanceDate.getTime() === today.getTime();
        });

        if (alreadyMarked) {
            console.log("Attendance already marked for today.");
            return res
                .status(400)
                .json({ error: "Attendance already marked for today." });
        }

        user.attendance.push({ date: new Date(), status: true });
        await user.save();

        console.log("Attendance marked successfully.");

        res.status(200).json({
            success: true,
            user,
            message: "Attendance marked successfully.",
        });
    } catch (error) {
        console.error("Error in marking attendance:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const generateQRCode = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const qrCodeText = `UserId: ${userId}`;
        const qrCodeOptions = {
            type: "png", // can also be svg, jpeg, etc.
            errorCorrectionLevel: "H", // higher error correction level
            quality: 0.92, // image quality factor
            margin: 1, // white space around QR codej
        };

        const qrCode = await QRCode.toDataURL(qrCodeText, qrCodeOptions);

        // Save the QR code data to user model
        user.qrCode = qrCode;
        await user.save();

        res.status(200).json({ success: true, qrCode });
    } catch (error) {
        console.error("Error generating QR code:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const markMeal = async (req, res) => {
    try {
        const { userId, mealType } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alreadyMarked = user.meals.some((meal) => {
            const mealDate = new Date(meal.date);
            mealDate.setHours(0, 0, 0, 0);
            return meal.type === mealType && mealDate.getTime() === today.getTime();
        });

        if (alreadyMarked) {
            return res.status(400).json({
                error: `${mealType} has already been marked for today.`,
            });
        }

        const newMeal = {
            type: mealType,
            date: new Date(), // Set the current date
            status: true,
        };

        user.meals.push(newMeal);
        await user.save();

        res.status(200).json({
            success: true,
            message: `${mealType} marked successfully for today.`,
        });
    } catch (error) {
        console.error("Error marking meal:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Mark excursion status
const markExcursion = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alreadyMarked = user.excursions.some((excursion) => {
            const excursionDate = new Date(excursion.date);
            excursionDate.setHours(0, 0, 0, 0);
            return excursionDate.getTime() === today.getTime();
        });

        if (alreadyMarked) {
            return res.status(400).json({
                error: "Excursion has already been marked for today.",
            });
        }

        const newExcursion = {
            status: true,
            date: new Date(),
        };

        user.excursions.push(newExcursion);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Excursion marked successfully for today.",
        });
    } catch (error) {
        console.error("Error marking excursion:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Get all participants with their meal and excursion statuses
const getMealsAndExcursions = async (req, res) => {
    try {
        const participants = await User.find({ isAdmin: false }).select(
            "personalInformation meals excursions"
        );
        res.status(200).json({ success: true, participants });
    } catch (error) {
        console.error("Error fetching participants:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Update meal status for a specific participant
const updateMealStatus = async (req, res) => {
    const { userId, mealType } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const mealIndex = user.meals.findIndex((meal) => meal.type === mealType);
        if (mealIndex === -1) {
            return res
                .status(404)
                .json({ error: `${mealType} not found for user ${userId}.` });
        }

        user.meals[mealIndex].status = status;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: `${mealType} status updated.` });
    } catch (error) {
        console.error(`Error updating ${mealType} status:`, error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Update excursion status for a specific participant
const updateExcursionStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.excursionAttended = status;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Excursion status updated." });
    } catch (error) {
        console.error("Error updating excursion status:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};
// Post Location
const postLocation = async (req, res) => {
    const { userid } = req.params;
    const { location, additionalNotes } = req.body;

    console.log(userid);
    console.log(req.body);

    try {
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const locationWithUser = await User.findByIdAndUpdate(
            userid, { $push: { locationHistory: { location, additionalNotes } } }, { new: true }
        );

        res.status(200).json({
            success: true,
            locationWithUser,
            message: "Location Updated Successfully",
        });
    } catch (error) {
        console.error("Error while posting location is:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

//getOnlyLocationWithUserId
const getOnlyLocationWithUserId = async (req, res) => {
    const { userid } = req.params;

    try {
        const user = await User.findById(userid).select("locationHistory");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).json({
            success: true,
            locationHistory: user.locationHistory,
            message: "Location fetched successfully.",
        });
    } catch (error) {
        console.error("Error while getting user with location:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

//getAllUserLocation
const getAllUserLocation = async (req, res) => {
    try {
        const users = await User.find().select(
            "locationHistory personalInformation"
        );
        res.status(200).json({
            success: true,
            users,
            message: "Location fetched successfully.",
        });
    } catch (error) {
        console.error("Error while getting all user with location:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        // Handle file uploads using multer
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: "Error uploading file.",
                    error: err.message,
                });
            }

            console.log("Uploaded Files:", req.files);
            const userID = req.params.id;
            const updateData = req.body;
            const user = await User.findById(userID);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            // Handle profile picture update
            let userimage = user.personalInformation?.profilePicture?.fileName; // Default to existing image
            if (req.files?.userimage) {
                // Delete old image if it exists
                if (userimage) {
                    const filePath = path.resolve(userimage);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                // Update to new image path
                userimage = req.files.userimage[0].path.replace(/\\/g, "/");
            }

            // Update fields dynamically
            const {
                title,
                firstName,
                middleName,
                lastName,
                nationality,
                dateOfBirth,
                emailAddress,
                currentAddress,
                highestEducationLevel,
                leoMultipleDistrictAndClubName,
                positionInDistrict,
                male,
                feMale,
                others,
                occupation,
                intlOccupationPassportNumber,
                whatsAppNumber,
                whyToAttend,
                uniqueness,
                achievementsTillNow,
                anySpecialSkillsOrQualifications,
                socialMediaHandle,
                currentMentalAndPhysicalHealth,
                notableThingsToKnow,
                emergencyContactNum,
                aggredToPayAmount,
                aggredToBeBestBehaviour,
                termsandcond,
                pictureuploadread,
                vegetarian,
                nonveg,
                other,
            } = updateData;

            // Assign new values or keep existing ones
            user.personalInformation = {
                ...user.personalInformation,
                title: title || user.personalInformation.title,
                fullName: {
                    firstName: firstName || user.personalInformation.fullName.firstName,
                    middleName: middleName || user.personalInformation.fullName.middleName,
                    lastName: lastName || user.personalInformation.fullName.lastName,
                },
                nationality: nationality || user.personalInformation.nationality,
                dateOfBirth: dateOfBirth || user.personalInformation.dateOfBirth,
                emailAddress: emailAddress || user.personalInformation.emailAddress,
                currentAddress: currentAddress || user.personalInformation.currentAddress,
                highestEducationLevel: highestEducationLevel || user.personalInformation.highestEducationLevel,
                leoMultipleDistrictAndClubName: leoMultipleDistrictAndClubName || user.personalInformation.leoMultipleDistrictAndClubName,
                positionInDistrict: positionInDistrict || user.personalInformation.positionInDistrict,
                gender: {
                    male: male === undefined ? user.personalInformation.gender.male : male,
                    feMale: feMale === undefined ? user.personalInformation.gender.feMale : feMale,
                    others: others === undefined ? user.personalInformation.gender.others : others,
                },
                occupation: occupation || user.personalInformation.occupation,
                intlOccupationPassportNumber: intlOccupationPassportNumber || user.personalInformation.intlOccupationPassportNumber,
                whatsAppNumber: whatsAppNumber || user.personalInformation.whatsAppNumber,
                whyToAttend: whyToAttend || user.personalInformation.whyToAttend,
                uniqueness: uniqueness || user.personalInformation.uniqueness,
                achievementsTillNow: achievementsTillNow || user.personalInformation.achievementsTillNow,
                anySpecialSkillsOrQualifications: anySpecialSkillsOrQualifications || user.personalInformation.anySpecialSkillsOrQualifications,
                socialMediaHandle: socialMediaHandle || user.personalInformation.socialMediaHandle,
                currentMentalAndPhysicalHealth: currentMentalAndPhysicalHealth || user.personalInformation.currentMentalAndPhysicalHealth,
                notableThingsToKnow: notableThingsToKnow || user.personalInformation.notableThingsToKnow,
                emergencyContactNum: emergencyContactNum || user.personalInformation.emergencyContactNum,
                dietaryRequirements: {
                    vegetarian: vegetarian === undefined ? user.personalInformation.dietaryRequirements.vegetarian : vegetarian,
                    nonveg: nonveg === undefined ? user.personalInformation.dietaryRequirements.nonveg : nonveg,
                    other: other || user.personalInformation.dietaryRequirements.other,
                },
                profilePicture: {
                    fileName: userimage,
                    uploadDate: new Date(),
                },
            };

            user.aggredToPayAmount = aggredToPayAmount || user.aggredToPayAmount;
            user.aggredToBeBestBehaviour = aggredToBeBestBehaviour || user.aggredToBeBestBehaviour;
            user.termsandcond = termsandcond || user.termsandcond;
            user.pictureuploadread = pictureuploadread || user.pictureuploadread;

            // Save the updated user
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User profile updated successfully.",
                user,
            });
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};




// const updateUserProfile = async (req, res) => {
//     const { id } = req.params;
//     const updateData = req.body;

//     try {
//         // Build the update object dynamically
//         const updateFields = {};

//         // Personal Information Fields (including new arriving and departing flight numbers)
// if (updateData.personalInformation) {
//     Object.keys(updateData.personalInformation).forEach((key) => {
//         if (key !== 'flightDetails') {
//             updateFields[`personalInformation.${key}`] = updateData.personalInformation[key];
//         }
//     });

//             // Update individual flight details (no whole object updates to avoid conflicts)
//             if (updateData.personalInformation.flightDetails) {
//                 if (updateData.personalInformation.flightDetails.arrivingFlightNumber) {
//                     updateFields['personalInformation.flightDetails.arrivingFlightNumber'] =
//                         updateData.personalInformation.flightDetails.arrivingFlightNumber;
//                 }
//                 if (updateData.personalInformation.flightDetails.departingFlightNumber) {
//                     updateFields['personalInformation.flightDetails.departingFlightNumber'] =
//                         updateData.personalInformation.flightDetails.departingFlightNumber;
//                 }
//                 if (updateData.personalInformation.flightDetails.arrivingAirlinesName) {
//                     updateFields['personalInformation.flightDetails.arrivingAirlinesName'] =
//                         updateData.personalInformation.flightDetails.arrivingAirlinesName;
//                 }
//                 if (updateData.personalInformation.flightDetails.departingAirlinesName) {
//                     updateFields['personalInformation.flightDetails.departingAirlinesName'] =
//                         updateData.personalInformation.flightDetails.departingAirlinesName;
//                 }
//                 if (updateData.personalInformation.flightDetails.arrivalDate) {
//                     updateFields['personalInformation.flightDetails.arrivalDate'] =
//                         updateData.personalInformation.flightDetails.arrivalDate;
//                 }
//                 if (updateData.personalInformation.flightDetails.departureDate) {
//                     updateFields['personalInformation.flightDetails.departureDate'] =
//                         updateData.personalInformation.flightDetails.departureDate;
//                 }
//             }
//         }

//         // Dietary Requirements Fields
//         if (updateData.dietaryRequirements) {
//             Object.keys(updateData.dietaryRequirements).forEach((key) => {
//                 updateFields[`dietaryRequirements.${key}`] = updateData.dietaryRequirements[key];
//             });
//         }

//         // // Gender Fields
//         // if (updateData.personalInformation.gender) {
//         //     Object.keys(updateData.personalInformation.gender).forEach((key) => {
//         //         updateFields[`gender.${key}`] = updateData.personalInformation.gender[key];
//         //     });
//         // }


//         // Accompanying Person Information Fields (including new arriving and departing flight numbers)
//         // if (updateData.accompanyingPerson?.hasAccompanyingPerson) {
//         //     if (updateData.accompanyingPerson.accompanyingPersonInformation) {
//         //         Object.keys(updateData.accompanyingPerson.accompanyingPersonInformation).forEach((key) => {
//         //             if (key !== 'flightDetails') {
//         //                 updateFields[`accompanyingPerson.accompanyingPersonInformation.${key}`] = updateData.accompanyingPerson.accompanyingPersonInformation[key];
//         //             }
//         //         });

//         //         // Update individual flight details for accompanyingPerson
//         //         if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails) {
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingFlightNumber) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingFlightNumber'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingFlightNumber;
//         //             }
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departingFlightNumber) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.departingFlightNumber'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departingFlightNumber;
//         //             }
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingAirlinesName) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingAirlinesName'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivingAirlinesName;
//         //             }
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departingAirlinesName) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.departingAirlinesName'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departingAirlinesName;
//         //             }
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivalDate) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivalDate'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.arrivalDate;
//         //             }
//         //             if (updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departureDate) {
//         //                 updateFields['accompanyingPerson.accompanyingPersonInformation.flightDetails.departureDate'] =
//         //                     updateData.accompanyingPerson.accompanyingPersonInformation.flightDetails.departureDate;
//         //             }
//         //         }
//         //     }
//         //     updateFields['accompanyingPerson.hasAccompanyingPerson'] = updateData.accompanyingPerson.hasAccompanyingPerson;
//         // }

//         // Use $set to update only the provided fields
//         const updatedUser = await User.findByIdAndUpdate(
//             id, { $set: updateFields }, { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ error: 'User not found.' });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'User profile updated successfully.',
//             user: updatedUser,
//         });
//     } catch (error) {
//         console.error('Error updating user profile:', error);
//         res.status(500).json({ error: 'Internal server error.' });
//     }
// };




module.exports = {
    userRegister,
    getAllUsers,
    getUserById,
    login,
    updateUserById,
    getUserByInstiuition,
    changePassword,
    markAttendance,
    generateQRCode,
    getUsersById,
    markExcursion,
    getMealsAndExcursions,
    updateMealStatus,
    updateExcursionStatus,
    postLocation,
    getOnlyLocationWithUserId,
    getAllUserLocation,
    markMeal,
    markExcursion,
    updateUserProfile,
};