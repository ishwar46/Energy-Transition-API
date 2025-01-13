const Volunteer = require("../models/volunteer");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const volunteerLogin = async (req, res) => {

    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and Password Are Required"
        });
    }

    try {
        const user = await Volunteer.findOne({ email: email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "This email does not exist"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials."
            });
        }

        const token = jwt.sign({
            id: user._id,
            fullName: user.fullName,
            address: user.address,
            contact: user.contact,
            email: user.email,
            isVolunteer: user.isVolunteer,
        }, process.env.JWT_SECRET, { expiresIn: '6 days' });

        const { password: _, ...userWithoutPassword } = user.toObject();

        return res.status(200).json({
            success: true,
            message: "User logged in successfully.",
            token: token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error(`Error while logging in volunteer: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


const volunteerProfile = async (req, res) => {
    try {
        const user = await Volunteer.findById(req.params.id)
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No User Found for this id"
            })
        }

        return res.status(200).json({
            success: true,
            user,
            message: "Profile Fetched Successfully",
        })

    } catch (error) {
        console.log(`Error While Getting Volunteer Profile is ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

module.exports = {
    volunteerLogin,
    volunteerProfile
}