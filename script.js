const firebaseConfig = {
  apiKey: "AIzaSyBEgrJ84sPLf3Fp4JL6ovpWfPISiVflB6U",
  authDomain: "birthday-counter-2da86.firebaseapp.com",
  databaseURL: "https://birthday-counter-2da86-default-rtdb.firebaseio.com",
  projectId: "birthday-counter-2da86",
  storageBucket: "birthday-counter-2da86.firebasestorage.app",
  messagingSenderId: "718441541668",
  appId: "1:718441541668:web:2a8dce4011fa3cdd7528b1"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

function getElementFromDOM(elementId) {
    return document.getElementById(elementId);
}

function hideDOMElement(element) {
    element.style.display = "none";
}

function showDOMElement(element) {
    if(element.id === "welcome") {
        element.style.display = "flex";
        element.style.justifyContent = "center";
        element.style.alignItems = "center";
    } else {
        element.style.display = "block";
    }
}

const welcome = getElementFromDOM("welcome");
const signUpNewUserButton = getElementFromDOM("newUserRegistration");
const loginExistingUserButton = getElementFromDOM("exisingUserLogin");
const signOutButton = getElementFromDOM("signOutButton");
const signUpForm = getElementFromDOM("signUpForm");
const loginForm = getElementFromDOM("loginForm");
const birthdayDetailsSection = getElementFromDOM("birthdayDetails");
const remainingDaysSection = getElementFromDOM("remainingDaysDetails");
const submitButton = getElementFromDOM("submitButton");

// Events and Logic to be handled at page load/refresh
window.addEventListener("DOMContentLoaded", ()=>{
    // Visibility of DOM elements handled for page refresh.
    showDOMElement(welcome);
    hideDOMElement(signUpForm);
    hideDOMElement(loginForm);
    hideDOMElement(birthdayDetailsSection);
    hideDOMElement(remainingDaysSection);
    hideDOMElement(signOutButton);

    // To check when state of user had changed (ie, logged in user/ logged out user)
    auth.onAuthStateChanged((user) => {
        if (user) {
            // If user logged in, user's name and birthdate accessed and birthdayLogic called.
            // birthdayLogic is called inside onAuthStateChanged inside window.addEventListener
            // for when user refreshes the session, the login/signup events are not triggered. Even
            // in that case, birthdayLogic will be triggered and user can continue to be in birthday
            // screen. Also there might be a time delay when accessing user data after successful
            // signup of user. In that case, immediately reading from the dB will return null. To 
            // prevent that from breaking the UI, the UI updates as well as data fetching is given
            // inside onAuthStateChanged() so that whenever login states are changed, data is accessed
            // and UI is handled only once data is successfully retrieved and DOM elements are updated.
            const uid = user.uid;
            console.log("Current user logged in with id:", uid);
            db.ref('users').child(uid).get().then((snapshot) => {
                if (snapshot.exists()) {
                    // console.log(snapshot.val());
                    const userData = snapshot.val();
                    const userName = userData.name;
                    const birthDate = userData.birthdate;
          
                    hideDOMElement(welcome);
                    showDOMElement(signOutButton);
          
                    birthdayLogic(userName, birthDate);
                    // console.log("User's birthday", birthDate);
                }
            }).catch((error) => { 
                console.log(error);
            })
        } else {
            // If no user logged in, visibility of elements handled.
            showDOMElement(welcome);
            hideDOMElement(signOutButton);
            hideDOMElement(birthdayDetailsSection);
            hideDOMElement(remainingDaysSection);
            // console.log("No user currently logged in")
        }
    });

});

// Element visibility on Sign Up page
signUpNewUserButton.addEventListener("click", () => {
    hideDOMElement(welcome);
    showDOMElement(signUpForm);
})

// Element visibility on Login page
loginExistingUserButton.addEventListener("click", () => {
    hideDOMElement(welcome);
    showDOMElement(loginForm);
})

const backFromSignUp = getElementFromDOM("backFromSignUp");
const backFromLoginIn = getElementFromDOM("backFromLogin");

// Logic for back button from Sign Up page
backFromSignUp.addEventListener('click', () => {
    hideDOMElement(signUpForm);
    showDOMElement(welcome);
})

// Logic for back button from Login page
backFromLoginIn.addEventListener('click', () => {
    hideDOMElement(loginForm);
    showDOMElement(welcome);
})

// Registering User with Email and Password
async function createUser(email, password) {
    try {
        let userData = await auth.createUserWithEmailAndPassword(email, password);
        // console.log(userData);
        return userData;
    } catch(error) {
        console.log(error);
    }
}

// Creating user data object for posting to DB
function createUserDataForDB(id, name, birthdate, email) {
    return userData = {
        id: id,
        name: name,
        birthdate: birthdate,
        email: email
    }
}  

// Posting userData to DB
function postDataToFirebaseDb(data) {
    const ref = db.ref('users').child(data.id);
    return ref.set({
        id: data.id,
        name: data.name,
        birthdate: data.birthdate,
        email: data.email
    })
}

// Function to fetch quote from Random Quotes API
async function fetchQuoteForBirthday() {
    const url = "https://zenquotes.io/api/random";
    // Using Proxy to bypass CORS Error
    const proxyURL = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);
    try {
        const response = await fetch(proxyURL)  
        if(response.ok) {
            const jsonResponse = await response.json();
            const jsonObject = JSON.parse(jsonResponse.contents);
            // console.log("Birthday Quote: ", jsonObject[0].q);
            // console.log("Birthday Quote: ", jsonObject[0].a);
            return {quote: jsonObject[0].q, author: jsonObject[0].a};
        }
    } catch(error) {
        console.log(error);
        // Backup quote
        return {
            quote: "It is never too late to be what you might have been.", 
            author: "George Eliot"
        }
    }
}

