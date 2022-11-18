/* Global variables */
let search = '';
let currPage = 1;
let lastPage = 1;
let totalPages = 0;
let artSearch = true;
let auth0 = null;
let artArray = [];
let likedArray = [];
let accessToken = '';
let userAccount;

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
const profile = document.getElementById("btn-profile");
const likedHead = document.getElementById("liked-header");

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
    } else if(event.target.classList.contains('btn-like')){
        let artIndex = parseInt(event.target.dataset.index);
        console.log(artIndex);
        console.log(artArray[artIndex].title);

        if(!(likedArray.some(function(artPiece) {
            return (artPiece.title === artArray[artIndex].title);
        }))) {
            likedArray.push(artArray[artIndex]);
            updateUserMeta();
        }
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
    if(isAuthenticated) {
        getUserMeta();
        profile.classList.remove("invisible");
    }
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

const getUserMeta =  async () => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlVHYWpsRHE2Snl2NzNHNUhXTndaRSJ9.eyJpc3MiOiJodHRwczovL2Rldi12cjBjdHFqODExdXAxcHg3LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJFcVRpdVU0ckgzY2pMMHJwN3d2RmNRQWt3NE1tWkxQUUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9kZXYtdnIwY3RxajgxMXVwMXB4Ny51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTY2ODY2MzMyNCwiZXhwIjoxNjY5MjY4MTI0LCJhenAiOiJFcVRpdVU0ckgzY2pMMHJwN3d2RmNRQWt3NE1tWkxQUSIsInNjb3BlIjoicmVhZDpjbGllbnRfZ3JhbnRzIGNyZWF0ZTpjbGllbnRfZ3JhbnRzIGRlbGV0ZTpjbGllbnRfZ3JhbnRzIHVwZGF0ZTpjbGllbnRfZ3JhbnRzIHJlYWQ6dXNlcnMgdXBkYXRlOnVzZXJzIGRlbGV0ZTp1c2VycyBjcmVhdGU6dXNlcnMgcmVhZDp1c2Vyc19hcHBfbWV0YWRhdGEgdXBkYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBkZWxldGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgcmVhZDp1c2VyX2N1c3RvbV9ibG9ja3MgY3JlYXRlOnVzZXJfY3VzdG9tX2Jsb2NrcyBkZWxldGU6dXNlcl9jdXN0b21fYmxvY2tzIGNyZWF0ZTp1c2VyX3RpY2tldHMgcmVhZDpjbGllbnRzIHVwZGF0ZTpjbGllbnRzIGRlbGV0ZTpjbGllbnRzIGNyZWF0ZTpjbGllbnRzIHJlYWQ6Y2xpZW50X2tleXMgdXBkYXRlOmNsaWVudF9rZXlzIGRlbGV0ZTpjbGllbnRfa2V5cyBjcmVhdGU6Y2xpZW50X2tleXMgcmVhZDpjb25uZWN0aW9ucyB1cGRhdGU6Y29ubmVjdGlvbnMgZGVsZXRlOmNvbm5lY3Rpb25zIGNyZWF0ZTpjb25uZWN0aW9ucyByZWFkOnJlc291cmNlX3NlcnZlcnMgdXBkYXRlOnJlc291cmNlX3NlcnZlcnMgZGVsZXRlOnJlc291cmNlX3NlcnZlcnMgY3JlYXRlOnJlc291cmNlX3NlcnZlcnMgcmVhZDpkZXZpY2VfY3JlZGVudGlhbHMgdXBkYXRlOmRldmljZV9jcmVkZW50aWFscyBkZWxldGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGNyZWF0ZTpkZXZpY2VfY3JlZGVudGlhbHMgcmVhZDpydWxlcyB1cGRhdGU6cnVsZXMgZGVsZXRlOnJ1bGVzIGNyZWF0ZTpydWxlcyByZWFkOnJ1bGVzX2NvbmZpZ3MgdXBkYXRlOnJ1bGVzX2NvbmZpZ3MgZGVsZXRlOnJ1bGVzX2NvbmZpZ3MgcmVhZDpob29rcyB1cGRhdGU6aG9va3MgZGVsZXRlOmhvb2tzIGNyZWF0ZTpob29rcyByZWFkOmFjdGlvbnMgdXBkYXRlOmFjdGlvbnMgZGVsZXRlOmFjdGlvbnMgY3JlYXRlOmFjdGlvbnMgcmVhZDplbWFpbF9wcm92aWRlciB1cGRhdGU6ZW1haWxfcHJvdmlkZXIgZGVsZXRlOmVtYWlsX3Byb3ZpZGVyIGNyZWF0ZTplbWFpbF9wcm92aWRlciBibGFja2xpc3Q6dG9rZW5zIHJlYWQ6c3RhdHMgcmVhZDppbnNpZ2h0cyByZWFkOnRlbmFudF9zZXR0aW5ncyB1cGRhdGU6dGVuYW50X3NldHRpbmdzIHJlYWQ6bG9ncyByZWFkOmxvZ3NfdXNlcnMgcmVhZDpzaGllbGRzIGNyZWF0ZTpzaGllbGRzIHVwZGF0ZTpzaGllbGRzIGRlbGV0ZTpzaGllbGRzIHJlYWQ6YW5vbWFseV9ibG9ja3MgZGVsZXRlOmFub21hbHlfYmxvY2tzIHVwZGF0ZTp0cmlnZ2VycyByZWFkOnRyaWdnZXJzIHJlYWQ6Z3JhbnRzIGRlbGV0ZTpncmFudHMgcmVhZDpndWFyZGlhbl9mYWN0b3JzIHVwZGF0ZTpndWFyZGlhbl9mYWN0b3JzIHJlYWQ6Z3VhcmRpYW5fZW5yb2xsbWVudHMgZGVsZXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRzIGNyZWF0ZTpndWFyZGlhbl9lbnJvbGxtZW50X3RpY2tldHMgcmVhZDp1c2VyX2lkcF90b2tlbnMgY3JlYXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgZGVsZXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgcmVhZDpjdXN0b21fZG9tYWlucyBkZWxldGU6Y3VzdG9tX2RvbWFpbnMgY3JlYXRlOmN1c3RvbV9kb21haW5zIHVwZGF0ZTpjdXN0b21fZG9tYWlucyByZWFkOmVtYWlsX3RlbXBsYXRlcyBjcmVhdGU6ZW1haWxfdGVtcGxhdGVzIHVwZGF0ZTplbWFpbF90ZW1wbGF0ZXMgcmVhZDptZmFfcG9saWNpZXMgdXBkYXRlOm1mYV9wb2xpY2llcyByZWFkOnJvbGVzIGNyZWF0ZTpyb2xlcyBkZWxldGU6cm9sZXMgdXBkYXRlOnJvbGVzIHJlYWQ6cHJvbXB0cyB1cGRhdGU6cHJvbXB0cyByZWFkOmJyYW5kaW5nIHVwZGF0ZTpicmFuZGluZyBkZWxldGU6YnJhbmRpbmcgcmVhZDpsb2dfc3RyZWFtcyBjcmVhdGU6bG9nX3N0cmVhbXMgZGVsZXRlOmxvZ19zdHJlYW1zIHVwZGF0ZTpsb2dfc3RyZWFtcyBjcmVhdGU6c2lnbmluZ19rZXlzIHJlYWQ6c2lnbmluZ19rZXlzIHVwZGF0ZTpzaWduaW5nX2tleXMgcmVhZDpsaW1pdHMgdXBkYXRlOmxpbWl0cyBjcmVhdGU6cm9sZV9tZW1iZXJzIHJlYWQ6cm9sZV9tZW1iZXJzIGRlbGV0ZTpyb2xlX21lbWJlcnMgcmVhZDplbnRpdGxlbWVudHMgcmVhZDphdHRhY2tfcHJvdGVjdGlvbiB1cGRhdGU6YXR0YWNrX3Byb3RlY3Rpb24gcmVhZDpvcmdhbml6YXRpb25zIHVwZGF0ZTpvcmdhbml6YXRpb25zIGNyZWF0ZTpvcmdhbml6YXRpb25zIGRlbGV0ZTpvcmdhbml6YXRpb25zIGNyZWF0ZTpvcmdhbml6YXRpb25fbWVtYmVycyByZWFkOm9yZ2FuaXphdGlvbl9tZW1iZXJzIGRlbGV0ZTpvcmdhbml6YXRpb25fbWVtYmVycyBjcmVhdGU6b3JnYW5pemF0aW9uX2Nvbm5lY3Rpb25zIHJlYWQ6b3JnYW5pemF0aW9uX2Nvbm5lY3Rpb25zIHVwZGF0ZTpvcmdhbml6YXRpb25fY29ubmVjdGlvbnMgZGVsZXRlOm9yZ2FuaXphdGlvbl9jb25uZWN0aW9ucyBjcmVhdGU6b3JnYW5pemF0aW9uX21lbWJlcl9yb2xlcyByZWFkOm9yZ2FuaXphdGlvbl9tZW1iZXJfcm9sZXMgZGVsZXRlOm9yZ2FuaXphdGlvbl9tZW1iZXJfcm9sZXMgY3JlYXRlOm9yZ2FuaXphdGlvbl9pbnZpdGF0aW9ucyByZWFkOm9yZ2FuaXphdGlvbl9pbnZpdGF0aW9ucyBkZWxldGU6b3JnYW5pemF0aW9uX2ludml0YXRpb25zIHJlYWQ6b3JnYW5pemF0aW9uc19zdW1tYXJ5IGNyZWF0ZTphY3Rpb25zX2xvZ19zZXNzaW9ucyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.g2jTAACEk34hjpWa0zp6bEYOGZ1CSvGca2z1II3tywQskKyt4Y5Hdl6--qClVP7BiJswDaCUGxjaC8p6EwqH4Jz9a-ENh8HMNq60-YXsulsiNStKGgW0_80E5gCoPHHXXQtGNSQG0e1Wjo4f8sCD0_tXvWgD4EYe7114vrzt3lLwcnkAkwMspgYhSwa6vchhsTkrwYpIhM1BjuKiYIPTmgFyUcNCqRiRtg7YTTMHZOhEFqm36P4owRwqW9r7nC2bA1cibKNN9DpK_5urNsa7XFLX7IPXmdHOY2LIx4JLOVY0osGW8cFv8UZwKO1YqobChI2LKvf-IAU0f3SwVaXs7g");        
    let requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
        
    fetch("https://dev-vr0ctqj811up1px7.us.auth0.com/api/v2/users/auth0%7C6373c89bc3cfed678ac0bb64", requestOptions)
        .then(response => response.text())
        .then(result => {
            userAccount = JSON.parse(result);
            let profileI = userAccount.name[0];
            profileI = profileI.toUpperCase();
            profile.innerText = profileI;
            if(userAccount.user_metadata.likedWorks) {
                likedArray = userAccount.user_metadata.likedWorks;
            }
        })
        .catch(error => console.log('error', error));
}

