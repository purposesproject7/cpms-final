// Note: This is the script file to create the inital admin by bypassing the security checks this should not be pushed into production.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const ADMIN_EMAIL = "admin@vit.ac.in";
const ADMIN_PASSWORD = "admin";
const ADMIN_NAME = "Main Admin";
const ADMIN_EMPLOYEE_ID = "ADMIN001";

const createAdmin = async () => {
  console.log("Connecting to database...");
  await connectDB();

  try {
    console.log(`Checking if admin user ${ADMIN_EMAIL} already exists...`);
    const existingAdmin = await Faculty.findOne({ emailId: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`Admin user ${ADMIN_EMAIL} already exists. No action taken.`);
      return;
    }

    console.log(`Admin user ${ADMIN_EMAIL} not found. Creating...`);

    //disabling passwork check for now
    // if (
    //   ADMIN_PASSWORD.length < 8 ||
    //   !/[A-Z]/.test(ADMIN_PASSWORD) ||
    //   !/[a-z]/.test(ADMIN_PASSWORD) ||
    //   !/[0-9]/.test(ADMIN_PASSWORD) ||
    //   !/[^A-Za-z0-9]/.test(ADMIN_PASSWORD)
    // ) {
    //   console.error(
    //     "Admin password does not meet complexity requirements (>=8 chars, upper, lower, number, special)."
    //   );
    //   return;
    // }

    console.log("Hashing admin password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const adminUser = new Faculty({
      name: ADMIN_NAME,
      emailId: ADMIN_EMAIL,
      password: hashedPassword,
      employeeId: ADMIN_EMPLOYEE_ID,
      role: "admin",
      imageUrl: "",
    });

    await adminUser.save();
    console.log(
      `Successfully created admin user: ${ADMIN_NAME} (${ADMIN_EMAIL})`
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

createAdmin();