// Function to count remaining days until next birthday
function countRemainingDaysUntilBirthday(today, date, month) {
    // console.log(date,month);

    // Creating user's next birthday based on month and date accessed from user, and year
    // extracted from current date's year.
    let userNextBirthday = new Date(today.getFullYear(), month, date);
    // console.log("User's birthday in current year", userNextBirthday);
    // console.log("Today", today);

    // Checking if user's birthay has already passed this year.
    // In that case, computing user's next birthday as next year's birthday.
    if(userNextBirthday < today) {
        userNextBirthday = new Date(today.getFullYear() + 1, month, date);
    }

    const millisecondInADay = 24*60*60*1000;
    // userNextBirthday - today => returns answer in milliseconds
    remainingNumberOfDays = Math.ceil((userNextBirthday - today)/millisecondInADay);
    // console.log(remainingNumberOfDays);
    return remainingNumberOfDays;
}

// Function to capitalise user's name to print along with Birthday Message
function capitaliseFirstLetterOfName(name) {
    const names = name.split(" ");
    const capitalisedNames = names.map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
    return capitalisedNames.join(" ");
}

// Function to display Happy Birthday message in DOM
async function displayBirthdayMessage(name) {
    // console.log(`Happy Birthday ${name}`);
    const {quote, author} = await fetchQuoteForBirthday();

    getElementFromDOM("birthdayHeading").innerHTML = "";
    getElementFromDOM("birthdayHeading").textContent = `Happy Birthday, ${capitaliseFirstLetterOfName(name)}!`;

    getElementFromDOM("birthdayQuote").innerHTML = "";
    getElementFromDOM("birthdayQuote").textContent = `"${quote}"`;

    getElementFromDOM("quoteAuthor").innerHTML = "";
    getElementFromDOM("quoteAuthor").textContent = author;
}

// Function to display remaining number of days for next birthday in DOM
function displayRemainingDays(days) {
    showDOMElement(remainingDaysSection);

    getElementFromDOM("remainingDays").innerHTML = "";
    getElementFromDOM("remainingDays").textContent = `${days} DAYS LEFT`;
}


// Function which checks whether birthday is today or not
function birthdayLogic(name, userBirthDate) {
    // Getting today's date => Date accessed in current timezone
    const todayDate = new Date();

    //Resetting time to midnight 00:00 for accurate comparisons across timezones
    todayDate.setHours(0,0,0,0); 

    // Reorganizing the user birthdate
    // First userBirthDate value split and extracted as year, month, day.
    // Then new Date created from userBirthDate using New Date() constructor, which gives 
    // birthday in current timezone, aligning with todayDate's timezone.
    // Resetting the birthDateFromUser time to midnight for accuracy in comparison.
    const[year, month, day] = userBirthDate.split("-").map(Number);
    const birthDateFromUser = new Date(todayDate.getFullYear(), month-1, day);
    birthDateFromUser.setHours(0,0,0,0);

    // Explicitly hiding both sections before deciding which one to show based on condition
    hideDOMElement(birthdayDetailsSection);
    hideDOMElement(remainingDaysSection);
 
    // Comparing date and month to check if birthday is today
    if((birthDateFromUser.getDate() === todayDate.getDate()) && (birthDateFromUser.getMonth() === todayDate.getMonth())) {
        showDOMElement(birthdayDetailsSection);
        displayBirthdayMessage(name);
        // console.log("Birthday is today");
    } else {
        const remainingDays = countRemainingDaysUntilBirthday(todayDate, birthDateFromUser.getDate(), birthDateFromUser.getMonth());
        showDOMElement(remainingDaysSection);
        displayRemainingDays(remainingDays);
    }
}


