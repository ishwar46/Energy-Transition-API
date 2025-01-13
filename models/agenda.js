const mongoose = require("mongoose");

const agendaSchema = new mongoose.Schema({
    nameofInstitution: {
        type: String,
        required: true,
    },
    chiefDelegateName: {
        type: String,
        required: true,
    },
    chiefDelegatePosition: {
        type: String,
        required: true,
    },
    chiefDelegateEmailAddress: {
        type: String,
        required: true,
    },
    questions: [{
        question: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        options: {
            type: [String],
        },
        userAnswer: {
            type: String,
            required: true,
        },
        disagreeReason: {
            type: String,
        },
        othersReason: {
            type: String,
        },
    },],
});

const Agenda = mongoose.model("Agenda", agendaSchema);
module.exports = Agenda;