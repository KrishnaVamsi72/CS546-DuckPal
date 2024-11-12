import { sessions,users } from "../config/mongoCollections.js";
import { ObjectId, ReturnDocument } from 'mongodb';
import  { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid } from '../helper.js'

async function updatePendingSessions() {
  const sessionCollection = await sessions();
  const pendingSessions = await sessionCollection.find({ 
    status: "pending"}).toArray();

  for (const session of pendingSessions) {
    if(! isTimeSlotValid(session.timeSlot,session.date))
    await sessionCollection.updateOne({ _id: session._id }, { $set: { status: "noResponse",checker:false } });
  }
}

export const getAllReceivedSessions = async (username) => {
  username =  checkString(username,'username');
  await updatePendingSessions();
  const userCollection = await users()
  const userFound = await userCollection.findOne({username:username});
  if(!userFound){
    throw 'User not Found'
  }

  const sessionCollection = await sessions();
  const receivedSessions = await sessionCollection.find({$and:[{receiverName : username },{status: { $in: ['accepted', 'pending'], $nin: ['rejected','noResponse'] }}]}).toArray();
  return receivedSessions;
};
export const getAllSentSessions = async(username) =>{
  username =  checkString(username,'username');
  await updatePendingSessions();
  const userCollection = await users()
  const userFound = await userCollection.findOne({username:username});
  if(!userFound){
    throw 'User not Found'
  }
  const sessionCollection = await sessions();
  const sentSessions = await sessionCollection.find({senderName : username }).toArray();
  return sentSessions;
};

// Function to create a new session
export const createSession = async (course,content,senderName,receiverName,date,timeSlot) => {
  course =  checkString(course,'course');
  content =  checkString(content,'content');
  senderName =  checkString(senderName,'senderName');
  receiverName =  checkString(receiverName,'receiverName')
  date =  checkString( date, 'date');
  if(! isValidDate(date)){
    throw "Please enter valid Date in mm/dd/yyyy and Date cannot be Past Date"
  }
  timeSlot =  checkString(timeSlot,'timeSlot')
  if(! isTimeSlotValid(timeSlot,date)){
    throw "Please select valid time slot and time slot cannot be in Past"
  }
  const userCollection = await users();
  const sender = await userCollection.findOne({username : senderName});
  if(sender === null) throw 'No sender with that userName'
  const receiver = await userCollection.findOne({username :receiverName});
  if(receiver===null) throw 'No receiver with that userName'
  if(senderName===receiverName){
    throw "You cannot Schedule a session with yourself!!"
  }
  const sessionCollection = await sessions();
  const checksendertimeslots = await sessionCollection.findOne({$and:[{senderName : senderName},{date : date},{timeSlot:timeSlot}]});
  if(checksendertimeslots!==null){
    throw 'You have already scheduled a session for this time slot please choose another Time slot'
  }
  const checkereceivertimeslots  = await sessionCollection.findOne({$and:[{receiverName : receiverName},{date : date},{timeSlot:timeSlot},{status :"accepted"}]});
  if(checkereceivertimeslots!==null){
    throw 'Recipient was already occupied with other study session please book other session'
  }
  const newSession = {
    course : course,
    content : content,
    senderName : senderName,
    receiverName : receiverName,
    date : date,
    timeSlot : timeSlot,
    status : "pending",
    checker : true
  }
  const insertInfo = await sessionCollection.insertOne(newSession);
  if (!insertInfo.acknowledged || !insertInfo.insertedId){
        throw 'Could not add session';}
  
  const succ = {sessionCreated : true}
  return succ;
};

export const updateSessionPatch=async(sessionId,username,status) =>{
  sessionId =  checkId(sessionId);
  username =  checkString(username);
  status =  checkString(status,'status')
  if(status!=="accepted"&&status!=="rejected"){
    throw 'Status should be either accepted or rejected';
  }
  const sessionCollection = await sessions();
  const sessionCheck = await sessionCollection.findOne({_id : new ObjectId(sessionId)});
  const userCollection = await users();
  const userCheck = await userCollection.findOne({username:username});
  if(!userCheck){
    throw 'No user with that username'
  }
  if(!sessionCheck) throw 'No session with sessionId'
  const updatedSession = await sessionCollection.findOneAndUpdate({_id : new ObjectId(sessionId)},{$set:{status:status,checker:false}},{returnDocument:'after'});
  if(!updatedSession){
    throw 'Session not updated';
  }
  const succ = {sessionUpdated : true,status:updatedSession.value.status}
  return succ;
  // const updatedReceivedSessions = await sessionCollection.find({$and:[{receiverName : username },{status: { $in: ['accepted', 'pending'], $ne: 'rejected' }}]}).toArray();
  // return updatedReceivedSessions;
}

// Function to update session details
// export const updateSession = async (sessionId, updatedSessionData) => {
//   if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0 || !ObjectId.isValid(sessionId)) {
//     throw new Error('Invalid session ID');
//   }

//   const sessionCollection = await sessions();
//   const { course, content, senderId, receiverId, date, timeSlot, status } = updatedSessionData;

//   const updatedSession = {
//     course,
//     content,
//     senderId,
//     receiverId,
//     date,
//     timeSlot,
//     status
//   };

//   const updateInfo = await sessionCollection.updateOne({ _id: new ObjectId(sessionId) }, { $set: updatedSession });

//   if (updateInfo.modifiedCount === 0) {
//     throw new Error('Could not update session');
//   }

//   const updatedSessionObj = await getSessionById(sessionId);
//   return updatedSessionObj;
// };

// // Function to delete a session
// export const deleteSession = async (sessionId) => {
//   if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0 || !ObjectId.isValid(sessionId)) {
//     throw new Error('Invalid session ID');
//   }

//   const sessionCollection = await sessions();
//   const deletionInfo = await sessionCollection.deleteOne({ _id: new ObjectId(sessionId) });

//   if (deletionInfo.deletedCount === 0) {
//     throw new Error('Could not delete session');
//   }

//   return `Session with ID ${sessionId} has been deleted`;
// };

// // Function to get sessions by user ID (sender or receiver)
// export const getSessionsByUserId = async (userId) => {
//   if (!userId || typeof userId !== 'string' || userId.trim().length === 0 || !ObjectId.isValid(userId)) {
//     throw new Error('Invalid user ID');
//   }

//   const sessionCollection = await sessions();
//   const userSessions = await sessionCollection.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).toArray();

//   return userSessions.map(session => {
//     session._id = session._id.toString();
//     return session;
//   });
// };
