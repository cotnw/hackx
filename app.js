const express = require("express");
const multer = require("multer");
const path = require("path");
const { OpenAI } = require("openai");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Chat history stored in memory (could be moved to a database)
let chatHistory = [];

let orderHistory = {
    laxya: [
        {
            orderId: 1,
            orderDate: "2022-10-10",
            orderItems: [
                {
                    name: "Product 1",
                    quantity: 2,
                    price: 10000,
                },
                {
                    name: "Product 2",
                    quantity: 1,
                    price: 2000,
                },
            ],
            total: 22000,
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
    anshul: [],
};

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

// Set EJS as the template engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to render chat UI
app.get("/", (req, res) => {
    res.render("index", { chatHistory });
});

// Handle user input and image upload
app.post("/chat", upload.single("image"), async (req, res) => {
    try {
        const userMessage = req.body.message || "";
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        let botReply = "Sorry, something went wrong.";

        // If there's an image, we need to send it to the GPT-4 model with vision
        if (req.file) {
            const imageFilePath = path.join(
                __dirname,
                "public/uploads",
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
                            { type: "text", text: userMessage },
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

            botReply = response.choices[0].message.content;
        } else {
            // If no image, proceed with a text-only request
            const prompt = `User says: "${userMessage}". Give an appropriate response.`;

            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
            });

            botReply = response.choices[0].message.content;
        }

        // Store user message, image URL, and bot reply in chat history
        chatHistory.push({
            userMessage,
            imageUrl,
            botReply,
        });

        // Redirect back to the main page to show the updated chat history
        res.redirect("/");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Something went wrong");
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
