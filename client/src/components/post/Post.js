import React, { Fragment, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import PostItem from '../post/PostItem';
import { getPost } from '../../actions/post';
import CommentForm from './CommentForm';

const Post = ({ getPost, post: { post, loading } }) => {
	const params = useParams();

	useEffect(() => {
		getPost(params.id);
	}, [getPost]);

	return (
		<Fragment>
			{post === null || loading ? (
				<Spinner />
			) : (
				<Fragment>
					<Link to="/posts" className="btn">
						Back To Posts
					</Link>
					<div className="post bg-white p-1 my-1">
						<div>
							<a href="profile.html">
								<img
									className="round-img"
									src={post.avatar}
									alt=""
								/>
								<h4>{post.name}</h4>
							</a>
						</div>
						<div>
							<p className="my-1">{post.text}</p>
						</div>
					</div>

					<CommentForm postId={post._id} />

					{post.comments.length === 0 ? (
						<h4>There is no comment</h4>
					) : (
						post.comments.map((comment) => (
							<PostItem
								key={comment._id}
								comment={comment}
								postId={post._id}
							/>
						))
					)}
				</Fragment>
			)}
		</Fragment>
	);
};

Post.propTypes = {
	getPost: PropTypes.func.isRequired,
	post: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	post: state.post,
});

export default connect(mapStateToProps, { getPost })(Post);
