const express = require('express');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

const router = express.Router();

// @route    POST api/posts
// @desc     Add a post
// @access   Private
router.post(
	'/',
	[auth, check('text', 'Text is required.').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				user: user.id,
				avatar: user.avatar,
			});

			const post = await newPost.save();

			res.status(200).json({ success: true, msg: post });
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route    GET api/posts
// @desc     Get all post
// @access   Private
router.get('/', auth, async (req, res) => {
	const posts = await Post.find().sort({ date: -1 });

	if (!posts)
		return res
			.status(404)
			.json({ success: false, msg: 'Not found any post.' });

	res.status(200).json({ success: true, msg: posts });
});

// @route    GET api/posts/:id
// @desc     Get post by id
// @access   Private
router.get('/:post_id', auth, async (req, res) => {
	const post = await Post.findById(req.params.post_id);

	if (!post)
		return res.status(404).json({
			success: false,
			msg: `Not found post with id of ${req.params.post_id}.`,
		});

	res.status(200).json({ success: true, msg: post });
});

// @route    DELETE api/posts/:post_id
// @desc     Delete post by id
// @access   Private
router.delete('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post)
			return res.status(404).json({
				success: false,
				msg: `Not found post with id of ${req.params.post_id}.`,
			});

		if (post.user.toString() !== req.user.id) {
			return res
				.status(401)
				.json({ success: false, msg: 'User not authorized.' });
		}

		await post.remove();

		res.status(200).json({ success: true, msg: 'Post deleted.' });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server Error');
	}
});

// @route    PUT api/posts/like/:post_id
// @desc     Like a post
// @access   Private
router.put('/like/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// Check if post has already been liked.
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length > 0
		) {
			return res
				.status(400)
				.json({ success: false, msg: 'Post already liked.' });
		}

		post.likes.unshift({ user: req.user.id });

		await post.save();

		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    PUT api/posts/unlike/:post_id
// @desc     Like a post
// @access   Private
router.put('/unlike/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// Check if post has already been liked.
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res
				.status(400)
				.json({ success: false, msg: 'Post has not yet been liked.' });
		}

		// Get remove index
		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);

		post.likes.splice(removeIndex, 1);

		await post.save();

		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    POST api/posts/comment/:post_id
// @desc     Comment on a post
// @access   Private
router.post(
	'/comment/:post_id',
	[auth, check('text', 'Text is required.').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.post_id);

			if (!post) {
				return res.status(404).json({
					success: false,
					msg: `Not found post with id of ${req.params.post_id}.`,
				});
			}

			const newComment = {
				text: req.body.text,
				name: user.name,
				user: user.id,
				avatar: user.avatar,
			};

			post.comments.unshift(newComment);

			await post.save();

			res.status(200).json({ success: true, msg: newComment });
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route    DELETE api/posts/comment/:post_id/:comment_id
// @desc     Delete post by id
// @access   Private
router.delete('/:post_id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if (!post)
			return res.status(404).json({
				success: false,
				msg: `Not found post with id of ${req.params.post_id}.`,
			});

		// Get remove index
		const removeIndex = post.comments
			.map((comment) => comment.id)
			.indexOf(req.params.comment_id);

		if (removeIndex === -1) {
			return res.status(404).json({
				success: false,
				msg: `Not found comment with id of ${req.params.comment_id}`,
			});
		}

		if (post.comments[removeIndex].user.toString() !== req.user.id) {
			return res
				.status(401)
				.json({ success: false, msg: 'User not authorized.' });
		}

		post.comments.splice('removeIndex', 1);

		await post.save();

		res.status(200).json({ success: true, msg: 'Comment deleted.' });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server Error');
	}
});

module.exports = router;
