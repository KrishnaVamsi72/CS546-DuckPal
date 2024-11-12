import { posts, users } from "../config/mongoCollections.js";
import { ObjectId } from 'mongodb';
import * as userData from './users.js'
import  { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid, checkUsername } from '../helper.js'
// Function to get a post by its ID
export const getPostById = async (id) => {
  id =  checkId(id);
  const postCollection = await posts();
  const post = await postCollection.findOne({ _id: new ObjectId(id) });
  if (!post) {
    throw 'Error: Post not found';
  }
  //post._id = post._id.toString();
  return post;
};
// Function to get all posts
export const getAllPosts = async () => {
  const postCollection = await posts();
  return await postCollection.  find({}).toArray();
};
export const getPostsByTag = async (tag)=>{
  //tag =  checkString(tag,'Tag')
  const postCollection = await posts();
  return await postCollection.find({tags: tag}).toArray();
};
// Function to create a new post
export const createPost = async (title, content, userId, tags,course,username) => {
  title =  checkString(title, 'Title');
  content =  checkString(content,'content');
  course =  checkString(course,'course')
  userId = checkId(userId, 'User ID');
  username = checkUsername(username,'username')
  if (!Array.isArray(tags)) {
    tags = [];
  } else {
    tags = checkStringArray(tags, 'Tags');
  }
  //const userThatPosted = await userData.getUserById(userId);
  const last_updated_at = new Date().toUTCString();
  const newPost = {
    title : title,
    content :content,
    posterId: userId,
    posterName:username,
    course : course,
    tags: tags,
    last_updated_at : last_updated_at,
    likes: 0,
    dislikes: 0,
    comments: [],
    likedBy : [],
    dislikedBy : []
  };
  const postCollection = await posts();
  const insertInfo = await postCollection.insertOne(newPost);

  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw 'Could not create post';
  }
  const succ = {postCreated:true};
  return succ;
  // const postId = insertInfo.insertedId.toString();
  // const createdPost = await getPostById(postId);
  // return createdPost;
};

export const updatePost = async (id,updatedPost) => {
    const updatedPostData = {};
    if (updatedPost.tags) {
      updatedPostData.tags = checkStringArray(
        updatedPost.tags,
        'Tags'
      );
    }
    if (updatedPost.title) {
      updatedPostData.title = checkString(
        updatedPost.title,
        'Title'
      );
    }
    if (updatedPost.content) {
      updatedPostData.content = checkString(updatedPost.content, 'content');
    }
    if (updatedPost.course) {
      updatedPostData.course = checkString(updatedPost.course, 'course');
    }
    updatedPostData.last_updated_at = new Date().toUTCString()
    const postCollection = await posts();
    let newPost = await postCollection.findOneAndUpdate(
      {_id: new ObjectId(id)},
      {$set: updatedPostData},
      {returnDocument: 'after'}
    );
    if (!newPost)
      throw 'Cannot update the post'

    return {postUpdated:true};
};

// Function to delete a post
export const deletePost = async (id) => {
  id = checkId(id);

  const postCollection = await posts();
  const deletionInfo = await postCollection.findOneAndDelete({ _id: new ObjectId(id) });

  if (deletionInfo.lastErrorObject.n === 0)
      throw [404, `Could not delete post with id of ${id}`];

  return {deleted: true};
};
export const createComment = async (postId,userId,userName,content) =>{
   postId =  checkId(postId,'postId')
   userId =  checkId(userId,'userId')
   userName =  checkUsername(userName,'userName')
   content =  checkString(content,'content')
  const postCollection = await posts()
  const post = await postCollection.findOne({_id: new ObjectId(postId)});
  if(post === null){
    throw 'No post with that postId'
  }
  const userCollection = await users()
  const user = await userCollection.findOne({_id:new ObjectId(userId)});
  if(user===null){
    throw 'No user with that userId'
  }
  const postedAt = new Date().toUTCString();
  const newComment = {
    _id : new ObjectId(),
    postId : postId,
    userId : userId,
    userName : userName,
    content : content,
    postedAt : postedAt
  }
  const updateInfo = await postCollection.updateOne({_id: new ObjectId(postId)}, {$push: {comments: newComment}},{returnDocument:'after'});
  if(!updateInfo){
    throw `Error: Update failed! Could not add the comment for the post with postId ${postId}`;
  }
  return {commentCompleted : true,content:content};

};
export const getAllComments = async (postId) =>{
  postId =  checkId(postId,'postId')
  const postCollection = await posts();
  const post = await postCollection.findOne({_id: new ObjectId(postId)});
  if (!post) throw 'No post with that postId';
  if(post.comments.length===0) throw 'No comments for the post'
  return post.comments;
}

// Function to retrieve comments by post ID
// export const getCommentsByPostId = async (postId) => {
//   const commentCollection = await comments();
//   const postComments = await commentCollection.find({ postId: postId }).toArray();

//   return postComments;
// };

// Function to search posts by tag
// export const searchByTag = async (tag) => {
//   const postCollection = await posts();
//   const taggedPosts = await postCollection.find({ tags: tag }).toArray();

//   return taggedPosts.map(post => {
//     post._id = post._id.toString();
//     return post;
//   });
// };

// Function to get user by comment ID
// export const getUserByCommentId = async (commentId) => {
//   const commentCollection = await comments();
//   const comment = await commentCollection.findOne({ _id: new ObjectId(commentId) });

//   if (!comment) {
//     throw new Error('Comment not found');
//   }

//   const userCollection = await users();
//   const user = await userCollection.findOne({ _id: new ObjectId(comment.userId) });

//   if (!user) {
//     throw new Error('User not found');
//   }

//   user._id = user._id.toString();
//   return user;
// };

export const updateLikes = async(action,id,username)=>{
  // const id =  checkId(postId,'postId');
  // const action = checkString(action,'action');
  // const username = checkUsername(username,'username');
  const postCollection = await posts();
    let cnt = 0 
    if(action==="like"){
      cnt = 1;
      await postCollection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { likedBy: username } }
    );
    }
    else{
      cnt = -1;
      await postCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { likedBy: username } }
    );
    }
    const updateInfo = await postCollection.findOneAndUpdate(
      {_id: new ObjectId(id)},
      { $inc: { likes: cnt } },
      { returnDocument: "after" }
    );
    if (!updateInfo)
      throw [404, `Could not update the post with id ${id}`];

    const succ = {postUpdated:true,likesCount:updateInfo.value.likes}
  
    return succ;
  
};
export const updateDislikes = async(action,id,username)=>{
  const postCollection = await posts();
  let cnt = 0 
  if(action==="dislike"){
    cnt = 1;
    await postCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { dislikedBy: username } }
  );
  }
  else{
    cnt = -1;
    await postCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { dislikedBy: username } }
  );
  }
  const updateInfo = await postCollection.findOneAndUpdate(
    {_id: new ObjectId(id)},
    { $inc: { dislikes: cnt } },
    { returnDocument: "after" }
  );
  if (!updateInfo)
    throw [404, `Could not update the post with id ${id}`];

  const succ = {postUpdated:true,dislikesCount:updateInfo.value.dislikes}

  return succ;

};


  //getpostbyid
  //getallposts
  //createpost
  //updatepost(like , dislikes)
  //deletepost
  //commentsbypostid
  //searchbytag
  //userbycommentid
  