const updateUserMeta = async () => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlVHYWpsRHE2Snl2NzNHNUhXTndaRSJ9.eyJpc3MiOiJodHRwczovL2Rldi12cjBjdHFqODExdXAxcHg3LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJFcVRpdVU0ckgzY2pMMHJwN3d2RmNRQWt3NE1tWkxQUUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9kZXYtdnIwY3RxajgxMXVwMXB4Ny51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTY2ODY2MzMyNCwiZXhwIjoxNjY5MjY4MTI0LCJhenAiOiJFcVRpdVU0ckgzY2pMMHJwN3d2RmNRQWt3NE1tWkxQUSIsInNjb3BlIjoicmVhZDpjbGllbnRfZ3JhbnRzIGNyZWF0ZTpjbGllbnRfZ3JhbnRzIGRlbGV0ZTpjbGllbnRfZ3JhbnRzIHVwZGF0ZTpjbGllbnRfZ3JhbnRzIHJlYWQ6dXNlcnMgdXBkYXRlOnVzZXJzIGRlbGV0ZTp1c2VycyBjcmVhdGU6dXNlcnMgcmVhZDp1c2Vyc19hcHBfbWV0YWRhdGEgdXBkYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBkZWxldGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgcmVhZDp1c2VyX2N1c3RvbV9ibG9ja3MgY3JlYXRlOnVzZXJfY3VzdG9tX2Jsb2NrcyBkZWxldGU6dXNlcl9jdXN0b21fYmxvY2tzIGNyZWF0ZTp1c2VyX3RpY2tldHMgcmVhZDpjbGllbnRzIHVwZGF0ZTpjbGllbnRzIGRlbGV0ZTpjbGllbnRzIGNyZWF0ZTpjbGllbnRzIHJlYWQ6Y2xpZW50X2tleXMgdXBkYXRlOmNsaWVudF9rZXlzIGRlbGV0ZTpjbGllbnRfa2V5cyBjcmVhdGU6Y2xpZW50X2tleXMgcmVhZDpjb25uZWN0aW9ucyB1cGRhdGU6Y29ubmVjdGlvbnMgZGVsZXRlOmNvbm5lY3Rpb25zIGNyZWF0ZTpjb25uZWN0aW9ucyByZWFkOnJlc291cmNlX3NlcnZlcnMgdXBkYXRlOnJlc291cmNlX3NlcnZlcnMgZGVsZXRlOnJlc291cmNlX3NlcnZlcnMgY3JlYXRlOnJlc291cmNlX3NlcnZlcnMgcmVhZDpkZXZpY2VfY3JlZGVudGlhbHMgdXBkYXRlOmRldmljZV9jcmVkZW50aWFscyBkZWxldGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGNyZWF0ZTpkZXZpY2VfY3JlZGVudGlhbHMgcmVhZDpydWxlcyB1cGRhdGU6cnVsZXMgZGVsZXRlOnJ1bGVzIGNyZWF0ZTpydWxlcyByZWFkOnJ1bGVzX2NvbmZpZ3MgdXBkYXRlOnJ1bGVzX2NvbmZpZ3MgZGVsZXRlOnJ1bGVzX2NvbmZpZ3MgcmVhZDpob29rcyB1cGRhdGU6aG9va3MgZGVsZXRlOmhvb2tzIGNyZWF0ZTpob29rcyByZWFkOmFjdGlvbnMgdXBkYXRlOmFjdGlvbnMgZGVsZXRlOmFjdGlvbnMgY3JlYXRlOmFjdGlvbnMgcmVhZDplbWFpbF9wcm92aWRlciB1cGRhdGU6ZW1haWxfcHJvdmlkZXIgZGVsZXRlOmVtYWlsX3Byb3ZpZGVyIGNyZWF0ZTplbWFpbF9wcm92aWRlciBibGFja2xpc3Q6dG9rZW5zIHJlYWQ6c3RhdHMgcmVhZDppbnNpZ2h0cyByZWFkOnRlbmFudF9zZXR0aW5ncyB1cGRhdGU6dGVuYW50X3NldHRpbmdzIHJlYWQ6bG9ncyByZWFkOmxvZ3NfdXNlcnMgcmVhZDpzaGllbGRzIGNyZWF0ZTpzaGllbGRzIHVwZGF0ZTpzaGllbGRzIGRlbGV0ZTpzaGllbGRzIHJlYWQ6YW5vbWFseV9ibG9ja3MgZGVsZXRlOmFub21hbHlfYmxvY2tzIHVwZGF0ZTp0cmlnZ2VycyByZWFkOnRyaWdnZXJzIHJlYWQ6Z3JhbnRzIGRlbGV0ZTpncmFudHMgcmVhZDpndWFyZGlhbl9mYWN0b3JzIHVwZGF0ZTpndWFyZGlhbl9mYWN0b3JzIHJlYWQ6Z3VhcmRpYW5fZW5yb2xsbWVudHMgZGVsZXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRzIGNyZWF0ZTpndWFyZGlhbl9lbnJvbGxtZW50X3RpY2tldHMgcmVhZDp1c2VyX2lkcF90b2tlbnMgY3JlYXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgZGVsZXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgcmVhZDpjdXN0b21fZG9tYWlucyBkZWxldGU6Y3VzdG9tX2RvbWFpbnMgY3JlYXRlOmN1c3RvbV9kb21haW5zIHVwZGF0ZTpjdXN0b21fZG9tYWlucyByZWFkOmVtYWlsX3RlbXBsYXRlcyBjcmVhdGU6ZW1haWxfdGVtcGxhdGVzIHVwZGF0ZTplbWFpbF90ZW1wbGF0ZXMgcmVhZDptZmFfcG9saWNpZXMgdXBkYXRlOm1mYV9wb2xpY2llcyByZWFkOnJvbGVzIGNyZWF0ZTpyb2xlcyBkZWxldGU6cm9sZXMgdXBkYXRlOnJvbGVzIHJlYWQ6cHJvbXB0cyB1cGRhdGU6cHJvbXB0cyByZWFkOmJyYW5kaW5nIHVwZGF0ZTpicmFuZGluZyBkZWxldGU6YnJhbmRpbmcgcmVhZDpsb2dfc3RyZWFtcyBjcmVhdGU6bG9nX3N0cmVhbXMgZGVsZXRlOmxvZ19zdHJlYW1zIHVwZGF0ZTpsb2dfc3RyZWFtcyBjcmVhdGU6c2lnbmluZ19rZXlzIHJlYWQ6c2lnbmluZ19rZXlzIHVwZGF0ZTpzaWduaW5nX2tleXMgcmVhZDpsaW1pdHMgdXBkYXRlOmxpbWl0cyBjcmVhdGU6cm9sZV9tZW1iZXJzIHJlYWQ6cm9sZV9tZW1iZXJzIGRlbGV0ZTpyb2xlX21lbWJlcnMgcmVhZDplbnRpdGxlbWVudHMgcmVhZDphdHRhY2tfcHJvdGVjdGlvbiB1cGRhdGU6YXR0YWNrX3Byb3RlY3Rpb24gcmVhZDpvcmdhbml6YXRpb25zIHVwZGF0ZTpvcmdhbml6YXRpb25zIGNyZWF0ZTpvcmdhbml6YXRpb25zIGRlbGV0ZTpvcmdhbml6YXRpb25zIGNyZWF0ZTpvcmdhbml6YXRpb25fbWVtYmVycyByZWFkOm9yZ2FuaXphdGlvbl9tZW1iZXJzIGRlbGV0ZTpvcmdhbml6YXRpb25fbWVtYmVycyBjcmVhdGU6b3JnYW5pemF0aW9uX2Nvbm5lY3Rpb25zIHJlYWQ6b3JnYW5pemF0aW9uX2Nvbm5lY3Rpb25zIHVwZGF0ZTpvcmdhbml6YXRpb25fY29ubmVjdGlvbnMgZGVsZXRlOm9yZ2FuaXphdGlvbl9jb25uZWN0aW9ucyBjcmVhdGU6b3JnYW5pemF0aW9uX21lbWJlcl9yb2xlcyByZWFkOm9yZ2FuaXphdGlvbl9tZW1iZXJfcm9sZXMgZGVsZXRlOm9yZ2FuaXphdGlvbl9tZW1iZXJfcm9sZXMgY3JlYXRlOm9yZ2FuaXphdGlvbl9pbnZpdGF0aW9ucyByZWFkOm9yZ2FuaXphdGlvbl9pbnZpdGF0aW9ucyBkZWxldGU6b3JnYW5pemF0aW9uX2ludml0YXRpb25zIHJlYWQ6b3JnYW5pemF0aW9uc19zdW1tYXJ5IGNyZWF0ZTphY3Rpb25zX2xvZ19zZXNzaW9ucyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.g2jTAACEk34hjpWa0zp6bEYOGZ1CSvGca2z1II3tywQskKyt4Y5Hdl6--qClVP7BiJswDaCUGxjaC8p6EwqH4Jz9a-ENh8HMNq60-YXsulsiNStKGgW0_80E5gCoPHHXXQtGNSQG0e1Wjo4f8sCD0_tXvWgD4EYe7114vrzt3lLwcnkAkwMspgYhSwa6vchhsTkrwYpIhM1BjuKiYIPTmgFyUcNCqRiRtg7YTTMHZOhEFqm36P4owRwqW9r7nC2bA1cibKNN9DpK_5urNsa7XFLX7IPXmdHOY2LIx4JLOVY0osGW8cFv8UZwKO1YqobChI2LKvf-IAU0f3SwVaXs7g");
    myHeaders.append("Cookie", "did=s%3Av0%3Afb644f50-662d-11ed-8d3f-d12458b924f4.Lsxlt4Wn0nGUkEg%2FKswDsDX0jNIrSp8XKSS9gCLTJJM; did_compat=s%3Av0%3Afb644f50-662d-11ed-8d3f-d12458b924f4.Lsxlt4Wn0nGUkEg%2FKswDsDX0jNIrSp8XKSS9gCLTJJM");

    let raw = JSON.stringify({
        "user_metadata": {
           "likedWorks": [...likedArray]
        }
    });

    let requestOptions = {
        method: 'PATCH',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://dev-vr0ctqj811up1px7.us.auth0.com/api/v2/users/auth0%7C6373c89bc3cfed678ac0bb64", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));   
}

