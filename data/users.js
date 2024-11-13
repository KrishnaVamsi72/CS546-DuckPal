import { users } from "../config/mongoCollections.js";
import { ObjectId } from 'mongodb';
import  { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid, checkPassword, checkUsername, checkYear } from '../helper.js';
import bcrypt from 'bcryptjs';

const userCollection = await users();
const saltRounds = 10;

// 1. Add a new user
export const addUser = async (userData) => {
  const { username, password, email, fullName, major, languages, coursesEnrolled, bio, gradYear } = userData;

  if (
    !username ||
    !password ||
    !email ||
    !fullName ||
    !major ||
    !languages ||
    !Array.isArray(languages) ||
    languages.length === 0 ||
    !coursesEnrolled ||
    !Array.isArray(coursesEnrolled) ||
    coursesEnrolled.length === 0 ||
    !bio ||
    !gradYear
  ) {
    throw 'Invalid user data';
  }
  let validatedUsername = checkUsername(username, 'username');
  const validatedPassword = checkString(password, 'password');
  let validatedEmail = checkEmail(email, 'email');
  const validatedFullName = checkString(fullName, 'fullName');
  const validatedMajor = checkString(major, 'major');
  const validatedLanguages = checkStringArray(languages, 'languages');
  const validatedCoursesEnrolled = checkStringArray(coursesEnrolled, 'courses');
  const validatedBio = checkString(bio, 'bio');
  //gradYear = parseInt(gradYear);
  if (!gradYear || isNaN(parseInt(gradYear)) || parseInt(gradYear) <= 0) {
    throw 'Grad year must be a positive number!';
  }
  const validatedGradYear = checkYear(gradYear, 'gradYear');

  validatedUsername = validatedUsername.toLowerCase();
  validatedEmail = validatedEmail.toLowerCase();

  // making sure there are no existing entries of this username or email in the DB
  const existingUser = await userCollection.findOne({
    $or: [
      { username: validatedUsername.toLowerCase() },
      { email: validatedEmail.toLowerCase() }
    ]
  });

  if (existingUser) {
    if (existingUser.username === validatedUsername) {
      throw 'This username is already taken';
    } else if (existingUser.email === validatedEmail) {
      throw 'This email is already taken.';
    }
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(validatedPassword, saltRounds);

  // user insertion to DB
  const newUserObj = {
    username: validatedUsername,
    password: hashedPassword,
    email: validatedEmail,
    fullName: validatedFullName,
    major: validatedMajor,
    languages: validatedLanguages,
    coursesEnrolled: validatedCoursesEnrolled,
    bio: validatedBio,
    gradYear: validatedGradYear,
    reviews: [],
    role : "user"
  };
  const insertInfo = await userCollection.insertOne(newUserObj);
  if (!insertInfo.acknowledged || !insertInfo.insertedId || insertInfo.insertedCount === 0) throw 'Could not add user!';
  const newId = insertInfo.insertedId.toString();
  const createdUser = await getUserById(newId);
  return createdUser;
};
export const deleteUserById = async (userId) => {
  const validatedUserId = checkId(userId, 'userId');
  const user = await userCollection.findOne({ _id: new ObjectId(validatedUserId) });
  if (!user) {
    throw 'User not found with the given id.';
  }
  const deletionInfo = await userCollection.deleteOne({ _id: new ObjectId(validatedUserId) });
  if (deletionInfo.deletedCount === 0) {
    throw 'Failed to delete user.';
  }
  return { success: true };
};



// 2. Get a user by their ID
export const getUserById = async (userId) => {
  let validatedUserId = checkId(userId);

  // const userCollection = await users();
  const user = await userCollection.findOne({ _id: new ObjectId(validatedUserId.trim()) });
  if (!user || user === null) throw 'User not found with that id';
  user._id = user._id.toString();

  return user;
};


// 3. Get a user by their username
export const getUserByUsername = async (username) => {
  if (!username) throw "username must be provided!";
  const user = await userCollection.findOne({ username: username });

  return user;
}


// 3. Get a user by their email
export const getUserByEmail = async (email) => {
  if (!email) throw "email must be provided!";
  const user = await userCollection.findOne({ email: email });

  return user;
}


// 5. Get all the users
export const getAllUsers = async () => {
  const allUsers = await userCollection.find({}).toArray();
  if (allUsers.length === 0) throw "No users in the collection!";

  return allUsers;
}


// 6. Update user data
export const updateUser = async (userId, updatedUserData) => {
  try {
    const validatedUserId = checkId(userId, "userId");
    if (
      !updatedUserData ||
      typeof updatedUserData !== "object" ||
      Array.isArray(updatedUserData)
    ) {
      throw new Error("Invalid or missing updated user data.");
    }

    console.log("Validated User ID:", validatedUserId);

    const currentUser = await userCollection.findOne({
      _id: new ObjectId(validatedUserId),
    });

    console.log("Current User:", currentUser);

    if (!currentUser) {
      throw new Error("User not found with the given id.");
    }

    const {
      username,
      email,
      fullName,
      major,
      languages,
      coursesEnrolled,
      bio,
      gradYear,
    } = updatedUserData;

    // Validate and update user fields
    const updatedData = {};
    
    // Validations
    if (username && username !== currentUser.username) {
      updatedData.username = checkString(username, 'Username');
    }

    if (email && email !== currentUser.email) {
      updatedData.email = checkEmail(email, 'Email');
    }

    if (fullName && fullName !== currentUser.fullName) {
      updatedData.fullName = checkString(fullName, 'Full Name');
    }

    if (major && major !== currentUser.major) {
      updatedData.major = checkString(major, 'Major');
    }

    if (languages && Array.isArray(languages) && languages !== currentUser.languages) {
      updatedData.languages = checkStringArray(languages, 'Languages');
    }

    if (coursesEnrolled && Array.isArray(coursesEnrolled) && coursesEnrolled !== currentUser.coursesEnrolled) {
      updatedData.coursesEnrolled = checkStringArray(coursesEnrolled, 'Courses');
    }

    if (bio && bio !== currentUser.bio) {
      updatedData.bio = checkString(bio, 'Bio');
    }

    if (gradYear && gradYear !== currentUser.gradYear) {
      updatedData.gradYear = checkYear(gradYear, 'Graduation Year');
    }


    // Perform update operation if there are valid changes
    if (Object.keys(updatedData).length > 0) {
      const updatedInfo = await userCollection.findOneAndUpdate(
        { _id: new ObjectId(validatedUserId) },
        { $set: updatedData },
        { returnDocument: "after" }
      );

      console.log("Updated Info:", updatedInfo);

      if (!updatedInfo) {
        throw new Error("Could not update user.");
      }

      return { updateUser: true };
    } else {
      // No valid changes to apply
      return { updateUser: false };
    }
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
};


export const getCoursesbyUserName = async (username) =>{
  username = checkUsername(username,'username')
  const userCheck = await userCollection.findOne({username:username});
  if(userCheck===null){
    throw 'No user found with that username'
  }
  const coursesObj = await userCollection.findOne({username:username},{_id:0,coursesEnrolled:1});
  return coursesObj.coursesEnrolled;

}
export const createreviewbyuserid = async (userId, reviewId, review, rating) => {
  const validatedUserId = checkId(userId);
  const validatedReviewerId = checkId(reviewId);
  const currentUser = await getUserById(userId);
  const user = await userCollection.findOne({ _id: new ObjectId(validatedUserId) });

  if (!user) {
    throw 'Error: User not found';
  }

  // Check if review by reviewerId already exists
  const existingReview = user.reviews.find(
    (review) => review.reviewerId === validatedReviewerId
  );

  if (existingReview) {
    return {reviewexist : true , user : currentUser};
  }

  user.reviews.push({
    reviewerId: validatedReviewerId,
    review: review,
    rating: rating
  });

  await userCollection.updateOne(
    { _id: new ObjectId(validatedUserId) },
    { $set: { reviews: user.reviews } }
  );
  
  return {user : user , reviewexist  : false };
};

/////////////////////////////////////////////////////////////////////////////////////////
// OPTIONAL

// // 7. attaching post to user 
// export const addPostToUser = (userId, postId) => {
//   userId = checkId(userId, 'userId');

//   const updateInfo = await userCollection.updateOne(
//     { _id: ObjectId(userId) },
//     { $addToSet: { posts: postId } }
//   );

//   if (updateInfo.matchedCount === 0 || updateInfo.modifiedCount === 0) {
//     throw new Error('Failed to update user!');
//   }

//   return await this.getUserById(userId);
// }


// // 8. removing post from user
// export const removePostFromuser = (userId, postId) => {
//   userId = checkId(userId, 'userId');

//   const userCollection = await users();
//   const updateInfo = await userCollection.updateOne(
//     { _id: ObjectId(userId) },
//     { $pull: { posts: postId } }
//   );

//   if (updateInfo.matchedCount === 0 || updateInfo.modifiedCount === 0) {
//     throw new Error('Failed to update user!');
//   }

//   return await this.getUserById(userId);
// }
/////////////////////////////////////////////////////////////////////////////////////////




// REVIEWS data functions

// 1. Add review to User



// 2. Get reviews
export const getReviewsForUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID must be provided to fetch reviews!');
  }

  userId = checkId(userId);

  const user = await userCollection.findOne({ _id: ObjectId(userId) });
  if (!user) {
    throw new Error('User not found!');
  }

  return user.reviews;
};

