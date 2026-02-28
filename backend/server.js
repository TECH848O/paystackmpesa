require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Paystack secret key from environment
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize payment
app.post('/pay', async (req, res) => {
    const { email, amount } = req.body;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // amount in kobo
                callback_url: `${process.env.BACKEND_URL}/callback`
            },
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        res.json(response.data.data); // returns authorization_url
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Error initializing payment');
    }
});

// Callback to verify payment
app.get('/callback', async (req, res) => {
    const reference = req.query.reference;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        if (response.data.data.status === 'success') {
            res.send('Payment successful! Your data bundle/prediction is now active.');
        } else {
            res.send('Payment not successful.');
        }
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Error verifying payment');
    }
});

// Optional webhook route for automatic updates
app.post('/webhook', (req, res) => {
    console.log('Webhook event:', req.body);
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));