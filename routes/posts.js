import {Router} from 'express';
const router = Router();
import {postData, userData} from '../data/index.js';
import  { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid, checkUsername } from '../helper.js';
import { updateLikes } from '../data/posts.js';
import { getUserById } from '../data/users.js';
import xss from 'xss';
router.route('/new').get(async (req, res) => {
  res.render('posts/createPost');
});

router
  .route('/')
  .get(async (req, res) => {
    try {
      const user= req.session.user;
      var userId = user.id
      userId = checkId(userId,'userId')
      const postList = await postData.getAllPosts()
      const username = await getUserById(userId);
      res.render('posts/index', {posts: postList, userId : userId , username : username.username });
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .post(async (req, res) =>{
    const queryPostData = req.body;
    queryPostData.title = xss(queryPostData.title)
    queryPostData.userId = xss(queryPostData.userId)
    queryPostData.content = xss(queryPostData.content)
    queryPostData.course = xss(queryPostData.course)
    queryPostData.tags = xss(queryPostData.tags)
    const userId = req.session.user.id.toString();
    const username = req.session.user.username;
    queryPostData.userId = userId;
    let errors = [];
    try {
      queryPostData.title =  checkString(queryPostData.title, 'Title');
    } catch (e) {
      errors.push(e);
    }
    try {
      queryPostData.content =  checkString(queryPostData.content, 'content');
    } catch (e) {
      errors.push(e);
    }
    try {
      queryPostData.userId =  checkString(queryPostData.userId, 'userId');
    } catch (e) {
      errors.push(e);
    }
    try {
      queryPostData.course =  checkString(queryPostData.course, 'course');
    } catch (e) {
      errors.push(e);
    }
    if (queryPostData.tags) {
      let tags = queryPostData.tags.split(',');
      try {
        queryPostData.tags =  checkStringArray(tags, 'Tags');
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) {
      
      res.status(400).render('posts/createPost', {
        errors: errors,
        hasErrors: true,
        post: queryPostData,
      });
      return;
    }
    try{
      const {title,content,userId,course,tags}=queryPostData;
      const check = await postData.createPost(title, content, userId, tags,course,username);
      if(check.postCreated){
        res.status(200).redirect(`/posts`);

      }else{
        res.status(500).json({error: "Internal Server Error"});
      }
      
    }catch(e){
      res.status(400).render('posts/createPost',{
        errors: e,
        hasErrors: true,
      })
    }
  });

  router
  .route('/:id')
  .get(async (req, res) => {
    const postId = req.params.id;
    try {
      const validPostId = checkId(postId, 'postId');
      const allPosts = await postData.getAllPosts();
  
      // Filter posts with the same posterId
      const postsWithSamePosterId = allPosts.filter(post => post.posterId === validPostId);
  
      if (postsWithSamePosterId.length === 0) {
        throw 'No posts made by you';
      }
  
      res.render('posts/postDetails', { postList: postsWithSamePosterId });
    } catch (e) {
      res.status(404).json({ error: e });
    }
  })
  // .post(async (req, res) => {
  //   const postId = req.params.id;
  //   const userId = req.session.user.userId;
  //   const userName = req.session.user.userName;
  //   const content = req.body;
  //   try {
  //     postId =  checkId(postId, 'Post ID');
  //     userId =  checkId(userId, 'User ID');
  //     userName =  checkUsername(userName, 'User Name');
  //     content =  checkString(content, 'Content');
  //     const postList = await postData.getPostById(postId);
  //     if(!postList){
  //       throw 'Error : Post Not Found'
  //     }
  //     const newComment = await postData.createComment(postId, userId, userName, content);
  //     if(newComment.commentCompleted === true){
  //       res.render('postDetails', {message : 'Sucessfully added the comment!!'});
  //     }
  //   } catch (e) {
  //     res.status(400).json({error: e});
  //   }
  // })
//})

  .post(async (req, res) => {
    const postId = req.params.id;
    const userId = req.session.user.userId;
    const userName = req.session.user.userName;
    const content =  req.body;
    content = xss(content);
    try {
      postId =  checkId(postId, 'Post ID');
      userId =  checkId(userId, 'User ID');
      userName =  checkUsername(userName, 'User Name');
      content =  checkString(content, 'Content');
      const postList = await postData.getPostById(postId);
      if(!postList){
        throw 'Error : Post Not Found'
      }
      const newComment = await postData.createComment(postId, userId, userName, content);
      if(newComment.commentCompleted === true){
        res.render('postDetails', {message : 'Sucessfully added the comment!!'});
      }
    } catch (e) {
      res.status(400).json({error: e});
    }
  })
  .patch(async (req, res) =>{
    const postId = req.params.id;
    const updatedPostData = req.body;
    updatedPostData.title = xss(updatedPostData.title);
    updatedPostData.content = xss(updatedPostData.content);
    updatedPostData.course = xss(updatedPostData.course);
    updatedPostData.tags = xss(updatedPostData.tags)
    try{
      const validPostId =  checkId(postId , 'postId');
      const existingPost = await postData.getPostById(validPostId);
      if(!existingPost){
        throw `Post with ID ${validPostId} not found` 
      }
      const validFields = ['title' , 'content' , 'course' , 'tags'];
      const updatedPost = Object.keys(updatedPostData).filter(i => validFields.includes(i));
      if(!updatedPost){
        throw 'Error : atleast one field should exist to update'
      }

      const updatedField = await postData.updatePost(validPostId,updatedPost);
      res.render('editPost', {message : 'Sucessfully updated the post !!'})
    }catch(e){
      res.status(400).render('error',{message : e})
    }
    
  })
  .delete(async (req, res) =>{
    const postId = req.params.id;
    try {
      const validPostId =  checkId(postId, 'postId');
      const postList = await postData.getPostById(validPostId);
      if(!postList){
        throw 'Error : Post Not Found'
      }
      const deletedPost = await postData.deletePost(validPostId);
      res.render('deletepost',{message : 'Succesfully deleted'})
    } catch (e) {
      res.status(400).json({ error: e });
    }
  });

  router
  .route('/tag/:tag')
  .get(async (req, res) => {
    const tag = req.params.tag;
    try {
      if(typeof tag !== 'string' || tag.trim().length === 0){
        throw 'Error : search tag is not a valid string'
      }
      const postList = await postData.getPostsByTag(tag.trim());
      if(postList.length===0){
        res.json({gotList:false,msg:"Sorry No posts found with that tag"});
      }else{
      res.json({gotList:true,posts: postList});}
    } catch (e) {
      res.status(400).json({error: e});
    }
  });



  // router
  // .route('/:id/likes')
  // .post(async (req, res) => {
  //   const postID = req.params.id;
  //   try {
  //     postID =  checkId(postID , 'postId');
  //     const postList = await postData.getPostById(validPostId);
  //     if(!postList){
  //       throw 'Error : Post Not Found'
  //     }
  //     const postLis = await postData.updateLikes(validPostId);
  //     if(postLis.updateLikes === true){
  //       res.render('posts/postDetails', {likes : postLis.likes});
  //     }
     
  //   } catch (e) {
  //     res.status(400).json({error: e});
  //   }
  // });
  // router
  // .route('/:id/dislikes')
  // .post(async (req, res) => {
  //   const postID = req.params.id;
  //   try {
  //     postID =  checkId(postID , 'postId');
  //     const postList = await postData.getPostById(postID);
  //     if(!postList){
  //       throw 'Error : Post Not Found'
  //     }
  //     const postLis = await postData.updateDislikes(postID);
  //     if(postLis.updateDislikes === true){
  //       res.render('posts/postDetails', {dislikes : postLis.dislikes});
  //     }
  //   } catch (e) {
  //     res.status(400).json({error: e});
  //   }
  // });

  router.route('/:id/update/:posterId').get(async(req,res)=>{
    if(req.session.user.id!==req.params.posterId){
      res.status(403).render('posts/wrongAccess',{wrongAccess:true});
    }else{
      const post = await postData.getPostById(req.params.id);
      res.render('posts/editPost',{post:post , postId : req.params.id});

    }
    
  });
  router.route('/:id/delete/:posterId').get(async(req,res)=>{
    if(req.session.user.id!==req.params.posterId){
      res.status(403).render('posts/wrongAccess',{wrongAccess:true});
    }else{
      try {
        const check = await postData.deletePost(req.params.id);
        if(check.deleted){
          res.render('posts/wrongAccess',{deleted:true});
          
        }
      } catch (error) {
        res.status(404).render('posts/wrongAccess',{notFound:true});
      }
      

    }
    
  });

  router.route('/:id/update').post(async(req,res)=>{
    const requestBody = req.body;
    //check to make sure there is something in req.body
    if (!requestBody || Object.keys(requestBody).length === 0) {
      return res
        .status(400)
        .json({error: 'There are no fields in the request body'});
    }
    //check the inputs that will return 400 is fail
    try {
      req.params.id = checkId(req.params.id, 'Post ID');
      if(!requestBody.title && !requestBody.course && !requestBody.content && !requestBody.tags){
        throw "You must provide atleast one field to update";
      }
      if (requestBody.title){
        requestBody.title = xss(requestBody.title);
        requestBody.title = checkString(requestBody.title, 'Title');}
      if (requestBody.course){
        requestBody.course = xss(requestBody.course)
      requestBody.course = checkString(requestBody.course, 'Course');}
      if (requestBody.content){
        requestBody.content = xss(requestBody.content)
      requestBody.content = checkString(requestBody.content, 'content');}
      
      if (requestBody.tags){
        requestBody.tags = xss(requestBody.tags)
         let tags = requestBody.tags.split(',');
        requestBody.tags = checkStringArray(
          tags,
          'Tags'
        );}
    } catch (e) {
      return res.status(400).render('posts/editPost',{hasErrors:true,error: e,post:requestBody});
    }
    //try to perform update
    try {
      const check = await postData.updatePost(
        req.params.id,
        requestBody
      );
      if(check.postUpdated){
        res.status(200).redirect(`/posts`);
      }else{
        res.status(500).json({error:"Internal Server Error"});
      }
    } catch (e) {
      return res.status(404).json({error: e});
    }
    
  });
  router.route('/:id/likes/').post(async(req,res)=>{
    const postId = req.params.id;
    const username = req.session.user.username;
    let action =req.body.action;
    action = xss(action)
    // let errors = []
    // try {
    //   postId = checkId(postId,'postId')
    // } catch (e) {
    //   errors.push(e)
    // }
    // try {
    //   username = checkString(username,'username')
    // } catch (e) {
    //   errors.push(e)
    // }
    // try {
    //   action = checkString(action,'action')
    // } catch (e) {
    //   errors.push(e)
    // }
    // if(errors.length>0){
    //   res.status(400).json({error:'bad request'});
    // }
    try {
      const succ = await postData.updateLikes(action,postId,username);
      if(succ.postUpdated){
        res.json({likesCount: succ.likesCount})
      }
      else{
        res.status(500).json({error:"Internal Server Error"});
      }
    } catch (e) {
      res.status(404).json({error: e});
      return;
    }

  });
  router.route('/:id/dislikes/').post(async(req,res)=>{
    const postId = req.params.id;
    const username = req.session.user.username;
    const action = req.body.action;
    try {
      const succ = await postData.updateDislikes(action,postId,username);
      if(succ.postUpdated){
        res.json({dislikesCount: succ.dislikesCount})
      }
      else{
        res.status(500).json({error:"Internal Server Error"});
      }
    } catch (e) {
      res.status(404).json({error: e});
      return;
    }

  });
  
 router.route('/:id/comment/').post(async(req,res)=>{
  const postId = req.params.id;
  const userId = req.session.user.id;
  const userName = req.session.user.username;
  const content = req.body.comment;
  try {
    const check = await postData.createComment(postId,userId,userName,content);
    if(check.commentCompleted){
      res.status(200).json({content:check.content,userId:userId,userName:userName})
    }else{
      res.status(500).json({error:"Internal Server Error"});
    }
  } catch (error) {
    res.status(404).json({error:error});
  }


 });

 router.route('/:id/comment/').get(async(req,res)=>{
  //const postId = req.params.id;
  try {
    const post = await postData.getPostById(req.params.id);
    res.status(200).render('posts/addComment',{post:post});
  } catch (error) {
    res.status(404).json({error:error});
  }


 });
export default router;
