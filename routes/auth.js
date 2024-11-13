import { Router } from "express";
import { users } from "../config/mongoCollections.js";
import { addUser, loginUser } from "../data/users.js";
import {
  checkId,
  checkString,
  checkStringArray,
  checkEmail,
  checkRating,
  isValidDate,
  isTimeSlotValid,
  checkPassword,
  checkUsername,
  checkYear
} from "../helper.js";
import bcrypt from "bcrypt";
import xss from "xss";
const router = Router();

router.route("/").get(async (req, res) => {
  try {
    return res.json({ error: "YOU SHOULD NOT BE HERE!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router
  .route("/register")
  .get(async (req, res) => {
    try {
      res.status(200).render("signup", { title: "Duckpal" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .post(async (req, res) => {
    try {
      let { username, password, email, fullName, major, languages, coursesEnrolled, bio, gradYear } = req.body;
      username = xss(username);
      password = xss(password);
      email = xss(email);
      fullName = xss(fullName);
      major = xss(major);
      bio = xss(bio);
      gradYear = xss(gradYear);
      const validatedUsername =  checkUsername(username, 'username');
      const validatedPassword =  checkPassword(password);
      const validatedEmail =  checkEmail(email);
      const validatedFullName =  checkString(fullName, 'fullName');
      const validatedMajor =  checkString(major, 'major');
      
      //coursesEnrolled = coursesEnrolled.split(',');
      //const validatedLanguages = languages.split(',').map(lang => lang.trim());
      //const validatedCoursesEnrolled = coursesEnrolled.split(',').map(course => course.trim());

      // Validate arrays of languages and courses enrolled
      const validatedLanguagesArray = checkStringArray( languages,'languages');
      const validatedCoursesEnrolledArray = checkStringArray(coursesEnrolled, 'coursesEnrolled');

      const validatedBio =  checkString(bio, 'bio');
      const validatedGradYear =  checkYear(gradYear, 'gradYear');

      const newUser = await addUser({
        username: validatedUsername,
        password: validatedPassword,
        email: validatedEmail,
        fullName: validatedFullName,
        major: validatedMajor,
        languages: validatedLanguagesArray,
        coursesEnrolled: validatedCoursesEnrolledArray,
        bio: validatedBio,
        gradYear: validatedGradYear
      });

      res.status(200).render('signup', { message: 'Successfully Registered. You can login now.',hasMessage:true });
    } catch (error) {
      res.status(400).render('signup', {
        title: 'Signup Form',
        hasMessage: true,
        message: error || error.message || 'Error: Internal Server Error'
    });
    }
  });
router
  .route("/login")
  .get(async (req, res) => {
    try {
      res.status(200).render("login", { title: "Welcome to Duckpal" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
  .post(async (req, res) => {
    var userData =req.body;
    userData.username = xss(req.body.username);
    userData.password = xss(req.body.password);

    let errors = [];
    try {
      userData.username = checkString(userData.username,'username');
      userData.username = checkUsername(userData.username,'username');
    } catch (e) {
      errors.push(e)
    }
    try {
      if(!userData.password || typeof userData.password!=="string"){
        throw 'Password should exists and should be of type string'
      }
      userData.password = userData.password.trim()
    
      if(userData.password===""|| /\s/.test(userData.password) || userData.password.length<8){
        throw 'Password should not contains spaces and must be minimum 8 characters long'
      }
      if(!/[A-Z]/.test(userData.password) || !/\d/.test(userData.password) || !/[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/.test(userData.password) ){
        throw 'Password should contain at least one uppercase character and at least one number and there has to be at least one special character'
      }
    } catch (e) {
      errors.push(e)
    }
    if(errors.length>0){
      res.status(400).render('login',{
        errors : errors,
        hasErrors : true,
      });
      return;
    }
    try{
      const {username,password} = userData
      const check = await loginUser(username,password)
      req.session.user = {id:check._id,username : check.username,
      fullName : check.fullName,
    coursesEnrolled : check.coursesEnrolled,role:check.role}

      //const tp = req.session.user.id.toString();
      
      res.status(200).redirect('/posts')
      
    }
    catch(e){
      errors.push(e)
      res.status(400).render('login',{
        errors : errors,
        hasErrors : true,
       });
       return ;
    }

    
  });
router.route("/logout").get(async (req, res) => {
  try {
    req.session.destroy();
    res.status(200).render("logout");
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
    