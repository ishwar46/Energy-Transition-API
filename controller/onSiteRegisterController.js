const OnSiteRegisterModel = require("../models/onSiteModel");
const upload = require("../middleware/multipledocs");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const OnSiteRegister = require("../models/onSiteModel");

const createOnSiteRegister = async (req, res) => {
    try {

        upload(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        message: "File size is too large. Maximum allowed size is 5 MB.",
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: "Error uploading file.",
                    error: err.message,
                });
            }
            const { institution, nationality, title, fullName, jobPosition, email, officeAddress, phoneNumber } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email is required.",
                });
            }

            const emailExist = await OnSiteRegisterModel.findOne({ email });
            if (emailExist) {
                return res.status(400).json({
                    success: false,
                    message: "This email already exists",
                });
            }

            const onSiteRegisterImage = req.files?.onSiteRegisterImage?.[0]?.path.replace(/\\/g, "/") || null;

            const onSiteData = new OnSiteRegisterModel({
                institution,
                nationality,
                title,
                fullName,
                jobPosition,
                officeAddress,
                email,
                phoneNumber,
                onSiteRegisterImage,
            });

            await onSiteData.save();
            return res.status(200).json({
                success: true,
                onSiteData,
                message: "On-site registration successful",
            });
        });
    } catch (error) {
        console.error(`Error during on-site registration: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const getAllOnSiteRegister = async (req, res) => {
    try {
        const onSiteRegisterData = await OnSiteRegisterModel.find();
        if (!onSiteRegisterData) {
            return res.status(400).json({
                success: false,
                message: "No Data found"
            })
        }
        return res.status(200).json({
            success: true,
            onSiteRegisterData,
            message: "On Site Register All Data Fetched Successfully"
        })
    } catch (error) {
        console.log(`Error while getting all OnSite Register Data is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

const deleteOnSiteRegister = async (req, res) => {
    try {
        const deletedData = await OnSiteRegisterModel.findByIdAndDelete(req.params.id);
        if (!deletedData) {
            return res.status(400).json({
                success: false,
                message: "No Data found"
            })
        }
        return res.status(200).json({
            success: true,
            deletedData,
            message: "On Site Register Data Deleted Successfully"
        })
    } catch (error) {
        console.log(`Error while deleting OnSite Register Data is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

const updateOnSiteRegister = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: "Error uploading file.",
                    error: err.message,
                });
            }

            const onSiteId = req.params.id;
            let existingData = await OnSiteRegisterModel.findById(onSiteId);

            if (!existingData) {
                return res.status(404).json({
                    success: false,
                    message: "Not found",
                });
            }

            const { institution, nationality, title, fullName, jobPosition, officeAddress, phoneNumber } = req.body;
            if (institution) existingData.institution = institution;
            if (nationality) existingData.nationality = nationality;
            if (title) existingData.title = title;
            if (fullName) existingData.fullName = fullName;
            if (jobPosition) existingData.jobPosition = jobPosition;
            if (officeAddress) existingData.officeAddress = officeAddress;
            if (phoneNumber) existingData.phoneNumber = phoneNumber;

            if (req.file) {
                if (existingData.onSiteRegisterImage) {
                    const oldImagePath = path.resolve(existingData.onSiteRegisterImage.replace(/\\/g, "/"));
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                existingData.onSiteRegisterImage = req.file.path.replace(/\\/g, "/");
            }

            await existingData.save();
            const updatedData = await OnSiteRegisterModel.findById(onSiteId);

            return res.status(200).json({
                success: true,
                message: "On-site register updated successfully",
                data: updatedData,
            });
        });
    } catch (error) {
        console.error(`Error while updating OnSite Register Data: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const markAttendanceForOnSiteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        let user = await User.findById(userId);
        let onSiteUser = await OnSiteRegister.findById(userId);

        if (!user && !onSiteUser) {
            return res.status(404).json({ error: "User not found in any model." });
        }

        let currentUser = user || onSiteUser;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log("Current date:", today);

        const alreadyMarked = currentUser.attendance.some((attendance) => {
            const attendanceDate = new Date(attendance.date.$date || attendance.date);
            attendanceDate.setHours(0, 0, 0, 0);
            return attendanceDate.getTime() === today.getTime();
        });

        if (alreadyMarked) {
            console.log("Attendance already marked for today.");
            return res.status(400).json({ error: "Attendance already marked for today." });
        }

        currentUser.attendance.push({ date: new Date(), status: true });
        await currentUser.save();

        console.log("Attendance marked successfully.");

        res.status(200).json({
            success: true,
            currentUser,
            message: "Attendance marked successfully.",
        });
    } catch (error) {
        console.error("Error in marking attendance:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    createOnSiteRegister,
    getAllOnSiteRegister,
    deleteOnSiteRegister,
    updateOnSiteRegister,
    markAttendanceForOnSiteUser
};
