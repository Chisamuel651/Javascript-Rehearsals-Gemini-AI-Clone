const typingForm = document.querySelector('.typing_form');
const chatList = document.querySelector('.chat_list');
const suggestions = document.querySelectorAll(".suggestion_list .suggestion");
const toggleThemeButton = document.querySelector('#toggle_theme_button')
const deleteChatButton = document.querySelector('#delete_chat_button');

let userMessage = null;
let isResponseGenerating = false;

// api configuration
const API_KEY='AIzaSyBD-hJ8cDJ_jWSy0WjcuzEw_OAz6t7E_Pw';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadStorageData = () => {
    const savedChats = localStorage.getItem('savedChats');
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode')

    // apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode": "light_mode";

    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide_header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
}

loadStorageData();

// create a mew message element and return it.
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        // append each word to tht text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector('.icon').classList.add('hide');

        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector('.icon').classList.remove('hide');
            localStorage.setItem('savedChats', chatList.innerHTML); //save chats to local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
    }, 75);
}

// fetch response from api based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector('.text'); //get text element
    // send a POST request to the api with user's message
    try{
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        //  get the API response text and remove asterisks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        // console.log(apiResponse);
        // textElement.innerText = apiResponse;
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    }catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add('error');
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

// show a loading animation while waiting for the api response
const showLoadingAnimation = () => {
    const html = `
        <div class="message_content">
            <img src="images/gemini.png" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading_indicator">
                <div class="loading_bar"></div>
                <div class="loading_bar"></div>
                <div class="loading_bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>
    `;
    const incomingMessageDiv = createMessageElement(html, 'incoming', 'loading');
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
    generateAPIResponse(incomingMessageDiv);
}

// copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => copyIcon.innerText = "content_copy", 1000)
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing_input').value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; //exit if there's no message

    isResponseGenerating = true;

    // console.log(userMessage);
    const html = `
        <div class="message_content">
            <img src="images/user2.png" alt="User Image" class="avatar">
            <p class="text"></p>
        </div>
    `;
    const outgoingMessageDiv = createMessageElement(html, 'outgoing');
    outgoingMessageDiv.querySelector('.text').innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // clear input field
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
    document.body.classList.add("hide_header"); //hide header when chat starts
    setTimeout(showLoadingAnimation, 500); // show loading animation after a delay
}

// set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        userMessage = suggestion.querySelector('.text').innerText;
        handleOutgoingChat();
    })
})

// toggle between light and dark themes
toggleThemeButton.addEventListener('click', () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem('themeColor', isLightMode ? "light_mode": "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode": "light_mode";
});

deleteChatButton.addEventListener('click', () => {
    if(confirm("Are you sure you want to delete all the messages ?")) {
        localStorage.removeItem('savedChats');
        loadStorageData();
    }
})

// prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
})