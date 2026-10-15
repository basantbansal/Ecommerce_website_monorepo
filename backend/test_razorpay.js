import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

razorpay.orders.create({
    amount: Math.round(1759998 * 100),
    currency: "INR",
    receipt: "test_receipt"
}).then(console.log).catch(err => console.error(JSON.stringify(err, null, 2)));