// Sign up Form submit button event handler
submitButton.addEventListener("click", async(event) => {
    event.preventDefault();

    const registeredName = getElementFromDOM("name");
    const birthDate = getElementFromDOM("birthdate");
    const registeredEmail = getElementFromDOM("email");
    const registeredPassword = getElementFromDOM("password");

    // hiding birthday page here to prevent old data(previous user's) from showing up on screen.
    // birthday section visibility effectively handled inside birthdayLogic().
    hideDOMElement(birthdayDetailsSection);
    hideDOMElement(remainingDaysSection);

    const nameValue = registeredName.value;
    const birthDateValue = birthDate.value;
    const emailValue = registeredEmail.value;
    const passwordValue = registeredPassword.value;

    
    // console.log(emailValue,passwordValue);
    try {
        const createUserSuccessful = await createUser(emailValue, passwordValue);
        // console.log(createUserSuccessful);
        const uid = createUserSuccessful.user.uid;

        let userData = createUserDataForDB(uid, nameValue, birthDateValue, emailValue);
        // console.log("UserData", userData);

        const successfulDataToDb = await postDataToFirebaseDb(userData);
        console.log("Data successfully posted to DB", successfulDataToDb);
        alert("User has been registered");
        
        hideDOMElement(signUpForm);
        hideDOMElement(welcome);
        showDOMElement(signOutButton);

        birthdayLogic(nameValue, birthDateValue);

        // Once submit done, signUp form input fields cleared.
        getElementFromDOM("formForSignUp").reset();
    } catch(error) {
        console.log(error);
        alert("Signup failed. Check if email is registered.")
    }  
})

// Login Existing User
const loginEmail = getElementFromDOM("loginEmail");
const loginPassword = getElementFromDOM("loginPassword");
const loginButton = getElementFromDOM("loginButton");

// Function to handle logging in of user using Email and Password.
async function loginUser(email, password) {
    try {
        let userData = await auth.signInWithEmailAndPassword(email, password);
        console.log("User has successfully logged in", userData.user.uid);
        return userData;
    } catch(error) {
        console.log(error);
    }
}

// Function to handle login button event handling functionality 
loginButton.addEventListener("click", async(event) => {
    event.preventDefault();
    const emailValue = loginEmail.value;
    const passwordValue = loginPassword.value;

    // hiding birthday page here to prevent old data(previous user's) from showing up on screen.
    // birthday section visibility effectively handled inside birthdayLogic().
    hideDOMElement(birthdayDetailsSection);
    hideDOMElement(remainingDaysSection);

    try {
        const userDataAfterLogin = await loginUser(emailValue, passwordValue);
        // console.log("User data after login", userDataAfterLogin);
        const uid = userDataAfterLogin.user.uid;
        const snapshot = await db.ref('users').child(uid).get();
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const name = userData.name;
            const birthDate = userData.birthdate;

            // Hiding LoginForm and welcome screen after making sure data has been fetched from DB.
            hideDOMElement(loginForm);
            hideDOMElement(welcome);
            showDOMElement(signOutButton);

            birthdayLogic(name, birthDate);
                    
            // Once submit done, login form input fields cleared.
            getElementFromDOM("formForLogin").reset();
        }
    } catch(error) {
        console.log(error);
        alert("Login failed. Check email and password")
    }
})

// Function for sign out button event handling
signOutButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const logOutInProgress = await auth.signOut();
    console.log("User has successfully logged out", logOutInProgress);

    // Updating visibility of elements on successful signOut
    showDOMElement(welcome);
    hideDOMElement(birthdayDetailsSection);
    hideDOMElement(signOutButton);
    hideDOMElement(remainingDaysSection);
})
