import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URL, {
			dbName: "shopco",
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
		});

		mongoose.connection.on("connected", () => console.log("Mongoose connected"));
		mongoose.connection.on("disconnected", () => console.log("Mongoose disconnected"));
		mongoose.connection.on("error", (err) => console.error("Mongoose connection error:", err));
	} catch (error) {
		console.log(error.message);
		process.exit(1);
	}
};

process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("Mongoose connection closed due to app termination");
	process.exit(0);
});

export default connectDB;
