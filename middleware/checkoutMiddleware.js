const initializeCheckout = (req, res, next) => {
	if (!req.session.checkout) {
		req.session.checkout = {
			cartItems: [],
			shippingAddress: null,
			paymentMethod: null,
			totalAmount: 0,
			orderDate: null,
			isFromCart: false,
		};
	}

	next();
};

export default initializeCheckout;
