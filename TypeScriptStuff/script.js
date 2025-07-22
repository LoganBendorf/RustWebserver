var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// const SITE_NAME = "https://www.purplesite.skin";
var SITE_NAME = "http://127.0.0.1:7878";
var MAX_NAME_CHARACTERS = 15;
var MAX_TITLE_CHARACTERS = 24;
var MAX_COMPOSE_CHARACTERS = 200;
var DELIMITER = "\'\'\n";
var currentUsername;
var DEBUG_GENERIC = false;
var DEBUG_EMAILS = false;
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
    error[error["BAD_INT"] = 0] = "BAD_INT";
    error[error["BAD_DATE"] = 1] = "BAD_DATE";
    error[error["EMPTY_INPUT"] = 2] = "EMPTY_INPUT";
})(error || (error = {}));
;
document.addEventListener("click", globalClickListener);
document.addEventListener("keydown", globalKeyDownListener);
var emojiButton = document.querySelector('.emojiButton');
var inputs = Array.from(document.querySelectorAll('.composeInput'));
for (var _i = 0, inputs_1 = inputs; _i < inputs_1.length; _i++) {
    var input = inputs_1[_i];
    console.log("loop");
    input.style.width = "50px";
    input.onkeypress = resizeInput;
    input.onkeyup = resizeInputUp;
}
var textArea = document.querySelector('.textAreaInput');
textArea.addEventListener('keydown', textAreaResizeInput);
textArea.onkeyup = textAreaResizeInputUp;
function safeParseInt(value) {
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return { ok: false, err: error.BAD_INT };
        }
        return { ok: true, val: Math.floor(value) };
    }
    var trimmed = value.trim();
    if (trimmed === '') {
        return { ok: false, err: error.EMPTY_INPUT };
    }
    var parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) {
        return { ok: false, err: error.BAD_INT };
    }
    return { ok: true, val: parsed };
}
function safeParseDate(value) {
    if (value instanceof Date) {
        if (isNaN(value.getTime())) {
            return { ok: false, err: error.BAD_DATE };
        }
        return { ok: true, val: value };
    }
    var trimmed = value.trim();
    if (trimmed === '') {
        return { ok: false, err: error.EMPTY_INPUT };
    }
    var parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
        return { ok: false, err: error.BAD_DATE };
    }
    return { ok: true, val: parsed };
}
var Email = /** @class */ (function () {
    function Email(sender, title, body, hash, upvotes, time_created) {
        this.sender = sender;
        this.title = title;
        this.body = body;
        this.hash = hash;
        this.upvotes = upvotes;
        this.time_created = time_created;
    }
    Email.createEmail = function (sender, title, body, hash, upvotes, time_created) {
        var hashResult = safeParseInt(hash);
        if (!hashResult.ok) {
            return hashResult;
        }
        var upvotesResult = safeParseInt(upvotes);
        if (!upvotesResult.ok) {
            return upvotesResult;
        }
        var dateResult = safeParseDate(time_created);
        if (!dateResult.ok) {
            return dateResult;
        }
        return {
            ok: true, val: new Email(sender, title, body, hashResult.val, upvotesResult.val, dateResult.val)
        };
    };
    return Email;
}());
var Vote = /** @class */ (function () {
    function Vote(sender, title, hash) {
        this.sender = sender;
        this.title = title;
        this.hash = hash;
    }
    Vote.createVote = function (sender, title, hash) {
        var hashResult = safeParseInt(hash);
        if (!hashResult.ok) {
            return hashResult;
        }
        return {
            ok: true, val: new Vote(sender, title, hashResult.val)
        };
    };
    return Vote;
}());
var UserEmails;
var UserVotes;
function globalClickListener(event) {
    console.log("globalClickListener()");
    console.log(event);
    console.log(event.target);
    closeEmojiMenuIfShould(event, input_style.MOUSE);
}
function globalKeyDownListener(event) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closeEmojiMenuIfShould(event, input_style.KEYBOARD);
                    if (!(event.key === 'Tab')) return [3 /*break*/, 2];
                    console.log("key equaled tab\n");
                    currentUsername = document.querySelector('.usernameInput').value;
                    return [4 /*yield*/, getVotes()];
                case 1:
                    _a.sent();
                    getEmails();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function closeEmojiMenuIfShould(event, inputStyle) {
    console.log("closeEmojiMenuIfShould() called");
    var target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    if (emojiButton.hasChildNodes()) {
        var shouldClose = true;
        if (inputStyle === input_style.MOUSE) {
            var classes = target.className.split(' ');
            console.log(classes);
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === 'emoji') {
                    shouldClose = false;
                    break;
                }
            }
        }
        if (shouldClose) {
            var children = emojiButton.children;
            for (var i = children.length - 1; i >= 0; i--) {
                if (children[i] === null || children[i] === undefined) {
                    continue;
                }
                if (children[i].className === null || children[i].className === undefined) {
                    continue;
                }
                var classes = children[i].className.split(' ');
                for (var j = 0; j < classes.length; j++) {
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
    var emojiChildren = document.querySelector(".emojiChild");
    if (emojiChildren !== null) {
        console.log("emojiButton has children, do nothing");
        return;
    }
    var emojiMenu = document.createElement('div');
    emojiMenu.classList.add('emoji', 'emojiChild', 'emojiMenu');
    for (var i = 0; i < 9; i++) {
        var emojiContainer = document.createElement('div');
        var emojiCode = String.fromCodePoint(128516 + i); // '128516' is character code
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
    var target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    var composeInput = document.querySelector('.textAreaInput');
    var string = "";
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
    var key = event.key;
    console.log(key);
    var target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    var classes = target.className.split(' ');
    var name = 0;
    var title = 0;
    for (var i = 0; i < classes.length; i++) {
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
function resizeInputUp(event) {
    return __awaiter(this, void 0, void 0, function () {
        var key, target, classes, name, title, i, max, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = event.key;
                    target = event.target;
                    if (target === undefined || target === null) {
                        return [2 /*return*/];
                    }
                    classes = target.className.split(' ');
                    name = 0;
                    title = 0;
                    for (i = 0; i < classes.length; i++) {
                        if (classes[i] === 'recipientInput' || classes[i] === 'usernameInput') {
                            name = 1;
                            break;
                        }
                        if (classes[i] === 'titleInput') {
                            title = 1;
                            break;
                        }
                    }
                    max = (MAX_NAME_CHARACTERS * name + MAX_TITLE_CHARACTERS * title);
                    if (target.value.length >= max) {
                        console.log("input truncated");
                        target.value = target.value.slice(0, max);
                    }
                    target.style.width = (target.value.length + 1) * .5 + 2.25 + "em";
                    if (!(key === 'Enter')) return [3 /*break*/, 4];
                    console.log("key equaled enter\n");
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < target.classList.length)) return [3 /*break*/, 4];
                    if (!(target.classList[i] === 'usernameInput')) return [3 /*break*/, 3];
                    console.log("class equaled usernameInput\n");
                    currentUsername = target.value;
                    return [4 /*yield*/, getVotes()];
                case 2:
                    _a.sent();
                    getEmails();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var textAreaSize = 600;
function textAreaResizeInput(event) {
    console.log("textAreaResizeInput()");
    var key = event.key;
    var target = event.target;
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
    var target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    console.log("textAreaResizeInputUp()");
    if (target.value.length >= textAreaSize) {
        target.value = target.value.slice(0, textAreaSize);
    }
}
function initHallOfFame() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            //await getVotes();
            getAllEmails();
            return [2 /*return*/];
        });
    });
}
function clearEmails() {
    console.log("clearEmails()");
    UserEmails = [];
    var emailContainer = document.querySelector('.emailContainer');
    if (!emailContainer.hasChildNodes()) {
        return;
    }
    var children = emailContainer.children;
    for (var i = children.length - 1; i >= 0; i--) {
        if (children[i] === null || children[i] === undefined) {
            continue;
        }
        if (children[i].className === null || children[i].className === undefined) {
            continue;
        }
        var classes = children[i].className.split(' ');
        for (var j = 0; j < classes.length; j++) {
            if (classes[j] === "receivedEmail") {
                children[i].remove();
                break;
            }
        }
    }
}
function findDelimitedItem(emails) {
    var _a, _b;
    var firstMatch = (_a = emails.match(DELIMITER)) === null || _a === void 0 ? void 0 : _a[0];
    if (firstMatch === undefined) {
        console.log("failed to find item");
        return ["", ""];
    }
    var index = emails.indexOf(firstMatch) + DELIMITER.length;
    emails = emails.slice(index, emails.length);
    var endMatch = (_b = emails.match(DELIMITER)) === null || _b === void 0 ? void 0 : _b[0];
    if (endMatch === undefined) {
        console.log("failed to find item");
        return ["", ""];
    }
    var endIndex = emails.indexOf(endMatch) + DELIMITER.length;
    var itemStr = emails.slice(0, endIndex);
    emails = emails.slice(endIndex, emails.length);
    console.log("item = " + itemStr);
    return [emails, itemStr];
}
function updateEmails(emails, page) {
    console.log("updateEmails()");
    console.log("emails type = " + typeof (emails));
    if (page == pages.LANDING) {
        clearEmails();
    }
    var recipientStr = "";
    var res = ["", ""];
    while (emails.length > 0) {
        console.log("ADDING EMAIL");
        if (page == pages.HALL_OF_FAME) {
            res = findDelimitedItem(emails);
            emails = res[0];
            recipientStr = res[1];
        }
        res = findDelimitedItem(emails);
        emails = res[0];
        var senderStr = res[1];
        res = findDelimitedItem(emails);
        emails = res[0];
        var titleStr = res[1];
        res = findDelimitedItem(emails);
        emails = res[0];
        var hashStr = res[1];
        res = findDelimitedItem(emails);
        emails = res[0];
        var bodyStr = res[1];
        res = findDelimitedItem(emails);
        emails = res[0];
        var upvotesStr = res[1];
        res = findDelimitedItem(emails);
        emails = res[0];
        var timeStr = res[1];
        if (page == pages.LANDING) {
            if (UserEmails.length == 0) {
                var createResult = Email.createEmail(senderStr, titleStr, hashStr, bodyStr, upvotesStr, timeStr);
                if (!createResult.ok) {
                    console.log('Failed to create email, ', createResult.err);
                    return;
                }
                UserEmails = [createResult.val];
            }
            else {
                var createResult = Email.createEmail(senderStr, titleStr, hashStr, bodyStr, upvotesStr, timeStr);
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
        var emailContainer = document.querySelector('.emailContainer');
        var email = document.createElement('div');
        email.classList.add('email', 'receivedEmail');
        var recipient = void 0;
        if (page == pages.HALL_OF_FAME) {
            recipient = document.createElement('div');
            recipient.textContent = "Recipient: " + recipientStr;
            recipient.classList.add('emailSender', 'receivedEmail');
        }
        //let hash = document.createElement('div');
        //hash.textContent = "Hash: " + hashStr;
        //hash.classList.add('emailHash', 'receivedEmail');
        var sender = document.createElement('div');
        sender.textContent = "From: " + senderStr;
        sender.classList.add('emailSender', 'receivedEmail');
        var title = document.createElement('div');
        title.textContent = titleStr;
        title.classList.add('emailTitle', 'receivedEmail');
        var body = document.createElement('div');
        var MAX_CHARACTERS_IN_TINY_EMAIL = 60;
        var slicedBody = "";
        var count = 0;
        for (var i = 0; i < bodyStr.length; i++) {
            if (count >= MAX_CHARACTERS_IN_TINY_EMAIL) {
                break;
            }
            var codePoint = bodyStr.codePointAt(i);
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
        var upvoteContainer = document.createElement('div');
        upvoteContainer.classList.add('emailUpvoteContainer', 'receivedEmail');
        var votedOn = false;
        if (page == pages.LANDING) {
            console.log("Searching votes");
            for (var _i = 0, UserVotes_1 = UserVotes; _i < UserVotes_1.length; _i++) {
                var item = UserVotes_1[_i];
                console.log("Sender. Vote: " + item.sender + ", Email: " + senderStr);
                console.log("Title. Vote: " + item.title + ", Email: " + titleStr);
                console.log("Hash. Vote: " + item.hash + ", Email: " + hashStr);
                if (item.sender == senderStr && item.title == titleStr && item.hash.toString() == hashStr) {
                    votedOn = true;
                    break;
                }
            }
        }
        var upvotes = document.createElement('div');
        upvotes.classList.add('emailUpvotes', 'receivedEmail');
        upvotes.textContent = upvotesStr;
        var upvoteButton = document.createElement('button');
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
        upvoteContainer.appendChild(upvotes);
        upvoteContainer.appendChild(upvoteButton);
        email.appendChild(upvoteContainer);
        emailContainer.appendChild(email);
    }
}
function updateVotes(votes) {
    return __awaiter(this, void 0, void 0, function () {
        var res, senderStr, titleStr, hashStr, createResult, createResult;
        return __generator(this, function (_a) {
            UserVotes = [];
            if (votes == "none" || votes == "") {
                return [2 /*return*/];
            }
            res = ["", ""];
            while (votes.length > 0) {
                res = findDelimitedItem(votes);
                votes = res[0];
                senderStr = res[1];
                res = findDelimitedItem(votes);
                votes = res[0];
                titleStr = res[1];
                res = findDelimitedItem(votes);
                votes = res[0];
                hashStr = res[1];
                if (UserVotes === null) {
                    createResult = Vote.createVote(senderStr, titleStr, hashStr);
                    if (!createResult.ok) {
                        console.log('Failed to create email, ', createResult.err);
                        return [2 /*return*/];
                    }
                    UserVotes = [createResult.val];
                }
                else {
                    createResult = Vote.createVote(senderStr, titleStr, hashStr);
                    if (!createResult.ok) {
                        console.log('Failed to create email, ', createResult.err);
                        return [2 /*return*/];
                    }
                    UserVotes.push(createResult.val);
                }
                // Delimiter at the end
                votes = votes.slice(DELIMITER.length, votes.length);
            }
            return [2 /*return*/];
        });
    });
}
function emailSentPopUp(recipientString) {
    return __awaiter(this, void 0, void 0, function () {
        var mainContainer, popUp;
        return __generator(this, function (_a) {
            mainContainer = document.querySelector('.mainContainer');
            popUp = document.createElement('div');
            popUp.classList.add('popUp');
            popUp.textContent = "Message sent to " + recipientString + "...";
            mainContainer.append(popUp);
            setTimeout(function () {
                popUp.remove();
            }, 3500);
            return [2 /*return*/];
        });
    });
}
// SERVER STUFF !!!!
function makePost() {
    return __awaiter(this, void 0, void 0, function () {
        function emptyUsername() {
            return;
        }
        var usernameInput, usernameString, recipientInput, recipientString, titleInput, titleString, composeInput, composeString, postData;
        var _this = this;
        return __generator(this, function (_a) {
            console.log("makePost");
            usernameInput = document.querySelector('.usernameInput');
            usernameString = usernameInput.value;
            recipientInput = document.querySelector('.recipientInput');
            recipientString = recipientInput.value;
            titleInput = document.querySelector('.titleInput');
            titleString = titleInput.value;
            composeInput = document.querySelector('.textAreaInput');
            composeString = composeInput.value;
            postData = new FormData();
            postData.append('username', usernameString);
            console.log("USERNAMESTRING = " + usernameString);
            postData.append('recipient', recipientString);
            console.log("RECIPIENTSTRING = " + recipientString);
            postData.append('title', titleString);
            console.log("TITLESTRING = " + titleString);
            postData.append('composeText', composeString);
            console.log("COMPOSESTRING = " + composeString);
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
                    body: postData
                })
                    .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
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
                                if (!(response.status === 201)) return [3 /*break*/, 2];
                                console.log("email successfully sent");
                                console.log(response);
                                emailSentPopUp(recipientString);
                                currentUsername = usernameString;
                                return [4 /*yield*/, getVotes()];
                            case 1:
                                _a.sent();
                                getEmails();
                                return [3 /*break*/, 3];
                            case 2:
                                console.log("unknown response status: " + response.status);
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (error) {
                console.log(error);
            }
            ;
            return [2 /*return*/];
        });
    });
}
function voteClick(event) {
    console.log("voteClick");
    var target = event.target;
    if (target === undefined || target === null) {
        return;
    }
    var classes = target.className.split(' ');
    for (var i = 0; i < classes.length; i++) {
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
function vote(event, voteType) {
    return __awaiter(this, void 0, void 0, function () {
        var target, upvoteContainer, email, emailContainer, emailContainerChildren, emailNumber, found, emailHead, putData, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("vote()");
                    target = event.target;
                    if (target === undefined || target === null) {
                        return [2 /*return*/];
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
                        return [2 /*return*/];
                    }
                    upvoteContainer = target.parentNode;
                    email = upvoteContainer.parentNode;
                    emailContainer = email.parentNode;
                    emailContainerChildren = emailContainer.children;
                    emailNumber = 0;
                    found = false;
                    while (emailNumber < emailContainerChildren.length) {
                        if (emailContainerChildren[emailNumber] === email) {
                            found = true;
                            break;
                        }
                        emailNumber++;
                    }
                    if (!found) {
                        console.log("COULDN'T FIND EMAIL SOMEHOW!!!!");
                        return [2 /*return*/];
                    }
                    emailHead = UserEmails[emailNumber];
                    putData = new FormData();
                    putData.append('vote_type', voteType);
                    putData.append('username', currentUsername);
                    putData.append('sender', emailHead.sender);
                    putData.append('title', emailHead.title);
                    putData.append('hash', emailHead.hash.toString());
                    console.log("put, sending: vote_type: " + voteType + " username: " + currentUsername + " sender: " + emailHead.sender + " tite: " + emailHead.title + " hash: " + emailHead.hash);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch(SITE_NAME, {
                            method: "PUT",
                            body: putData
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        if (response.status === 400) {
                            console.log(response.statusText);
                            console.log("Unknown 400 error. Text = " + response.statusText);
                        }
                        else {
                            console.log("unknown error response: " + response.status);
                        }
                    }
                    if (response.status === 201) {
                        console.log("upvote successfully sent");
                        console.log(response);
                        // for now email pop up, should be upvoteSentPopUp or something idk
                        emailSentPopUp(voteType);
                    }
                    else {
                        console.log("unknown response status: " + response.status);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.log(error_1);
                    return [3 /*break*/, 4];
                case 4:
                    ;
                    return [4 /*yield*/, getVotes()];
                case 5:
                    _a.sent();
                    getEmails();
                    return [2 /*return*/];
            }
        });
    });
}
function getEmails() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            console.log("getEmails()");
            fetch(SITE_NAME + "/users/" + currentUsername + "/emails", {
                method: "GET"
            })
                .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                var reader, read, data, str;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("response = ");
                            reader = response.body.getReader();
                            return [4 /*yield*/, reader.read()];
                        case 1:
                            read = _a.sent();
                            data = read.value;
                            str = new TextDecoder().decode(data);
                            console.log(str);
                            updateEmails(str, pages.LANDING);
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
function getVotes() {
    return __awaiter(this, void 0, void 0, function () {
        var response, reader, read, data, str, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("getVotes()");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(SITE_NAME + "/users/" + currentUsername + "/votes", {
                            method: "GET"
                        })];
                case 2:
                    response = _a.sent();
                    reader = response.body.getReader();
                    return [4 /*yield*/, reader.read()];
                case 3:
                    read = _a.sent();
                    data = read.value;
                    str = new TextDecoder().decode(data);
                    console.log("votes response: " + str);
                    updateVotes(str);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error fetching votes: ", error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getAllEmails() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            console.log("getAllEmails()");
            try {
                fetch(SITE_NAME + "/all_emails", {
                    method: "GET"
                })
                    .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                    var reader, read, data, str;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                reader = response.body.getReader();
                                return [4 /*yield*/, reader.read()];
                            case 1:
                                read = _a.sent();
                                data = read.value;
                                str = new TextDecoder().decode(data);
                                console.log("all emails respone = ", str);
                                updateEmails(str, pages.HALL_OF_FAME);
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (error) {
                console.error("Error getting all emails: ", error);
            }
            return [2 /*return*/];
        });
    });
}
// for fun
function deleteEverything() {
    console.log("deleteEverything()");
    var container = document.querySelector('.container');
    while (container.hasChildNodes) {
        container.removeChild(container.lastChild);
    }
}
