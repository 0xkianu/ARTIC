/* Global variables */
let search = '';
let currPage = 1;
let lastPage = 1;
let totalPages = 0;
let artSearch = true;
let auth0 = null;
let artArray = [];
let likedArray = [];

/* DOM elements */
const myForm = document.getElementById('search-form'); 
const imageCont = document.getElementById("artworks");
const pageOne = document.getElementById("page-one");
const pageTwo = document.getElementById("page-two");
const pageThree = document.getElementById("page-three");
const pagePrev = document.getElementById("page-prev");
const pageNext = document.getElementById("page-next");
const pageNav = document.getElementById("page-nav");
const pageFirst = document.getElementById("page-first");
const pageLast = document.getElementById("page-last");
const artSelect1 = document.getElementById("artSelect1");
const artSelect2 = document.getElementById("artSelect2");

/* Event listener on window load */
window.onload = async () => {
    await configureClient();
    await processLoginState();
    updateUI();
}

/* Event listener for click events */
document.addEventListener('click', function(event) {
    if(event.target.classList.contains('page-link')) {
        let page = event.target.innerText;
        if(page === 'Previous') {
            currPage--;
        } else if (page === 'Next') {
            currPage++;
        } else if (page === '<') {
            currPage = 1;
        } else if (page === '>') {
            currPage = lastPage;
        }
        else {
            currPage = parseInt(page);
        }

        setPageNav();
        imageCont.innerHTML='';
        getWorks(search);
    }
})

const configureClient = async () => {
    auth0 = await createAuth0Client({
      domain: "dev-vr0ctqj811up1px7.us.auth0.com",
      client_id: "XO0wuJY6HElHJmpxVmgYN9qKxkcDFjIm" // client_id: "nLBVmQO7go1ZZewUtOKjo2gGkGIilzV3" to run locally, client_id: "XO0wuJY6HElHJmpxVmgYN9qKxkcDFjIm" to run on deployed github page 
    })
}

const processLoginState = async () => {
    // Check code and state parameters
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      // Process the login state
      await auth0.handleRedirectCallback();
      // Use replaceState to redirect the user away and remove the querystring parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
}

const updateUI = async () => {

    const isAuthenticated = await auth0.isAuthenticated();
    
    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;
    document.getElementById("form-input").disabled = !isAuthenticated;
    document.getElementById("form-search-btn").disabled = !isAuthenticated;
    // NEW - add logic to show/hide gated content after authentication
    
    /*if (isAuthenticated) {
      /*document.getElementById(
        "ipt-access-token"
      ).innerHTML = await auth0.getTokenSilently()*/
      /*document.getElementById("ipt-user-profile").innerHTML = JSON.stringify(
        await auth0.getUser()
      )*/
    /*} else {
      /*document.getElementById("gated-content").classList.add("hidden")*/
    /*}*/
}

const login = async () => {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.href,
    })
}
  
const logout = () => {
    auth0.logout({
      returnTo: window.location.href,
    })
}

/* Asynchronous function for fetching ARTIC artworks from search */
async function getWorks(searchString) {
    /* Local variables */
    let artPieces = [], imageURL, imageTitle, imageDesc, pgLimit;
    imageCont.innerHTML='';

    /* ARTIC API limits search results across pages to 1000.  1000 pieces / 16 pieces per pages ~= 63 */
    if(currPage < 63) { 
        pgLimit = 16;   // if we are not on the last page, set limit to max of 16
    } else {
        pgLimit = 8;    // if we are on the last page, set the limit to 8 else we will get an error for exceeding limit of 1000 pieces
    }
    
    /* Fetch the data from the ARTIC API and render images to the page */
    try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks/search?q=${searchString}&limit=${pgLimit}&page=${currPage}&fields=id,title,image_id,artist_display,style_title,place_of_origin,medium_display,date_display`);
        const retData = await response.json();
        artPieces = retData.data;

        // Set the last page 
        lastPage = parseInt(retData.pagination.total_pages);
        if(parseInt(lastPage) > 63) {
            lastPage = 63;
        }
        
        // Loop through the art pieces returned from fetch and display on the page 
        for (let i = 0; i < artPieces.length; i++) {
            imageTitle = artPieces[i].title;
            // IF there is no style associated with a piece assign style as NA
            if(!artPieces[i].style_title) {
                artPieces[i].style_title = 'NA'
            }
            // Create string for the image description
            imageDesc = `<p>artist: ${artPieces[i].artist_display.substring(0,100)}</p><p>date: ${artPieces[i].date_display}</p><p>place of origin: ${artPieces[i].place_of_origin}</p><p>medium: ${artPieces[i].medium_display.substring(0,100)}</p><p>style: ${artPieces[i].style_title}</p>` 
            // Assign variable to image URL.  If there is no image associated with a piece use Image Not Available image.
            if(artPieces[i].image_id) {
                imageURL = `https://www.artic.edu/iiif/2/${artPieces[i].image_id}/full/843,/0/default.jpg`;
             } else {
                imageURL = "images/No_Image_Available.jpg";
             }
             imageCont.innerHTML += `<div class="box"><div class="body"><div class="imgContainer fancy-border"><img src="${imageURL}" alt=""></div><div class="content d-flex flex-column align-items-center justify-content-center"><div><h3 class="text-white fs-6">${imageTitle}</h3><p class="text-white">${imageDesc}</p><button class="btn btn-secondary btn-sm" id="btn-like">LIKE</button></div></div></div></div>`;
        }

        // Make the pagination visible
        pageNav.classList.remove("invisible");
        // Call the pagination function
        setPageNav();
        // Scroll to the top of the page
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    
    } catch (e) {
        console.log("There was a problem fetching artwork data");
    }
}