let showProfile = () => {
    let imageTitle,imageDesc,imageURL;
    imageCont.innerHTML='';
    likedHead.classList.remove("invisible");
    pageNav.classList.add("invisible");
    if(likedArray.length) {
        for (let i = 0; i < likedArray.length; i++) {
            imageTitle = likedArray[i].title;
            imageDesc = likedArray[i].description;
            imageURL = likedArray[i].url; 
            imageCont.innerHTML += `<div class="box"><div class="body"><div class="imgContainer fancy-border"><img src="${imageURL}" alt=""></div><div class="content d-flex flex-column align-items-center justify-content-center"><div><h3 class="text-white fs-5">${imageTitle}</h3><p class="fs-6 text-white">${imageDesc}</p></div></div></div></div>`;
        }
    }
}

/* Asynchronous function for fetching ARTIC artworks from search */
async function getWorks(searchString) {
    /* Local variables */
    let artPieces = [], imageURL, imageTitle, imageDesc, pgLimit;
    artArray = [];
    imageCont.innerHTML='';
    likedHead.classList.add("invisible");

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
             artArray.push({"title":imageTitle, "url":imageURL, "description":imageDesc});
             imageCont.innerHTML += `<div class="box"><div class="body"><div class="imgContainer fancy-border"><img src="${imageURL}" alt=""></div><div class="content d-flex flex-column align-items-center justify-content-center"><div><h3 class="text-white fs-6">${imageTitle}</h3><p class="text-white">${imageDesc}</p><button class="btn btn-secondary btn-sm btn-like" data-index="${i}">LIKE</button></div></div></div></div>`;
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
    likedHead.classList.add("invisible");
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
