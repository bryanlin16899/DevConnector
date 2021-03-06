const express = require('express');
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

const router = express.Router();

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			'user',
			['name', 'avatar']
		);

		if (!profile) {
			res.status(404).json({
				success: false,
				msg: `Not found any profile with user of ${req.user.email}`,
			});
		}
		res.json(profile);
	} catch (err) {
		console.log(err.message);
		res.status(500).send('Server error.');
	}
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
	'/',
	[
		auth,
		check('status', 'Status is required.').not().isEmpty(),
		check('skills', 'Skills is required').not().isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			skills,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
			location,
			bio,
			status,
			githubusername,
		} = req.body;

		// Buile profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		// profileFields.company = company || '';
		// profileFields.website = website || '';
		// profileFields.location = location || '';
		// profileFields.bio = bio || '';
		// profileFields.status = status || '';
		// profileFields.githubusername = githubusername || '';
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills
				.split(',')
				.map((skill) => skill.trim());
		}

		// Build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				// Update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			// Create
			profile = await Profile.create(profileFields);

			res.status(200).json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', [
			'name',
			'avatar',
		]);

		res.status(200).json({
			success: true,
			count: profiles.length,
			data: profiles,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    GET api/profile/user/:user_id
// @desc     Get specific user's profile by user id
// @access   Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(404).json({
				success: false,
				msg: `Not found profile with id of ${req.params.user_id}`,
			});
		}

		res.status(200).json({ success: true, msg: profile });
	} catch (err) {
		console.log(err);
		if (err.kind == 'ObjectId') {
			return res.status(404).json({
				success: false,
				msg: `Not found profile with id of ${req.params.user_id}`,
			});
		}
		res.status(500).send('Server Error.');
	}
});

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
	try {
		// Remove users post
		await Post.deleteMany({ user: req.user.id });
		// Remove profile
		await Profile.findOneAndRemove({ user: req.user.id });
		// Remove user
		await User.findByIdAndRemove({ _id: req.user.id });

		res.status(200).json({
			success: true,
			msg: 'User deleted.',
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required.').not().isEmpty(),
			check('company', 'Company is required.').not().isEmpty(),
			check('from', 'From date is required.').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// prettier-ignore
		const { 
            title, 
            company, 
            location, 
            from, 
            to, 
            current, 
            description 
        } = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);

			await profile.save();

			res.status(200).json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error.');
		}
	}
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove Index
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.status(200).json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required.').not().isEmpty(),
			check('degree', 'Degree is required.').not().isEmpty(),
			check('fieldofstudy', 'Field of stydu is required.')
				.not()
				.isEmpty(),
			check('from', 'Date is required.').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// prettier-ignore
		const { 
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            decription
        } = req.body;

		const newExp = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			decription,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newExp);

			await profile.save();

			res.status(200).json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error.');
		}
	}
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove Index
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.edu_id);

		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.status(200).json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get(
				'githubClientId'
			)}&client_secret=${config.get('githubSecret')}`,
			method: 'GET',
			// prettier-ignore
			headers: { 'User-Agent': 'node.js' },
		};

		request(options, (error, response, body) => {
			if (error) console.error(error);

			if (response.statusCode !== 200) {
				return res
					.status(400)
					.json({ msg: `No Github profile found. ${body}` });
			}

			res.json(JSON.parse(body));
		});
	} catch (err) {
		console.log(err.message);
		res.status(500).send('Server Error.');
	}
});

module.exports = router;
