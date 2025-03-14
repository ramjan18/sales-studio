require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

mongoose.connect(`mongodb+srv://ramjannadaf487:ramjan123@cluster0.urg7e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const Coupon = mongoose.model('Coupon', new mongoose.Schema({ code: String, assigned: Boolean }));
const Claim = mongoose.model('Claim', new mongoose.Schema({
    ip: String,
    cookieId: String,
    timestamp: { type: Date, default: Date.now }
}));

const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour cooldown

//generate coupon
const generateCoupons = async (count) => {
   
    for (let i = 0; i < count; i++) {
        const couponCode = `OFFER${Math.floor(1000 + Math.random() * 9000)}`;
        await new Coupon({ code: couponCode }).save();
    }

    console.log(`${count} Coupons Added`);
    process.exit();
};

// generateCoupons(1); // Generates 1 coupons


app.get('/claim-coupon', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const cookieId = req.cookies.cookieId || Math.random().toString(36).substring(2, 15);
    res.cookie('cookieId', cookieId, { maxAge: COOLDOWN_TIME });
    
    const lastClaim = await Claim.findOne({ $or: [{ ip }, { cookieId }] }).sort({ timestamp: -1 });

    if (lastClaim && Date.now() - lastClaim.timestamp < COOLDOWN_TIME) {
        return res.status(429).json({ message: 'You must wait before claiming another coupon' });
    }
    
    const coupon = await Coupon.findOneAndUpdate();
    console.log("Coupon ", coupon);
    if (!coupon) return res.status(400).json({ message: 'No coupons available' });

    await new Claim({ ip, cookieId }).save();

    res.json({ message: 'Coupon claimed successfully!', coupon: coupon.code });
});

app.get('/remaining-time', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const lastClaim = await Claim.findOne({ ip }).sort({ timestamp: -1 });

    if (!lastClaim) return res.json({ remainingTime: 0 });

    const remainingTime = Math.max(0, COOLDOWN_TIME - (Date.now() - lastClaim.timestamp));
    res.json({ remainingTime });
});

app.listen(5000, () => console.log('Server running on port 5000'));
