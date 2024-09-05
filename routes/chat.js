const express = require('express')
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { OpenAI } = require("openai");
const fs = require("fs");
const Chat = require("../models/Chat");
const Admin = require("../models/Admin");

// Chat history stored in memory (could be moved to a database)
let chatHistory = [];
let chatHistoryText = "";

let orderHistory = {
    'laxya': [
        {
            orderId: 1,
            orderDate: "2022-10-10",
            orderItems: [
                {
                    name: "Product 1",
                    quantity: 2,
                    price: 40000,
                },
                {
                    name: "Product 2",
                    quantity: 1,
                    price: 30000,
                },
            ],
            total: 70000,
            status: "Delivered",
        },
        {
            orderId: 2,
            orderDate: "2022-10-12",
            orderItems: [
                {
                    name: "Product 3",
                    quantity: 1,
                    price: 5000,
                },
            ],
            total: 5000,
            status: "Delivered",
        },
    ],
    'anshul': [
        {
            orderId: 3,
            orderDate: "2022-10-12",
            orderItems: [
                {
                    name: "Product 4",
                    quantity: 1,
                    price: 5000,
                },
            ],
            total: 5000,
            status: "Returned",
        },
        {
            orderId: 4,
            orderDate: "2022-10-12",
            orderItems: [
                {
                    name: "Product 5",
                    quantity: 1,
                    price: 100,
                },
            ],
            total: 100,
            status: "Delivered",
        },
        {
            orderId: 5,
            orderDate: "2022-10-12",
            orderItems: [
                {
                    name: "Product 6",
                    quantity: 1,
                    price: 500,
                },
            ],
            total: 500,
            status: "Returned",
        },
    ],
};

let fetchedPolicies = ``

const promptForGPT4 = (userMessage, userName, userOrderHistory, policies) => `
    User's chat history: ${chatHistoryText}
    User's message: ${userMessage}
    User's name: ${userName}
    User's order history: ${JSON.stringify(userOrderHistory)}

    You are a customer support representative for Amazon. 
    Your job is to help customers process their refunds. 
    At the start of every conversations, assuming no chat history, start with a question like Hi, Hello, or any such greeting.
    The second step is to ask for a order ID from the customer.
    The third step is to ask for the reason for the refund.
    The fourth step is to ask for any additional pictures if they want to upload.

    You have to then process the refund based on the following factors:
    1. Based on the policies mentioned below by checking the order history given.
    2. Checking with the image, if provided by the customer, if the product or box is damaged or not.
    3. If the refund is valid, process the refund and inform the customer. (You can simulate this by just replying with a message)
    4. If the refund is not valid, inform the customer about the same. (You can simulate this by just replying with a message)

    Policies:
    ${policies}

    If the user can't seem to provide a valid reason for the refund, you can escalate the query to the next level of support by setting the escalated flag to true.

    After each conversation, return the following type of json object: {
        orderId: 1,
        user: "laxya",
        refundStatus: "Pending"/"Processed"/"Rejected",
        escalated: false/true,
        endStatus: true/false,
        satisfied: true/false,
        responseText: "Hi, how can I help you today?"
    }

    If the conversation has ended, set the endStatus to true and ask the customer if they are satisfied with the service, if they are then make satisfied true.

    DO NOT REPLY TO ANY USER MESSAGES THAT ARE NOT RELATED TO REFUNDS OR ORDERS EXCEPT FOR THE INITIAL MESSAGE.
`

// Configure OpenAI API with proper constructor
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
    const adminObject = await Admin.find({ company: 'Amazon' })
    fetchedPolicies = adminObject[0].policies;
    res.render("chat", { chatHistory });
});

router.post("/", upload.single("image"), async (req, res) => {
    try {
        const userMessage = req.body.message || "";
        let responseObject = {};
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        let botReply = "Sorry, something went wrong.";

        // If there's an image, we need to send it to the GPT-4 model with vision
        if (req.file) {
            const imageFilePath = path.join(
                __dirname,
                "../public/uploads",
                req.file.filename
            );

            const image = fs.readFileSync(imageFilePath);

            // Convert the image to a base64-encoded string
            const base64Image = Buffer.from(image).toString("base64");

            // Prepare the GPT request with user message and image
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Adjust the model name accordingly
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptForGPT4(userMessage, req.body.name.toLowerCase(), orderHistory[req.body.name.toLowerCase()], fetchedPolicies) },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
            });

            const gptResponseContent = response.choices[0].message.content;

            // if you identify json in the response, you can parse it and use it as needed
            if (gptResponseContent.includes("{") && gptResponseContent.includes("}")) {
                const jsonStart = gptResponseContent.indexOf("{");
                const jsonEnd = gptResponseContent.lastIndexOf("}");
                const jsonString = gptResponseContent.substring(jsonStart, jsonEnd + 1);
                responseObject = JSON.parse(jsonString);
                botReply = responseObject.responseText;
            } else {
                botReply = gptResponseContent;
            }
        } else {
            // If no image, proceed with a text-only request
            const prompt = promptForGPT4(userMessage, req.body.name.toLowerCase(), orderHistory[req.body.name.toLowerCase()], fetchedPolicies);

            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
            });

            const gptResponseContent = response.choices[0].message.content;

            // if you identify json in the response, you can parse it and use it as needed
            if (gptResponseContent.includes("{") && gptResponseContent.includes("}")) {
                const jsonStart = gptResponseContent.indexOf("{");
                const jsonEnd = gptResponseContent.lastIndexOf("}");
                const jsonString = gptResponseContent.substring(jsonStart, jsonEnd + 1);
                responseObject = JSON.parse(jsonString);
                botReply = responseObject.responseText;
            } else {
                botReply = gptResponseContent;
            }
        }

        // make a chatobject which has response object properties and a user message
        const chatobject = {
            userName: req.body.name,
            userMessage,
            imageUrl,
            responseObject,
            botReply,
        }

        const chat = new Chat(chatobject);
        await chat.save();

        // Store user message, image URL, and bot reply in chat history
        chatHistory.push({
            userMessage,
            imageUrl,
            botReply,
        });

        chatHistoryText += chatHistory.map((chat) => {
            return `User: ${chat.userMessage}\nBot: ${chat.botReply}`;
        });

        // Redirect back to the main page to show the updated chat history
        res.redirect("/chat");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Something went wrong");
    }
});

module.exports = router;