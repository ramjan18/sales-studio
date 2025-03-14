const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
require("dotenv").config();


const generateCoupons = async (count) => {
   

    for (let i = 0; i < count; i++) {
        const couponCode = `OFFER${Math.floor(1000 + Math.random() * 9000)}`;
        await new Coupon({ code: couponCode }).save();
    }

    console.log(`✅ ${count} Coupons Added`);
    process.exit();
};

generateCoupons(10); // Generates 10 coupons
