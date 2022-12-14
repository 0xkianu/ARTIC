https://0xkianu.github.io/ARTIC/

The Art Institute of Chicago needs a new website to search their artwork. They have an api available for you to use to retrieve images: https://api.artic.edu/docsLinks to an external site.

They have asked for the following to be included in the design.

1. Artwork should be searchable by text

2. There should be no more than 16 art pieces on a page at one time and artwork should be paginated

3. Clicking on the artwork should give you more information on the artist using some the fields here: https://api.artic.edu/docs/#collections-2Links to an external site.

----

ExtraRequest

The Art institute of Chicago wants to add more artwork to their collections. It asks the following:

1. Added use of additional API, Dall-e https://beta.openai.com/docs/introduction/overviewLinks to an external site.
    * TO USE THIS FUNCTIONALITY YOU MUST PULL FROM GITHUB, AND RUN LOCALLY.  YOU WILL ALSO NEED TO CREATE A FILE IN SAME DIRECTORY AS INDEX.HTML NAMED CONFIG.JS WITH THE FOLLOWING VARIABLE.  YOU WILL NEED TO GET YOUR OWN API KEY  FROM THE SITE:
    
    var config = {
	    MY_KEY: 'API KEY'
    }

2. Added landing page, using bootstrap, and modified the theme to my liking.

3. Added authentication login / logout functionality using Auth0 API.
    * IF YOU CHOOSE TO PULL THIS REPO AND RUN LOCALLY VIA CODE RUNNER ON PORT 5500, CHANGE THE VARIABLE VALUE client_id IN THE configureClient function of script.js to value nLBVmQO7go1ZZewUtOKjo2gGkGIilzV3

4. Add a liked list using Auth0 user metadata storage.  User can display liked list by clicking on profile button located by sign in/out.
