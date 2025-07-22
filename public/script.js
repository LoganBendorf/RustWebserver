"use strict";
// const SITE_NAME = "https://www.purplesite.skin";
const SITE_NAME = "http://127.0.0.1:7878";
const MAX_NAME_CHARACTERS = 15;
const MAX_TITLE_CHARACTERS = 24;
const MAX_COMPOSE_CHARACTERS = 200;
const DELIMITER = ";;.";
let currentUsername;
const DEBUG_GENERAL = false;
const DEBUG_EMAILS = true;
var input_style;
(function (input_style) {
    input_style[input_style["KEYBOARD"] = 0] = "KEYBOARD";
    input_style[input_style["MOUSE"] = 1] = "MOUSE";
})(input_style || (input_style = {}));
;
var vote_type;
(function (vote_type) {
    vote_type["UPVOTE"] = "upvote";
    vote_type["UN_UPVOTE"] = "unupvote";
})(vote_type || (vote_type = {}));
;
var pages;
(function (pages) {
    pages[pages["LANDING"] = 0] = "LANDING";
    pages[pages["HALL_OF_FAME"] = 1] = "HALL_OF_FAME";
})(pages || (pages = {}));
;
var error;
(function (error) {
    error["BAD_INT"] = "BAD_INT";
    error["BAD_DATE"] = "BAD_DATE";
    error["EMPTY_INPUT"] = "EMPTY_INPUT";
})(error || (error = {}));
;
document.addEventListener("click", globalClickListener);
document.addEventListener("keydown", globalKeyDownListener);
const emojiButton = document.querySelector('.emojiButton');
const inputs = Array.from(document.querySelectorAll('.composeInput'));
for (const input of inputs) {
    console.log("loop");
    input.style.width = "50px";
    input.onkeypress = resizeInput;
    input.onkeyup = resizeInputUp;
}
const textArea = document.querySelector('.textAreaInput');
textArea.addEventListener('keydown', textAreaResizeInput);
textArea.onkeyup = textAreaResizeInputUp;
function safeParseInt(value) {
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return { ok: false, err: error.BAD_INT };
        }
        return { ok: true, val: Math.floor(value) };
    }
    const trimmed = value.trim();
    if (trimmed === '') {
        return { ok: false, err: error.EMPTY_INPUT };
    }
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) {
        return { ok: false, err: error.BAD_INT };
    }
    return { ok: true, val: parsed };
}
class Email {
    id;
    sender;
    title;
    body;
    hash;
    time_created;
    constructor(id, sender, title, body, hash, 
    // public upvotes: number,
    time_created) {
        this.id = id;
        this.sender = sender;
        this.title = title;
        this.body = body;
        this.hash = hash;
        this.time_created = time_created;
    }
    static createEmail(id, sender, title, body, hash, /* upvotes: number | string,*/ time_created) {
        const idResult = safeParseInt(id);
        if (!idResult.ok) {
            return { ok: false, err: "id (" + id + ") failed to become number. Error code: " + idResult };
        }
        const hashResult = safeParseInt(hash);
        if (!hashResult.ok) {
            return { ok: false, err: "hash (" + hash + ") failed to become number. Error code: " + hashResult };
        }
        const timeResult = safeParseInt(time_created);
        if (!timeResult.ok) {
            return { ok: false, err: "time_created (" + time_created + ") failed to become number. Error code: " + timeResult };
        }
        const date = new Date(timeResult.val * 1000);
        if (isNaN(date.getTime())) {
            return { ok: false, err: "time_created (" + time_created + ") failed to become Date. Error code: " + error.BAD_DATE };
        }
        return {
            ok: true, val: new Email(idResult.val, sender, title, body, hashResult.val, date)
        };
    }
}
class Vote {
    sender;
    title;
    hash;
    constructor(sender, title, hash) {
        this.sender = sender;
        this.title = title;
        this.hash = hash;
    }
    static createVote(sender, title, hash) {
        const hashResult = safeParseInt(hash);
        if (!hashResult.ok) {
            return hashResult;
        }
        return {
            ok: true, val: new Vote(sender, title, hashResult.val)
        };
    }
}
let UserEmails;
let UserVotes;
function globalClickListener(event) {
    console.log("globalClickListener()");
    console.log(event);
    console.log(event.target);
    closeEmojiMenuIfShould(event, input_style.MOUSE);
}
async function globalKeyDownListener(event) {
    closeEmojiMenuIfShould(event, input_style.KEYBOARD);
    // Check if should update emails
    if (event.key === 'Tab') {
        console.log("key equaled tab\n");
        currentUsername = document.querySelector('.usernameInput').value;
        await getVotes();
        getEmails();
    }
}
function closeEmojiMenuIfShould(event, inputStyle) {
    console.log("closeEmojiMenuIfShould() called");
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    if (emojiButton.hasChildNodes()) {
        let shouldClose = true;
        if (inputStyle === input_style.MOUSE) {
            const classes = target.className.split(' ');
            console.log(classes);
            for (let i = 0; i < classes.length; i++) {
                if (classes[i] === 'emoji') {
                    shouldClose = false;
                    break;
                }
            }
        }
        if (shouldClose) {
            const children = emojiButton.children;
            for (let i = children.length - 1; i >= 0; i--) {
                if (children[i] === null || children[i] === undefined) {
                    continue;
                }
                if (children[i].className === null || children[i].className === undefined) {
                    continue;
                }
                const classes = children[i].className.split(' ');
                for (let j = 0; j < classes.length; j++) {
                    if (classes[j] === "emojiChild") {
                        children[i].remove();
                        break;
                    }
                }
            }
        }
    }
}
function goToHallOfFame() {
    console.log("goToHallOfFame()");
    location.replace(SITE_NAME + "/hall_of_fame");
}
function goToLanding() {
    console.log("goToLanding()");
    location.replace(SITE_NAME);
}
function sendFunction() {
    // sends email
    console.log("sendFunction()");
    makePost();
}
function emojiFunction() {
    // opens emoji menu
    console.log("emojiFunction()");
    const emojiChildren = document.querySelector(".emojiChild");
    if (emojiChildren !== null) {
        console.log("emojiButton has children, do nothing");
        return;
    }
    const emojiMenu = document.createElement('div');
    emojiMenu.classList.add('emoji', 'emojiChild', 'emojiMenu');
    for (let i = 0; i < 9; i++) {
        const emojiContainer = document.createElement('div');
        const emojiCode = String.fromCodePoint(128516 + i); // '128516' is character code
        emojiContainer.textContent = emojiCode;
        emojiContainer.classList.add('emoji', 'emojiChild', 'littleEmoji');
        emojiContainer.addEventListener("click", addEmojiToComposeArea);
        emojiMenu.appendChild(emojiContainer);
        console.log("emoji generated");
    }
    emojiButton.appendChild(emojiMenu);
    console.log("emojiMenu created");
}
function addEmojiToComposeArea(event) {
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    const composeInput = document.querySelector('.textAreaInput');
    let string = "";
    if (composeInput.value !== null) {
        if (composeInput.value.length >= MAX_COMPOSE_CHARACTERS) {
            return;
        }
        string = composeInput.value + target.textContent;
    }
    else {
        string = target.value;
    }
    composeInput.value = string;
}
// stupid emojis count as 2 characters even though they are 4 bytes????
function resizeInput(event) {
    console.log("resizeInput()");
    const key = event.key;
    console.log(key);
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    const classes = target.className.split(' ');
    let name = 0;
    let title = 0;
    for (let i = 0; i < classes.length; i++) {
        if (classes[i] === 'recipientInput' || classes[i] === 'usernameInput') {
            name = 1;
            break;
        }
        if (classes[i] === 'titleInput') {
            title = 1;
            break;
        }
    }
    if (target.value.length >= (MAX_NAME_CHARACTERS * name + MAX_TITLE_CHARACTERS * title)) {
        if (key == "Backspace" || key == "Delete") {
            // return key;
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        // return false;
        return;
    }
    target.style.width = (target.value.length + 1) * .5 + 1.25 + "em";
}
async function resizeInputUp(event) {
    const key = event.key;
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    const classes = target.className.split(' ');
    let name = 0;
    let title = 0;
    for (let i = 0; i < classes.length; i++) {
        if (classes[i] === 'recipientInput' || classes[i] === 'usernameInput') {
            name = 1;
            break;
        }
        if (classes[i] === 'titleInput') {
            title = 1;
            break;
        }
    }
    const max = (MAX_NAME_CHARACTERS * name + MAX_TITLE_CHARACTERS * title);
    if (target.value.length >= max) {
        console.log("input truncated");
        target.value = target.value.slice(0, max);
    }
    target.style.width = (target.value.length + 1) * .5 + 2.25 + "em";
    // Check if should update emails
    if (key === 'Enter') {
        console.log("key equaled enter\n");
        for (let i = 0; i < target.classList.length; i++) {
            if (target.classList[i] === 'usernameInput') {
                console.log("class equaled usernameInput\n");
                currentUsername = target.value;
                await getVotes();
                getEmails();
            }
        }
    }
}
const textAreaSize = 600;
function textAreaResizeInput(event) {
    console.log("textAreaResizeInput()");
    const key = event.key;
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    if (target.value.length >= textAreaSize) {
        if (key == "Backspace" || key == "Delete") {
            // return key; 
            return;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        // return false;
        return;
    }
}
function textAreaResizeInputUp(event) {
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    console.log("textAreaResizeInputUp()");
    if (target.value.length >= textAreaSize) {
        target.value = target.value.slice(0, textAreaSize);
    }
}
async function initHallOfFame() {
    //await getVotes();
    getAllEmails();
}
function clearEmails() {
    console.log("clearEmails()");
    UserEmails = [];
    const emailContainer = document.querySelector('.emailContainer');
    if (!emailContainer.hasChildNodes()) {
        return;
    }
    const children = emailContainer.children;
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i] === null || children[i] === undefined) {
            continue;
        }
        if (children[i].className === null || children[i].className === undefined) {
            continue;
        }
        let classes = children[i].className.split(' ');
        for (let j = 0; j < classes.length; j++) {
            if (classes[j] === "receivedEmail") {
                children[i].remove();
                break;
            }
        }
    }
}
function findDelimitedItem(emails) {
    const startIndex = 0;
    const delimiterStartIndex = emails.indexOf(DELIMITER);
    if (delimiterStartIndex === -1) {
        console.log("findDelimitedItem() failed to find DELIMITER");
        return [emails, ""];
    }
    const endIndex = delimiterStartIndex + DELIMITER.length;
    const itemStr = emails.slice(startIndex, delimiterStartIndex);
    emails = emails.slice(endIndex, emails.length);
    // console.log("item = " +  itemStr);
    return [emails, itemStr];
}
function updateEmails(emails, page) {
    console.log("updateEmails()");
    console.log("emails type = " + typeof (emails));
    if (page == pages.LANDING) {
        clearEmails();
    }
    let recipientStr = "";
    let res = ["", ""];
    while (emails.length > 0) {
        console.log("ADDING EMAIL");
        if (page == pages.HALL_OF_FAME) {
            res = findDelimitedItem(emails);
            emails = res[0];
            recipientStr = res[1];
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const idStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("id = " + idStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        recipientStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("recipient = " + recipientStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const senderStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("sender = " + senderStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const titleStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("title = " + titleStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const bodyStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("body = " + bodyStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const hashStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("hash = " + hashStr);
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        const timeStr = res[1];
        if (DEBUG_EMAILS) {
            console.log("time_created = " + timeStr);
        }
        if (page == pages.LANDING) {
            if (UserEmails.length == 0) {
                const createResult = Email.createEmail(idStr, senderStr, titleStr, bodyStr, hashStr, timeStr);
                if (!createResult.ok) {
                    console.log('Failed to create email, ', createResult.err);
                    return;
                }
                UserEmails = [createResult.val];
            }
            else {
                const createResult = Email.createEmail(idStr, senderStr, titleStr, bodyStr, hashStr, timeStr);
                if (!createResult.ok) {
                    console.log('Failed to create email, ', createResult.err);
                    return;
                }
                UserEmails.push(createResult.val);
            }
        }
        // Delimiter at the end of an email
        emails = emails.slice(DELIMITER.length, emails.length);
        console.log("emails after search = " + emails);
        // Create elements
        const emailContainer = document.querySelector('.emailContainer');
        const email = document.createElement('div');
        email.classList.add('email', 'receivedEmail');
        let recipient;
        if (page == pages.HALL_OF_FAME) {
            recipient = document.createElement('div');
            recipient.textContent = "Recipient: " + recipientStr;
            recipient.classList.add('emailSender', 'receivedEmail');
        }
        //let hash = document.createElement('div');
        //hash.textContent = "Hash: " + hashStr;
        //hash.classList.add('emailHash', 'receivedEmail');
        const sender = document.createElement('div');
        sender.textContent = "From: " + senderStr;
        sender.classList.add('emailSender', 'receivedEmail');
        const title = document.createElement('div');
        title.textContent = titleStr;
        title.classList.add('emailTitle', 'receivedEmail');
        const body = document.createElement('div');
        const MAX_CHARACTERS_IN_TINY_EMAIL = 60;
        let slicedBody = "";
        let count = 0;
        for (let i = 0; i < bodyStr.length; i++) {
            if (count >= MAX_CHARACTERS_IN_TINY_EMAIL) {
                break;
            }
            const codePoint = bodyStr.codePointAt(i);
            // emojis count twice cause they are fat
            if (codePoint > 0xFFFF) {
                count++;
                slicedBody += bodyStr[i];
                i++;
            }
            count++;
            slicedBody += bodyStr[i];
        }
        console.log(slicedBody);
        body.textContent = slicedBody;
        body.classList.add('emailBody', 'receivedEmail');
        const upvoteContainer = document.createElement('div');
        upvoteContainer.classList.add('emailUpvoteContainer', 'receivedEmail');
        let votedOn = false;
        if (page == pages.LANDING) {
            console.log("Searching votes");
            for (const item of UserVotes) {
                console.log("Sender. Vote: " + item.sender + ", Email: " + senderStr);
                console.log("Title. Vote: " + item.title + ", Email: " + titleStr);
                console.log("Hash. Vote: " + item.hash + ", Email: " + hashStr);
                if (item.sender == senderStr && item.title == titleStr && item.hash.toString() == hashStr) {
                    votedOn = true;
                    break;
                }
            }
        }
        // const upvotes = document.createElement('div');
        // upvotes.classList.add('emailUpvotes', 'receivedEmail');
        // upvotes.textContent = upvotesStr;
        const upvoteButton = document.createElement('button');
        upvoteButton.textContent = "^";
        upvoteButton.classList.add('emailUpvoteButton', 'receivedEmail');
        if (page == pages.LANDING) {
            if (votedOn == true) {
                upvoteButton.classList.add('upvoted');
                console.log("Email was voted on");
            }
            else {
                upvoteButton.classList.add('unUpvoted');
            }
        }
        upvoteButton.addEventListener("click", voteClick);
        if (page == pages.LANDING) {
            //email.appendChild(hash);
        }
        if (page == pages.HALL_OF_FAME) {
            email.appendChild(recipient);
        }
        email.appendChild(sender);
        email.appendChild(title);
        email.appendChild(body);
        // upvoteContainer.appendChild(upvotes);
        upvoteContainer.appendChild(upvoteButton);
        email.appendChild(upvoteContainer);
        emailContainer.appendChild(email);
    }
}
async function updateVotes(votes) {
    UserVotes = [];
    if (votes == "none" || votes == "") {
        return;
    }
    let res = ["", ""];
    while (votes.length > 0) {
        res = findDelimitedItem(votes);
        votes = res[0];
        const senderStr = res[1];
        res = findDelimitedItem(votes);
        votes = res[0];
        const titleStr = res[1];
        res = findDelimitedItem(votes);
        votes = res[0];
        const hashStr = res[1];
        if (UserVotes === null) {
            const createResult = Vote.createVote(senderStr, titleStr, hashStr);
            if (!createResult.ok) {
                console.log('Failed to create vote, ', createResult.err);
                return;
            }
            UserVotes = [createResult.val];
        }
        else {
            const createResult = Vote.createVote(senderStr, titleStr, hashStr);
            if (!createResult.ok) {
                console.log('Failed to create vote, ', createResult.err);
                return;
            }
            UserVotes.push(createResult.val);
        }
        // Delimiter at the end
        votes = votes.slice(DELIMITER.length, votes.length);
    }
}
async function emailSentPopUp(recipientString) {
    const mainContainer = document.querySelector('.mainContainer');
    const popUp = document.createElement('div');
    popUp.classList.add('popUp');
    popUp.textContent = "Message sent to " + recipientString + "...";
    mainContainer.append(popUp);
    setTimeout(function () {
        popUp.remove();
    }, 3500);
}
// SERVER STUFF !!!!
async function makePost() {
    console.log("makePost");
    // Should just use currentUsername
    const usernameInput = document.querySelector('.usernameInput');
    const usernameString = usernameInput.value;
    const recipientInput = document.querySelector('.recipientInput');
    const recipientString = recipientInput.value;
    const titleInput = document.querySelector('.titleInput');
    const titleString = titleInput.value;
    const composeInput = document.querySelector('.textAreaInput');
    const composeString = composeInput.value;
    const postData = new FormData();
    postData.append('username', usernameString);
    console.log("USERNAMESTRING = " + usernameString);
    postData.append('recipient', recipientString);
    console.log("RECIPIENTSTRING = " + recipientString);
    postData.append('title', titleString);
    console.log("TITLESTRING = " + titleString);
    postData.append('composeText', composeString);
    console.log("COMPOSESTRING = " + composeString);
    function emptyUsername() {
        return;
    }
    // function emptyRecipient() {
    //     return;
    // }
    // function emptyTitle() {
    //     return;
    // }
    // function emptyTextArea() {
    //     return;
    // }
    try {
        fetch(SITE_NAME, {
            method: "POST",
            body: postData,
        })
            .then(async (response) => {
            if (!response.ok) {
                if (response.status === 400) {
                    console.log(response.statusText);
                    if (response.statusText == "Empty username") {
                        emptyUsername();
                    }
                    else if (response.statusText == "Empty recipient") {
                        emptyUsername();
                    }
                    else if (response.statusText == "Empty title") {
                        emptyUsername();
                    }
                    else if (response.statusText == "Empty text area") {
                        emptyUsername();
                    }
                    else {
                        console.log("Unknown 400 error");
                    }
                }
                else {
                    console.log("unknown error response: " + response.status);
                }
            }
            if (response.status === 201) {
                console.log("email successfully sent");
                console.log(response);
                emailSentPopUp(recipientString);
                currentUsername = usernameString;
                await getVotes();
                getEmails();
            }
            else {
                console.log("unknown response status: " + response.status);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
    ;
}
function voteClick(event) {
    console.log("voteClick");
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    const classes = target.className.split(' ');
    for (let i = 0; i < classes.length; i++) {
        if (classes[i] === 'upvoted') {
            vote(event, vote_type.UN_UPVOTE);
            return;
        }
        if (classes[i] === 'unUpvoted') {
            vote(event, vote_type.UPVOTE);
            return;
        }
    }
    console.log("Error: Still in voteClick function. Button must have had wrong classes assigned\n");
}
async function vote(event, voteType) {
    console.log("vote()");
    const target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    if (voteType === vote_type.UPVOTE) {
        console.log('Before upvote:', target.classList);
        target.classList.remove('unUpvoted');
        target.classList.add('upvoted');
        console.log('After upvote:', target.classList);
    }
    else if (voteType === vote_type.UN_UPVOTE) {
        console.log('Before unupvote:', target.classList);
        target.classList.remove('upvoted');
        target.classList.add('unUpvoted');
        console.log('After unupvote:', target.classList);
    }
    else {
        console.log("Error: unkown vote type");
        return;
    }
    // FIXME Definitely a better way to do this email searching
    const upvoteContainer = target.parentNode;
    const emailElement = upvoteContainer.parentNode;
    const emailContainer = emailElement.parentNode;
    const emailContainerChildren = emailContainer.children;
    let emailIndex = -1;
    for (; emailIndex < emailContainerChildren.length; emailIndex++) {
        if (emailContainerChildren[emailIndex] === emailElement) {
            break;
        }
    }
    if (emailIndex == -1) {
        console.log("vote(): Somehow could find vote's email");
        return;
    }
    const emailHead = UserEmails[emailIndex];
    const putData = new FormData();
    const operation = voteType == vote_type.UPVOTE ? "INSERT INTO" : "DELETE";
    putData.append('operation', operation);
    putData.append('username', currentUsername);
    putData.append('email_id', emailHead.id.toString());
    console.log("PUT, Sending: operation: " + operation + " username: " + currentUsername + " email_id: " + emailHead.id);
    try {
        const response = await fetch(SITE_NAME, {
            method: "PUT",
            body: putData,
        });
        if (!response.ok) {
            if (response.status === 400) {
                console.log(response.statusText);
                console.log("Unknown 400 error. Text = " + response.statusText);
            }
            else {
                console.log("Unknown error response: " + response.status);
            }
        }
        if (response.status === 201) {
            console.log("Vote successfully sent");
            console.log(response);
            // for now email pop up, should be upvoteSentPopUp or something idk
            emailSentPopUp(voteType);
        }
        else {
            console.log("Unknown response status: " + response.status);
        }
    }
    catch (error) {
        console.log(error);
    }
    ;
    await getVotes();
    getEmails();
}
async function getEmails() {
    console.log("getEmails()");
    fetch(SITE_NAME + "/users/" + currentUsername + "/emails", {
        method: "GET",
    })
        .then(async (response) => {
        console.log("response = ");
        const reader = response.body.getReader();
        const read = await reader.read();
        const data = read.value;
        const str = new TextDecoder().decode(data);
        console.log(str);
        updateEmails(str, pages.LANDING);
    });
}
async function getVotes() {
    console.log("getVotes()");
    try {
        const response = await fetch(SITE_NAME + "/users/" + currentUsername + "/votes", {
            method: "GET",
        });
        const reader = response.body.getReader();
        const read = await reader.read();
        const data = read.value;
        const str = new TextDecoder().decode(data);
        console.log("votes response: " + str);
        updateVotes(str);
    }
    catch (error) {
        console.error("Error fetching votes: ", error);
    }
}
async function getAllEmails() {
    console.log("getAllEmails()");
    try {
        fetch(SITE_NAME + "/all_emails", {
            method: "GET",
        })
            .then(async (response) => {
            const reader = response.body.getReader();
            const read = await reader.read();
            const data = read.value;
            const str = new TextDecoder().decode(data);
            console.log("all emails respone = ", str);
            updateEmails(str, pages.HALL_OF_FAME);
        });
    }
    catch (error) {
        console.error("Error getting all emails: ", error);
    }
}
// for fun
function deleteEverything() {
    console.log("deleteEverything()");
    const container = document.querySelector('.container');
    while (container.hasChildNodes) {
        container.removeChild(container.lastChild);
    }
}
