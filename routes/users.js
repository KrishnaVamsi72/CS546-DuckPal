import {Router} from 'express';
const router = Router();
import { addUser, getUserById, getUserByUsername, getUserByEmail, getAllUsers, updateUser, getCoursesbyUserName, getReviewsForUser , deleteUserById , createreviewbyuserid } from '../data/users.js';
import {postData, userData} from '../data/index.js';
import  { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid, checkUsername, checkYear } from '../helper.js';
import xss from 'xss';

router.route('/')
  .get(async (req, res) => {
    try {
      const allUsers = await getAllUsers();
      res.render('admin', {allUsers})
    } catch (error) {
      res.status(404).render('error',{message : error});
    }    
  });
  router.route('/edit')
  .get(async (req , res) => {
    try {
      const userId = req.session.user.id.toString();
      const user = await getUserById(userId);
    
      const majorOptions = ["Computer Science", "Software Engineering", "Financial Engineering"];
        const languagesOptions = ["Hindi", "English", "Telugu", "French", "Italian", "Spanish", "German", "Chinese", "Japanese"];
        const coursesOptions = ["CS546", "CS555", "CS545", "CS570", "CS556", "CS513"];

        res.render('users/editUser', { user: user, majorOptions, languagesOptions, coursesOptions });
    } catch (error) {
      console.error('Error in GET /edit:', error.message);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  })  .post(async (req, res) => 
    {
      try {
        const userId = req.session.user.id.toString();
        const updatedUserData = req.body;
    
        // Validate and update specific user fields
        const updatedFields = {};
    
        // Validations
        if (updatedUserData.hasOwnProperty('username')) {
          updatedFields.username = checkUsername(updatedUserData.username, 'Username');
        }
        if (updatedUserData.hasOwnProperty('email')) {
          updatedFields.email = checkEmail(updatedUserData.email, 'Email');
        }
        if (updatedUserData.hasOwnProperty('fullName')) {
          updatedFields.fullName = checkString(updatedUserData.fullName, 'Full Name');
        }
        if (updatedUserData.hasOwnProperty('major')) {
          updatedFields.major = checkString(updatedUserData.major, 'Major');
        }
        if (updatedUserData.hasOwnProperty('languages')) {
          if (!Array.isArray(updatedUserData.languages)) {
              updatedUserData.languages = updatedUserData.languages ? [updatedUserData.languages] : [];
          }
          updatedFields.languages = checkStringArray(updatedUserData.languages, 'Languages');
        }
        if (updatedUserData.hasOwnProperty('coursesEnrolled')) {
            if (!Array.isArray(updatedUserData.coursesEnrolled)) {
                updatedUserData.coursesEnrolled = updatedUserData.coursesEnrolled ? [updatedUserData.coursesEnrolled] : [];
            }
          updatedFields.coursesEnrolled = checkStringArray(updatedUserData.coursesEnrolled, 'Courses');
        }
        if (updatedUserData.hasOwnProperty('bio')) {
          updatedFields.bio = checkString(updatedUserData.bio, 'Bio');
        }
        if (updatedUserData.hasOwnProperty('gradYear')) {
          updatedFields.gradYear = checkYear(updatedUserData.gradYear, 'Graduation Year');
        }
    
        // Perform user update if there are valid changes
        if (Object.keys(updatedFields).length > 0) {
          const updatedUser = await updateUser(userId, updatedFields);
          res.redirect(`/users/${userId}`);
        } else {
          // No valid changes to apply
          console.log('No valid updates provided');
          res.redirect(`/users/${userId}`);
        }
      } catch (error) {
        console.error('Error in POST /edit:', error);

          const userId = req.session.user.id.toString();
          const user = await getUserById(userId);
        
          const majorOptions = ["Computer Science", "Software Engineering", "Financial Engineering"];
          const languagesOptions = ["Hindi", "English", "Telugu", "French", "Italian", "Spanish", "German", "Chinese", "Japanese"];
          const coursesOptions = ["CS546", "CS555", "CS545", "CS570", "CS556", "CS513"];

          res.render('users/editUser', { user: user, error: error, majorOptions, languagesOptions, coursesOptions });
      }
    });
router.get('/:id', async (req, res) => {
        try {
          var id = req.params.id;
          id = checkId(id);
          const user =  await getUserById(id);
          
          const UserId = req.session.user;
          const loggedInUserId = UserId.id;

      
          if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
          }
      
          if (req.params.id === loggedInUserId.toString()) {
            res.render('users/index', { user, username : user.username , userId : req.params.id});
          } else {
            res.render('users/userDetails', { user : user , id : loggedInUserId});
          }
        } catch (error) {
          console.error('Error:', error.message);
          res.status(500).render('error', { message: 'Internal Server Error' });
        }
      });
router.route("/:id/reviews")
  .post(async (req, res) => {
    var user = req.session.user;
    var reviewerId = user.id.toString();
    var userId = req.params.id;
    const userdet =  await getUserById(userId);
    const body = req.body;
    body.review = xss(body.review);
    body.rating = xss(body.rating);
    try{
      reviewerId = checkId(reviewerId,'reviewerId');
      userId = checkId(userId , 'userId');
      let {review ,rating} = body;
      review = checkString(review,'review');
      rating = checkRating(rating,'rating');
    }catch(e){
      res.status(400).render('users/userDetails',{error : e,hasErrors:true,user:userdet});
      return;//page where  the user sees another users profile
    }
    try{
      const review = await createreviewbyuserid(userId, reviewerId , body.review ,body.rating);
      if(review.reviewexist === true){
        res.status(200).render('users/userDetails',{hasErrors:true,error : 'Your review already exists' , user : await getUserById(userId)})
      }
      if(review.reviewexist === false){
        res.redirect(`/users/${userId}`)
      }
      
    }catch(e){
      res.status(404).render('users/userDetails',{message : e})
    }
  
});
router.route("/delete").post(async (req, res) => {
  const user = req.session.user;
  var userId =user.id.toString();
  try{
    userId = checkId(userId,'userId');
  }catch(e){
    res.status(400).render('users/deleteUser', {message : e})
  }
  try{
    const deleted = await deleteUserById(userId);
    if(deleted.success === true){
      req.session.destroy((err) => {
        res.status(200).render('users/deleteUser', {message : "succesfully deleted!!"})
  
      })
    }
  }
  catch(e){
    res.status(404).render('users/deleteUser',{message : e})
  }
}); 
export default router;