export const loginUser = async (username, password) => {
  if(!username || !password){
    throw 'Both Username and Password must be supplied'
  }
  if(typeof username!== "string"){
    throw 'username should be of type string'
  }
  username = username.trim()
  if(username===""||/\d/.test(username)){
    throw 'username cannot contains numbers or it cannot be just with Spaces'
  }
  if(username.length<5||username.length>10){
    throw 'username should be at least 5 characters long with a max of 10 characters '
  }
  username=username.toLowerCase();
  if(typeof password!=="string"){
    throw 'Password should be of type string'
  }
  password = password.trim()

  if(password===""|| /\s/.test(password) || password.length<8){
    throw 'Password should not contains spaces and must be minimum 8 characters long'
  }
  if(!/[A-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/.test(password) ){
    throw 'Password should contain at least one uppercase character and at least one number and there has to be at least one special character'
  }
  const userCollection = await users();
  const usernameFound = await userCollection.findOne({username:username});
  if(!usernameFound){
    throw "Either the username or password is invalid"
  }
  let compareToMatch = false;

  try {
    compareToMatch = await bcrypt.compare(password, usernameFound.password);
  } catch (e) {
    //no op
  }

  if (compareToMatch) {
    const {password, ...dataforsessions } = usernameFound
    return dataforsessions
  } else {
    throw "Either the username or password is invalid"
  }

};


// // 3. Update review
// export const updateReviewForUser = async (userId, reviewId, updatedReview) => {
//   const validatedUserId = checkId(userId, 'userId');
//   const validatedReviewId = checkId(reviewId, 'reviewId');

//   if (!updatedReview || typeof updatedReview !== 'object') {
//     throw new Error('Invalid or missing updated review data!');
//   }

//   const { reviewerId, review, rating } = updatedReview;
//   const validatedReviewerId = checkId(reviewerId, 'reviewerId');
//   const validatedReview = checkString(review, 'review');
//   const validatedRating = checkRating(rating);

//   // targeting the specific review within the user document
//   const updateId = {
//     _id: ObjectId(validatedUserId),
//     'reviews._id': ObjectId(validatedReviewId)
//   };

//   const newReview = {
//     _id: ObjectId(validatedReviewId),
//     reviewerId: ObjectId(validatedReviewerId),
//     review: validatedReview,
//     rating: validatedRating
//   };

//   //updating review
//   const updateInfo = await userCollection.updateOne(updateId, { $set: { 'reviews.$': newReview } });

//   if (!updateInfo.matchedCount || !updateInfo.modifiedCount) {
//     throw new Error('Failed to update review.');
//   }

//   return updateInfo;
// };


// // 4. Delete review for user
// export const deleteReviewForUser = async (userId, reviewId) => {
//   if (!userId || !reviewId) {
//     throw new Error('User ID and Review ID must be provided to delete a review!');
//   }

//   const validatedUserId = checkId(userId, 'userId');
//   const validatedReviewId = checkId(reviewId, 'reviewId');

//   const updateInfo = await userCollection.updateOne(
//     { _id: ObjectId(validatedUserId) },
//     { $pull: { reviews: { _id: ObjectId(validatedReviewId) } } }
//   );

//   if (!updateInfo.matchedCount || !updateInfo.modifiedCount) {
//     throw new Error('Failed to delete review!');
//   }

//   return { success: true };
// };