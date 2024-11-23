// seeding DB

import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import {addUser} from '../data/users.js';
//import posts from '../data/posts.js';

const db = await dbConnection();
await db.dropDatabase();
const u1 = {
  username : "praneeth",
  password : "Jack$Jill1124",
  email : "pnadella@stevens.edu",
  fullName : "Praneeth Nadella", 
  major : "Tesstingggg", 
  languages : ["testst","abccccc"],
  coursesEnrolled : ["abc","abhdh","sjksksk"] ,
  bio : "DSHGGGGGGGKLDGJFJDFSKLJGFIADJKJVNXJGNGVJNFGEKJNVEEMIOVMK HBFDBSJKD ISDJVSKJAN", 
  gradYear : '2024',
  
}
const u2 = {
  username : "vamsipe",
  password : "Jack$Jill1124",
  email : "vam@stevens.edu",
  fullName : "vamsifi", 
  major : "Tesstingggg", 
  languages : ["testst","abccccc"],
  coursesEnrolled : ["abc","abhdh","sjksksk"] ,
  bio : "DSHGGGGGGGKLDGJFJDFSKLJGFIADJKJVNXJGNGVJNFGEKJNVEEMIOVMK HBFDBSJKD ISDJVSKJAN", 
  gradYear : '2024'
}
// const u3 = {
//   username : "krantisr",
//   password : "Jack$Jill1124",
//   email : "kranti@stevens.edu",
//   fullName : "kranti", 
//   major : "Tesstingggg", 
//   languages : ["testst","abccccc"],
//   coursesEnrolled : ["abc","abhdh","sjksksk"] ,
//   bio : "DSHGGGGGGGKLDGJFJDFSKLJGFIADJKJVNXJGNGVJNFGEKJNVEEMIOVMK HBFDBSJKD ISDJVSKJAN", 
//   gradYear : '2023'
// }

const praneeth = await addUser(u1);
const r2 = await addUser(u2);

//const r3 = await addUser(u2);
//const pid = patrick._id.toString();
//const aiden = await users.addUser('Aiden', 'Hill');
//const aid = aiden._id.toString();
//await posts.addPost('Hello, class!', 'Today we are creating a blog!', pid);
// await posts.addPost(
//   'Using the seed',
//   'We use the seed to have some initial data so we can just focus on servers this week',
//   pid
// );

// await posts.addPost(
//   'Using routes',
//   'The purpose of today is to simply look at some GET routes',
//   pid
// );

// await posts.addPost("Aiden's first post", "This is aiden's first post", aid, [
//   'toys'
// ]);
// await posts.addPost("Aiden's second post", "This is aiden's second post", aid, [
//   'aiden'
// ]);
// await posts.addPost("Aiden's third post", "This is aiden's thrid post", aid, [
//   'aiden',
//   'kid'
// ]);

console.log('Done seeding database');
await closeConnection();