/* Asynchronous function for generating artworks from DALL-E based on search prompt */
async function generateImages(searchString) {
    /* Local variables */
    let artPieces = [], imageURL, imageTitle, imageDesc; 
    imageCont.innerHTML='';
    let url = 'https://api.openai.com/v1/images/generations'; // URL for DALL-E openai API
    let data = {"prompt": `${searchString}`,"n": 10,"size": "1024x1024"}; // data object parameter for search

    /* Fetch the data from the DALL-E API and render images to the page */
    try {
        const response = await fetch(url, {
        method: 'POST', 
        mode: 'cors', 
        cache: 'no-cache', 
        credentials: 'same-origin', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.MY_KEY}` // API key
        },
        redirect: 'follow', 
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data) 
        });
        const retData = await response.json();
        artPieces = retData.data;
        lastPage = 1; // DALL-E openai can only return 10 results per minute from free account

        // Loop through the art pieces returned from fetch and display on the page
        for (let i = 0; i < artPieces.length; i++) {
            imageTitle = searchString + i;
            imageDesc = `<p>artist: DALL-E</p><p>date: NA</p><p>place of origin: NA</p><p>medium: NA</p><p>style: NA</p>` 
            imageURL = `${artPieces[i].url}`;
            imageCont.innerHTML += `<div class="box"><div class="body"><div class="imgContainer fancy-border"><img src="${imageURL}" alt=""></div><div class="content d-flex flex-column align-items-center justify-content-center"><div><h3 class="text-white fs-6">${imageTitle}</h3><p class="text-white">${imageDesc}</p></div></div></div></div>`;
        }
        // Make the pagination visible
        pageNav.classList.remove("invisible");
        // Call the pagination function
        setPageNav();
        // Scroll to the top of the page
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    } catch (e) {
        console.log("There was a problem fetching artwork data");
    }
}

/* Function to properly display pagination */
let setPageNav = () => {
    /* Set the First, Previous, Next and Last nav buttons */
    if(currPage === 1) {
        pageFirst.parentNode.classList.add("disabled");
        pagePrev.parentNode.classList.add("disabled");
        pageNext.parentNode.classList.remove("disabled");
        pageLast.parentNode.classList.remove("disabled"); 
    } else if(currPage === lastPage) {
        pageNext.parentNode.classList.add("disabled");
        pageLast.parentNode.classList.add("disabled"); 
        pageFirst.parentNode.classList.remove("disabled");
        pagePrev.parentNode.classList.remove("disabled");  
    } else {
        pagePrev.parentNode.classList.remove("disabled");
        pageNext.parentNode.classList.remove("disabled");
        pageFirst.parentNode.classList.remove("disabled");
        pageLast.parentNode.classList.remove("disabled");
    }

    /* Set the 3 numbered page buttons */
    if(lastPage === 2) {
        pageThree.parentNode.classList.add("hide");
        pageTwo.parentNode.classList.remove("hide");
        pageOne.innerText = '1';
        pageTwo.innerText = '2';
        if(currPage === lastPage) {
            pageTwo.parentNode.classList.add("disabled");
            pageOne.parentNode.classList.remove("disabled");
        } else {
            pageTwo.parentNode.classList.remove("disabled");
            pageOne.parentNode.classList.add("disabled");
        }
    } else if(lastPage === 1 ) {
        pageTwo.parentNode.classList.add("hide");
        pageThree.parentNode.classList.add("hide");
        pageOne.innerText = `${currPage}`;
        pageOne.parentNode.classList.add("disabled");
        pageNext.parentNode.classList.add("disabled");
        pageLast.parentNode.classList.add("disabled"); 
    } else {
        pageTwo.parentNode.classList.remove("hide");
        pageThree.parentNode.classList.remove("hide");
        if(currPage === lastPage-1) {
            pageOne.innerText = `${parseInt(currPage) - 1}`;
            pageTwo.innerText = `${currPage}`;
            pageThree.innerText = `${(parseInt(currPage) + 1)}`;  
            pageTwo.parentNode.classList.add("disabled");
            pageOne.parentNode.classList.remove("disabled");
            pageThree.parentNode.classList.remove("disabled");
        } else if(currPage === lastPage) {
            pageOne.innerText = `${parseInt(currPage) - 2}`;
            pageTwo.innerText = `${parseInt(currPage) - 1}`;
            pageThree.innerText = `${currPage}`;
            pageTwo.parentNode.classList.remove("disabled");
            pageOne.parentNode.classList.remove("disabled");
            pageThree.parentNode.classList.add("disabled");
        } else {
            pageOne.innerText = `${currPage}`;
            pageTwo.innerText = `${parseInt(currPage) + 1}`;
            pageThree.innerText = `${parseInt(currPage) + 2}`;
            pageTwo.parentNode.classList.remove("disabled");
            pageOne.parentNode.classList.add("disabled");
            pageThree.parentNode.classList.remove("disabled");
        }
    }
}

/* Event Listener for search form */
myForm.addEventListener('submit', function(e){
    e.preventDefault();
    const searchString = e.target.elements.searchTerm.value;
    const urlEncodedSearchString = encodeURIComponent(searchString);
    search = urlEncodedSearchString;
    currPage = 1;
    // Check the radio button to determine which type of search will be generated
    if(artSearch) {
        getWorks(search);
    } else {
        generateImages(searchString);
    }  
})

/* Event Listener for the radio button for ARTIC search */
artSelect1.addEventListener('click', function() {
    artSearch = true;
})

/* Event Listener for the radio button for the DALL-E openai search */
artSelect2.addEventListener('click', function() {
    artSearch = false;
})
