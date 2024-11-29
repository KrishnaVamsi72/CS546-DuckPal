import { ObjectId } from 'mongodb';
const checkId = (id, varName) => {
  if (!id) throw `Error: You must provide a ${varName}`;
  if (typeof id !== 'string') throw `Error:${varName} must be a string`;
  id = id.trim();
  if (id.length === 0)
    throw `Error: ${varName} cannot be an empty string or just spaces`;
  if (!ObjectId.isValid(id)) throw `Error: ${varName} invalid object ID`;
  return id;
};
const checkPassword = (password) => {
  password = password.trim();
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be provided as a string, at least 8 characters long, must contain at least one uppercase letter, and one special character.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long, must contain at least one uppercase letter, and one special character.');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter.');
  }
  if (!/[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/.test(password)) {
    throw new Error('Password must contain at least one special character.');
  }
  return password;
};
const checkUsername = (value, fieldName) => {
  // Check if value is a string and matches the specified criteria
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  // Check if the value contains any non-letter characters
  if (!/^[a-zA-Z]+$/.test(value)) {
    throw new Error(`Invalid ${fieldName}. ${fieldName} must contain only letters (capital or small).`);
  }

  // Check if the length of the trimmed value is between 5 and 10 characters
  const trimmedValue = value.trim();
  if (trimmedValue.length < 5 || trimmedValue.length > 10) {
    throw new Error(`${fieldName} must be between 5 and 10 characters long.`);
  }

  // Convert the username to lowercase
  const lowercaseUsername = trimmedValue.toLowerCase();

  return lowercaseUsername;
};


const checkString = (strVal, varName) => {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  if (!isNaN(strVal))
    throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
  return strVal;
};

const checkStringArray = (arr, varName) => {
  if (!arr || !Array.isArray(arr))
    throw `You must provide atleast one ${varName}`;
  for (let i in arr) {
    if (typeof arr[i] !== 'string' || arr[i].trim().length === 0) {
      throw `One or more elements in ${varName} array is not a string or is an empty string`;
    }
    arr[i] = arr[i].trim();
  }

  return arr;
};

const checkEmail = (email) => {
  const emailRegex = /^[a-zA-Z]+@stevens\.edu$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address. Email must be in the format username@stevens.edu and contain only alphabetic characters before @.');
  }
  email = email.toLowerCase();

  return email;
};

const checkRating = (rating) => {
  const parsedRating = parseFloat(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new Error('Invalid rating. Rating must be a number between 1 and 5.');
  }
  return parsedRating;
};

const isValidDate = (dateString) => {
  var regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
      return false;
  }
  
  var dateParts = dateString.split('/');
  var month = parseInt(dateParts[0], 10);
  var day = parseInt(dateParts[1], 10);
  var year = parseInt(dateParts[2], 10);
  var date = new Date(year, month-1, day);
  if(day===29 && month===2){
    return false;
  }
  var currentdate  = new Date()
  currentdate.setHours(0,0,0,0);

  if(date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day && date >= currentdate)
  {
  
    return true;
  }
  return false;
};

const isTimeSlotValid = (selectedTimeSlot, dateString) => {
  var regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
      return false;
  }
  
  var dateParts = dateString.split('/');
  var month = parseInt(dateParts[0], 10);
  var day = parseInt(dateParts[1], 10);
  var year = parseInt(dateParts[2], 10);
  var date = new Date(year, month-1, day);
  if(day===29 && month===2){
    return false;
  }
  var currentdate  = new Date()
  currentdate.setHours(0,0,0,0);

  if(date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day) {
        if(date > currentdate){
          return true;
        }
        else if(date<currentdate){
          return false;
        }
      }
  else{
    return false;
  }
  var selectedStartTime = selectedTimeSlot.split(" - ")[0];
  var selectedEndTime = selectedTimeSlot.split(" - ")[1];

  // Parse selected start time
  var selectedStartParts = selectedStartTime.split(/:| /);
  var selectedStartHour = parseInt(selectedStartParts[0], 10);
  var selectedStartMinute = parseInt(selectedStartParts[1], 10);
  var selectedStartPeriod = selectedStartParts[2].toLowerCase();

  // Adjust hours for PM
  if (selectedStartPeriod === "pm" && selectedStartHour !== 12) {
      selectedStartHour += 12;
  }

  // Parse current time
  var currentDate = new Date();
  var currentHour = currentDate.getHours();
  var currentMinute = currentDate.getMinutes();

  // Compare hours and minutes
  if (selectedStartHour > currentHour || 
      (selectedStartHour === currentHour && selectedStartMinute > currentMinute)) {
      return true;
  } else {
      return false;
  }
};

const checkYear = (yearValue, varName) => {
  // Ensure yearValue is provided and a string
  if (!yearValue || typeof yearValue !== 'string') {
    throw new Error(`Invalid ${varName}. Year must be provided as a string.`);
  }

  // Parse the yearValue as an integer
  const year = parseInt(yearValue, 10);

  // Check if the parsed year is a valid number
  if (isNaN(year) || year <= 0) {
    throw new Error(`Invalid ${varName}. Year must be a positive number.`);
  }

  // Get the current year
  const currentYear = new Date().getFullYear();

  // Check if the year is a future year (including the current year)
  if (year >= currentYear) {
    return year.toString(); // Return the valid year value
  } else {
    throw new Error(`Invalid ${varName}. Year must be the current year or a future year.`);
  }
};

export { checkId, checkString, checkStringArray, checkEmail, checkRating, isValidDate, isTimeSlotValid , checkPassword , checkUsername, checkYear};