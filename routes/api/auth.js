const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route    GET api/auth
// @desc     Test route
// @access   Public
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');

		res.status(200).json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post(
	'/',
	[
		check('email', 'Please include a valid email.').isEmail(),
		check('password', 'Password is required.').exists(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ error: errors.array() });
		}

		const { email, password } = req.body;

		try {
			if (!email || !password) {
				res.status(401).json({
					msg: 'Please provide an email and password.',
				});
			}

			const user = await User.findOne({ email }).select('+password');

			if (!user) {
				res.status(400).json({
					errors: [{ msg: 'Invalid Credentials' }],
				});
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				res.status(400).json({
					errors: [{ msg: 'Invalid Credentials' }],
				});
			}

			const payload = {
				user: {
					id: user._id,
				},
			};

			jwt.sign(
				payload,
				config.get('jwtSecret'),
				{ expiresIn: 360000 },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server error.');
		}
	}
);

module.exports = router;
