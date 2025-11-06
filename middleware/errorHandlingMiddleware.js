const errorHandling = (err, req, res, next) => {
	console.error("Server Error:", err.stack);
	res.status(500).send("Internal Server Error");
};

export { errorHandling };
