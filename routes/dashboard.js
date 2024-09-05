const express = require('express')
const router = express.Router();
const Admin = require("../models/Admin");
const Chat = require("../models/Chat");

router.get("/", async (req, res) => {
    let metrics = {
        ticketVolume: 0,
        avgResponseTime: '30s',
        firstResponseResolution: 0,
        customerSatisfaction: 0,
        ticketEscalationRate: 0,
    }
    const adminObject = await Admin.find({ company: 'Amazon' });
    const chatObjects = await Chat.find({});
    chatObjects.forEach(chat => {
        if (chat.responseObject) {
            metrics.ticketVolume++;
            if (!chat.responseObject.escalated) {
                metrics.firstResponseResolution++;
            }
            if (chat.responseObject.satisfied) {
                metrics.customerSatisfaction++;
            }
            if (chat.responseObject.escalated) {
                metrics.ticketEscalationRate++;
            }
        }
    });

    metrics.firstResponseResolution = `${(metrics.firstResponseResolution / metrics.ticketVolume) * 100}%`;
    metrics.customerSatisfaction = `${(metrics.customerSatisfaction / metrics.ticketVolume) * 100}%`;
    metrics.ticketEscalationRate = `${(metrics.ticketEscalationRate / metrics.ticketVolume) * 100}%`;

    res.render("dashboard", { metrics, policies: adminObject[0].policies });
});

router.post('/savePolicies', async (req, res) => {
    const { policies } = req.body;
    const adminObject = await Admin.find({ company: 'Amazon' })
    adminObject[0].policies = policies;
    await adminObject[0].save();
    res.send('success');
});

module.exports = router;